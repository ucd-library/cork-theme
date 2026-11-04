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

## NavController

New. It replaces the `NavElement` mixin's parsing: it reads the menu markup in an element's light DOM into `navItems`, and re-parses when that markup changes.

```js
import { NavController } from '@ucd-lib/cork-theme/utils/controllers';

this.ctl = { nav: new NavController(this) };
```

The markup it reads is described in [Nav Markup](nav-markup.md). The field attribute (default `data-nav`) can be changed with the `fieldAttribute` option: `new NavController(this, { fieldAttribute: 'data-my-nav' })`.

Each item has `title`, `href`, `target`, `disabled`, `ariaLabel`, `fields` (e.g. `fields.description`), `subItems`, `navPosition` (e.g. `[0, 2]`, for `getNavItem()`), `ele`, the light DOM link/button, and `click`.

- `item.render({ classes })` renders the item's own button, link, or (with no href) span, with click handling done. `classes` is a string or a `classMap` object, and a plain string works as shorthand: `item.render('menu__link')`.
- Elements that render items themselves use `item.click` as a button's click listener (e.g. `@click=${item.click}`). It passes the click through to `ele`, so click handlers on the user's buttons still run.
- Links aren't passed through: the shadow DOM link navigates by its `href`, so click handlers on the user's `<a>` elements don't run. SPA routers that use `event.composedPath()`, such as cork-app-state's, still intercept them.
- `is-open`, `mobile-only`, `desktop-only` and icons aren't supported yet.

## Not yet moved

- `BreakPointsController`
- `IntersectionObserverController`
- `PageWidthController`
- `PopStateObserverController`
- `SilsPrimoController`
- `WaitController`
