// Static members that are Lit plumbing rather than API, as in the reference docs
const STATIC_EXCLUDED = ['shadowRootOptions'];

/**
 * @description Custom Elements Manifest analyzer plugin. Removes private API from custom elements: members and attributes
 * whose name starts with an underscore (including Lit state properties, which all do in this package), and any member the analyzer
 * marks as Lit state, and Lit's static shadowRootOptions (see STATIC_EXCLUDED). Public members such as ctl are kept.
 * @param {Object} opts - Options. None yet.
 * @returns {Object} Analyzer plugin.
 */
export default function dropPrivatePlugin(opts={}) {
  const isPrivate = name => (name || '').startsWith('_');
  const isExcludedStatic = member => member.static && STATIC_EXCLUDED.includes(member.name);

  return {
    name: 'cork-drop-private',

    /**
     * @description Filters the members and attributes of each custom element declaration.
     * @param {Object} args - Analyzer phase arguments.
     * @param {Object} args.customElementsManifest - The whole manifest.
     */
    packageLinkPhase({ customElementsManifest }) {
      for ( const mod of customElementsManifest.modules ) {
        for ( const decl of mod.declarations || [] ) {
          if ( !decl.customElement ) continue;
          if ( decl.members ) decl.members = decl.members.filter(member => !isPrivate(member.name) && !member.state && !isExcludedStatic(member));
          if ( decl.attributes ) decl.attributes = decl.attributes.filter(attr => !isPrivate(attr.name) && !isPrivate(attr.fieldName));
        }
      }
    }
  };
}
