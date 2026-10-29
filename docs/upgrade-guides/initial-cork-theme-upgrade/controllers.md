# Controllers

The Lit reactive controllers moved from `@ucd-lib/theme-elements` to `utils/controllers/` in `@ucd-lib/cork-theme`. This section is in progress and grows as more controllers move over.

## Steps

1. Find imports of the old controllers:

   ```
   grep -rnE "theme-elements/utils/controllers" --include=*.js src
   ```

2. Change the import path:

   | Old | New |
   | --- | --- |
   | `@ucd-lib/theme-elements/utils/controllers` | `@ucd-lib/cork-theme/utils/controllers` |
   | `@ucd-lib/theme-elements/utils/controllers/index.js` | `@ucd-lib/cork-theme/utils/controllers` |

   For example:

   ```js
   import { MutationObserverController } from '@ucd-lib/cork-theme/utils/controllers';
   ```

## Moved so far

| Controller | Changes |
| --- | --- |
| `MutationObserverController` | None when imported from `utils/controllers`. Its file was renamed from `mutation-observer.js` to `MutationObserverController.js`, and it is now the default export: change `import { MutationObserverController } from '.../mutation-observer.js'` to `import MutationObserverController from '@ucd-lib/cork-theme/utils/controllers/MutationObserverController.js'`, or import it from `utils/controllers` instead. |

## Not yet moved

- `BreakPointsController`
- `IntersectionObserverController`
- `PageWidthController`
- `PopStateObserverController`
- `SilsPrimoController`
- `WaitController`
