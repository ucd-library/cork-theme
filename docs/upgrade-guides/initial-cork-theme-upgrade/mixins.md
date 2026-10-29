# Mixins

The Lit element mixins moved from `@ucd-lib/theme-elements` to `utils/mixins/` in `@ucd-lib/cork-theme`. This section is in progress and grows as more mixins move over.

## Steps

1. Find imports of the old mixins:

   ```
   grep -rnE "theme-elements/utils/mixins|MainDomElement\b" --include=*.js src
   ```

2. Change the import path:

   | Old | New |
   | --- | --- |
   | `@ucd-lib/theme-elements/utils/mixins` | `@ucd-lib/cork-theme/utils/mixins` |
   | `@ucd-lib/theme-elements/utils/mixins/index.js` | `@ucd-lib/cork-theme/utils/mixins` |

3. Rename `MainDomElement` to `MainDomElementMixin` wherever it is imported or used. For example:

   ```js
   import { Mixin, MainDomElementMixin } from '@ucd-lib/cork-theme/utils/mixins';

   export default class MyElement extends Mixin(LitElement).with(MainDomElementMixin) {
   ```

## Moved so far

| Mixin | Changes |
| --- | --- |
| `Mixin` | None |
| `MainDomElement` | Renamed to `MainDomElementMixin`, and its file from `main-dom-element.js` to `MainDomElementMixin.js`. If imported directly from the file, it is now the default export: change `import { MainDomElement } from '.../main-dom-element.js'` to `import MainDomElementMixin from '@ucd-lib/cork-theme/utils/mixins/MainDomElementMixin.js'`, or import it from `utils/mixins` instead. |

## Not yet moved

- `NavElement`
