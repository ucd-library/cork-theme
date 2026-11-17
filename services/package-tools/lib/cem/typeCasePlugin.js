// Lit property types (type: Boolean etc.) the analyzer copies as is, mapped to the TypeScript names the CEM spec uses
const PRIMITIVES = { Boolean: 'boolean', String: 'string', Number: 'number' };
const PRIMITIVE_RE = new RegExp(`\\b(${Object.keys(PRIMITIVES).join('|')})\\b`, 'g');

/**
 * @description Custom Elements Manifest analyzer plugin. Lowercases the primitive type names the analyzer reads from Lit
 * properties and JSDoc, e.g. Boolean -> boolean and Number[] -> number[], in the members (including method parameters and
 * return types) and attributes of custom elements.
 * Tools that read the manifest, such as api-viewer's knobs, expect the lowercase TypeScript names.
 * @param {Object} opts - Options. None yet.
 * @returns {Object} Analyzer plugin.
 */
export default function typeCasePlugin(opts={}) {

  /**
   * @description Lowercases the primitive type names in an item's type text, and in its parameters and return type, if it has them.
   * @param {Object} item - A member, attribute or parameter.
   */
  const fixType = item => {
    for ( const type of [item.type, item.return?.type] ) {
      if ( type?.text ) type.text = type.text.replace(PRIMITIVE_RE, name => PRIMITIVES[name]);
    }
    (item.parameters || []).forEach(fixType);
  };

  return {
    name: 'cork-type-case',

    /**
     * @description Fixes the type text of each custom element's members and attributes.
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.customElementsManifest - The whole manifest.
     */
    packageLinkPhase({ customElementsManifest }) {
      for ( const mod of customElementsManifest.modules ) {
        for ( const decl of mod.declarations || [] ) {
          if ( !decl.customElement ) continue;
          (decl.members || []).forEach(fixType);
          (decl.attributes || []).forEach(fixType);
        }
      }
    }
  };
}
