# Mixins

The Lit element mixins moved from `@ucd-lib/theme-elements` to `utils/mixins/` in `@ucd-lib/cork-theme`. This section is in progress and grows as more mixins move over.

## Steps

1. Find imports of the old mixins:

   ```
   grep -rnE "theme-elements/utils/mixins" --include=*.js src
   ```

2. Change the import path:

   | Old | New |
   | --- | --- |
   | `@ucd-lib/theme-elements/utils/mixins` | `@ucd-lib/cork-theme/utils/mixins` |
   | `@ucd-lib/theme-elements/utils/mixins/index.js` | `@ucd-lib/cork-theme/utils/mixins` |

   For example:

   ```js
   import { Mixin, MainDomElement } from '@ucd-lib/cork-theme/utils/mixins';
   ```

## Moved so far

| Mixin | Changes |
| --- | --- |
| `Mixin` | None |
| `MainDomElement` | None when imported from `utils/mixins`. If imported directly from `main-dom-element.js`, it is now the default export: change `import { MainDomElement } from '.../main-dom-element.js'` to `import MainDomElement from '@ucd-lib/cork-theme/utils/mixins/main-dom-element.js'`, or import it from `utils/mixins` instead. |

## Not yet moved

- `NavElement`
