/**
 * @description Custom Elements Manifest analyzer plugin. Reads this package's mixin pattern,
 * class X extends Mixin(LitElement).with(MainDomElementMixin, ...), which the analyzer misreads.
 * Sets the superclass to the Mixin() argument and the mixins to the with() arguments, each with the package or module it's imported from.
 * @param {Object} opts - Options. None yet.
 * @returns {Object} Analyzer plugin.
 */
export default function mixinHeritagePlugin(opts={}) {
  // 'module path#class name' -> { superclass, mixins }
  const heritage = new Map();

  /**
   * @description Gets a manifest reference for an identifier: its name, and the package (bare import) or module (relative import) it comes from.
   * @param {Object} ts - TypeScript.
   * @param {Object} sourceFile - The module's AST.
   * @param {String} name - Identifier, e.g. 'LitElement'.
   * @param {String} modulePath - The module's path, used when the identifier isn't imported.
   * @returns {Object} e.g. { name: 'LitElement', package: 'lit' }
   */
  const reference = (ts, sourceFile, name, modulePath) => {
    for ( const statement of sourceFile.statements ) {
      if ( !ts.isImportDeclaration(statement) ) continue;
      const bindings = statement.importClause?.namedBindings;
      const named = bindings && ts.isNamedImports(bindings) ? bindings.elements.map(el => el.name.text) : [];
      const isDefault = statement.importClause?.name?.text === name;
      if ( !isDefault && !named.includes(name) ) continue;
      const specifier = statement.moduleSpecifier.text;
      return specifier.startsWith('.') ? { name, module: specifier } : { name, package: specifier };
    }
    return { name, module: modulePath };
  };

  return {
    name: 'cork-mixin-heritage',

    /**
     * @description Records the superclass and mixins of each class that extends Mixin(Base).with(...).
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.ts - TypeScript.
     * @param {Object} args.node - AST node.
     * @param {Object} args.moduleDoc - The module's manifest entry so far.
     */
    analyzePhase({ ts, node, moduleDoc }) {
      if ( !ts.isClassDeclaration(node) || !node.name ) return;
      const expression = node.heritageClauses
        ?.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)
        ?.types[0]?.expression;

      // Mixin(Base).with(A, B): a call of a .with property on a call of Mixin
      if ( !expression || !ts.isCallExpression(expression) || !ts.isPropertyAccessExpression(expression.expression) ) return;
      const withAccess = expression.expression;
      if ( withAccess.name.text !== 'with' || !ts.isCallExpression(withAccess.expression) ) return;
      const mixinCall = withAccess.expression;
      if ( mixinCall.expression.getText() !== 'Mixin' || !mixinCall.arguments[0] ) return;

      const sourceFile = node.getSourceFile();
      heritage.set(`${moduleDoc.path}#${node.name.getText()}`, {
        superclass: reference(ts, sourceFile, mixinCall.arguments[0].getText(), moduleDoc.path),
        mixins: expression.arguments.map(arg => reference(ts, sourceFile, arg.getText(), moduleDoc.path))
      });
    },

    /**
     * @description Replaces the analyzer's superclass and mixins with the recorded ones.
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.customElementsManifest - The whole manifest.
     */
    packageLinkPhase({ customElementsManifest }) {
      for ( const mod of customElementsManifest.modules ) {
        for ( const decl of mod.declarations || [] ) {
          const recorded = heritage.get(`${mod.path}#${decl.name}`);
          if ( !recorded ) continue;
          decl.superclass = recorded.superclass;
          decl.mixins = recorded.mixins;
        }
      }
    }
  };
}
