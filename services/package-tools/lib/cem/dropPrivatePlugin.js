// Static members that are Lit plumbing rather than API, as in the reference docs
const STATIC_EXCLUDED = ['shadowRootOptions'];

/**
 * @description Custom Elements Manifest analyzer plugin. Removes private API from custom elements: members and attributes
 * whose name starts with an underscore, Lit state properties (state: true in static properties, which the analyzer otherwise lists
 * as public fields with an attribute, or members it marks as state), and Lit's static shadowRootOptions (see STATIC_EXCLUDED).
 * Public members such as ctl are kept.
 * @param {Object} opts - Options. None yet.
 * @returns {Object} Analyzer plugin.
 */
export default function dropPrivatePlugin(opts={}) {
  const isPrivate = name => (name || '').startsWith('_');
  const isExcludedStatic = member => member.static && STATIC_EXCLUDED.includes(member.name);

  // names of state properties, keyed by module path and class name, e.g. 'package/elements/cork-pager/cork-pager.js:CorkPager'
  const stateProps = new Map();
  const stateKey = (path, className) => `${path}:${className}`;

  /**
   * @description Gets the names of the properties with state: true in a class's static properties (a getter or a field).
   * @param {Object} ts - The TypeScript module the analyzer passes to plugins.
   * @param {Object} classNode - A class declaration node.
   * @returns {String[]}
   */
  const getStateProps = (ts, classNode) => {
    const member = classNode.members.find(m =>
      m.name?.getText() === 'properties' && m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword)
    );
    let obj = member?.initializer;
    if ( !obj && member?.body ) obj = member.body.statements.find(ts.isReturnStatement)?.expression;
    if ( !obj || !ts.isObjectLiteralExpression(obj) ) return [];

    return obj.properties
      .filter(prop => ts.isPropertyAssignment(prop) && ts.isObjectLiteralExpression(prop.initializer))
      .filter(prop => prop.initializer.properties.some(opt =>
        opt.name?.getText() === 'state' && opt.initializer?.kind === ts.SyntaxKind.TrueKeyword
      ))
      .map(prop => prop.name.getText());
  };

  return {
    name: 'cork-drop-private',

    /**
     * @description Records each class's state properties, which the analyzer doesn't mark, for packageLinkPhase to drop.
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.ts - The TypeScript module.
     * @param {Object} args.node - The node being visited.
     * @param {Object} args.moduleDoc - The module's manifest entry.
     */
    analyzePhase({ ts, node, moduleDoc }) {
      if ( !ts.isClassDeclaration(node) || !node.name ) return;
      const names = getStateProps(ts, node);
      if ( names.length ) stateProps.set(stateKey(moduleDoc.path, node.name.getText()), names);
    },

    /**
     * @description Filters the members and attributes of each custom element declaration.
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.customElementsManifest - The whole manifest.
     */
    packageLinkPhase({ customElementsManifest }) {
      for ( const mod of customElementsManifest.modules ) {
        for ( const decl of mod.declarations || [] ) {
          if ( !decl.customElement ) continue;
          const state = stateProps.get(stateKey(mod.path, decl.name)) || [];
          const isState = name => state.includes(name);
          if ( decl.members ) decl.members = decl.members.filter(member => !isPrivate(member.name) && !member.state && !isState(member.name) && !isExcludedStatic(member));
          if ( decl.attributes ) decl.attributes = decl.attributes.filter(attr => !isPrivate(attr.name) && !isPrivate(attr.fieldName) && !isState(attr.fieldName));
        }
      }
    }
  };
}
