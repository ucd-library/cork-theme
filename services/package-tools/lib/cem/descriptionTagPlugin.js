/**
 * @description Custom Elements Manifest analyzer plugin. Uses the @description tag as the description of classes and their members,
 * since this package's JSDoc puts descriptions in @description tags, which the analyzer ignores (it only reads a block's untagged text).
 * Only fills in descriptions the analyzer left empty, so e.g. a field's description from a class @property row is kept.
 * @param {Object} opts - Options. None yet.
 * @returns {Object} Analyzer plugin.
 */
export default function descriptionTagPlugin(opts={}) {
  // 'module path#class name' -> { description, members: Map(member name -> description) }
  const classes = new Map();

  /**
   * @description Gets the text of a node's @description tags, from its JSDoc blocks.
   * @param {Object} ts - TypeScript.
   * @param {Object} node - AST node.
   * @returns {String}
   */
  const getDescription = (ts, node) => (node.jsDoc || [])
    .flatMap(doc => doc.tags || [])
    .filter(tag => tag.tagName.text === 'description')
    .map(tag => (ts.getTextOfJSDocComment(tag.comment) || '').trim())
    .filter(Boolean)
    .join('\n');

  return {
    name: 'cork-description-tag',

    /**
     * @description Records the @description text of each class and its members.
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.ts - TypeScript.
     * @param {Object} args.node - AST node.
     * @param {Object} args.moduleDoc - The module's manifest entry so far.
     */
    analyzePhase({ ts, node, moduleDoc }) {
      if ( !ts.isClassDeclaration(node) || !node.name ) return;
      const members = new Map();
      for ( const member of node.members ) {
        const name = member.name?.getText();
        const description = getDescription(ts, member);
        if ( name && description ) members.set(name, description);
      }
      classes.set(`${moduleDoc.path}#${node.name.getText()}`, { description: getDescription(ts, node), members });
    },

    /**
     * @description Fills in empty class and member descriptions from the recorded @description text.
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.customElementsManifest - The whole manifest.
     */
    packageLinkPhase({ customElementsManifest }) {
      for ( const mod of customElementsManifest.modules ) {
        for ( const decl of mod.declarations || [] ) {
          const recorded = classes.get(`${mod.path}#${decl.name}`);
          if ( !recorded ) continue;
          if ( !decl.description && recorded.description ) decl.description = recorded.description;
          for ( const member of decl.members || [] ) {
            const description = recorded.members.get(member.name);
            if ( !member.description && description ) member.description = description;
          }
        }
      }
    }
  };
}
