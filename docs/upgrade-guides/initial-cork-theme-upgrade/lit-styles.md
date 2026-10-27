# Lit Styles

The per-partial Lit modules (`*.css.js`) moved from the root of `@ucd-lib/theme-sass` to `styles/js/` in `@ucd-lib/cork-theme`. They are built from campus's redesigned Sass, so some partials were renamed or removed.

## Steps

1. Find imports of the old modules:

   ```
   grep -rnE "@ucd-lib/theme-sass/.*\.css\.js" --include=*.js src
   ```

2. Change the package path. The rest of the path is unchanged for partials campus kept:

   | Old | New |
   | --- | --- |
   | `@ucd-lib/theme-sass/<dir>/<partial>.css.js` | `@ucd-lib/cork-theme/styles/js/<dir>/<partial>.css.js` |
   | `@ucd-lib/theme-sass/normalize.css.js` | `@ucd-lib/cork-theme/styles/js/ucdlib-sass/normalize.css.js` |

   For example, `@ucd-lib/theme-sass/1_base_html/_forms.css.js` becomes `@ucd-lib/cork-theme/styles/js/1_base_html/_forms.css.js`.

3. Replace imports of removed partials (below). If a partial is not in `styles/js/`, campus removed or renamed it.

## Removed partials

Campus removed these partials in the redesign. The candidates are campus's new partials for the same feature; they are not drop-in replacements, so check the markup and class names before switching.

| Old module | Candidate replacement |
| --- | --- |
| `4_component/_mobile-bar.css.js` | `4_component/_header.css.js`, `4_component/_nav-tray-toggle.css.js` |
| `4_component/_nav-off-canvas.css.js` | `4_component/_nav-tray.css.js`, `4_component/_nav-drill.css.js` |
| `4_component/_nav-toggle.css.js` | `4_component/_nav-tray-toggle.css.js` |
| `4_component/_nav-quick.css.js` | `4_component/_nav-quicklinks.css.js` |
| `4_component/_search-popup.css.js` | `4_component/_search-tray.css.js` |
| `4_component/_pagination.css.js` | `4_component/_pager.css.js` |
| `4_component/_messaging-alert.css.js` | `4_component/_alert.css.js` |
| `4_component/_message-area.css.js` | None |
| `5_layout/_l-header.css.js` | `4_component/_header.css.js` |
| `4_component/_slim-select.css.js`, `slim-select.css.js` | None. Not yet decided |

## Notes

- `:root` in campus partials is rewritten to `:host` in the modules, as before, so a component gets those custom properties without the global stylesheet.
- Small images (icons, under 8 KB) are inlined as data URIs, so they work inside components. Large background images (header bars, nav tray, footer) still use relative URLs, which do not resolve inside a component; those components need their own handling.
- The individual object modules (`3_objects/_o-box.css.js` etc.) are not generated, because campus only enables those classes through `3_objects/_index.scss`. Use `3_objects/_index.css.js`.
- `colors.js` moved too; see [Colors](colors.md).
