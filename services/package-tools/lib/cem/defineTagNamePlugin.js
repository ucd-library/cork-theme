/**
 * @description Custom Elements Manifest analyzer plugin. Gets each element's tag name from the default of its static define() method,
 * e.g. static define(tagName='cork-pages'), since the elements don't call customElements.define() with a literal tag name.
 * Marks the class as a custom element, and replaces the bogus definition export the analyzer makes from the
 * customElements.define(tagName, this) call inside define() with one for the real tag name.
 * @param {Object} opts - Options. None yet.
 * @returns {Object} Analyzer plugin.
 */
export default function defineTagNamePlugin(opts={}) {
  // 'module path#class name' -> tag name
  const tagNames = new Map();

  return {
    name: 'cork-define-tag-name',

    /**
     * @description Records the tag name of each class with a static define() whose first parameter defaults to a string.
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.ts - TypeScript.
     * @param {Object} args.node - AST node.
     * @param {Object} args.moduleDoc - The module's manifest entry so far.
     */
    analyzePhase({ ts, node, moduleDoc }) {
      if ( !ts.isClassDeclaration(node) || !node.name ) return;
      const define = node.members.find(member =>
        ts.isMethodDeclaration(member) &&
        member.name?.getText() === 'define' &&
        member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword)
      );
      const initializer = define?.parameters[0]?.initializer;
      if ( !initializer || !ts.isStringLiteral(initializer) ) return;
      tagNames.set(`${moduleDoc.path}#${node.name.getText()}`, initializer.text);
    },

    /**
     * @description Sets customElement and tagName on each recorded class, and its module's custom-element-definition export.
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.customElementsManifest - The whole manifest.
     */
    packageLinkPhase({ customElementsManifest }) {
      for ( const mod of customElementsManifest.modules ) {
        for ( const decl of mod.declarations || [] ) {
          const tagName = tagNames.get(`${mod.path}#${decl.name}`);
          if ( !tagName ) continue;
          decl.customElement = true;
          decl.tagName = tagName;

          // a real tag name has a hyphen; the analyzer's guess from define()'s body is the variable name 'tagName'
          mod.exports = (mod.exports || []).filter(e => !(e.kind === 'custom-element-definition' && !e.name.includes('-')));
          mod.exports.push({
            kind: 'custom-element-definition',
            name: tagName,
            declaration: { name: decl.name, module: mod.path }
          });
        }
      }
    }
  };
}
