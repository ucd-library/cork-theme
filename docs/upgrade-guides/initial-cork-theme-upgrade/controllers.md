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
| `PageWidthController` | See [PageWidthController](#pagewidthcontroller). |

## NavController

New. It replaces the `NavElement` mixin's parsing: it reads the menu markup in an element's light DOM into `navItems`, and re-parses when that markup changes.

```js
import { NavController } from '@ucd-lib/cork-theme/utils/controllers';

this.ctl = { nav: new NavController(this) };
```

The markup it reads is described in [Nav Markup](nav-markup.md). The field attribute (default `data-nav`) can be changed with the `fieldAttribute` option: `new NavController(this, { fieldAttribute: 'data-my-nav' })`.

Each item has `title`, `href`, `target`, `disabled`, `ariaLabel`, `fields` (e.g. `fields.description`), `subItems`, `navPosition` (e.g. `[0, 2]`, for `getNavItem()`), `ele`, the light DOM link/button, and `click`.

- `item.render({ classes })` renders the item's own button, link, or (with no href) span, with click handling done. `classes` is a string or a `classMap` object, and a plain string works as shorthand: `item.render('menu__link')`.
- Elements that render items themselves use `item.click` as a button's or link's click listener (e.g. `@click=${item.click}`). `item.render()` does this already.
- `item.click` fires `cork-nav-item-click` from the host (bubbling and composed), with `detail.navItem` and `detail.originalEvent` (the click). For a copied item (see `copyNavItems` below), `detail.navItem` is the copy.
- For buttons, it then passes the click through to `ele`, so click handlers on the user's buttons still run.
- Links aren't passed through: the shadow DOM link navigates by its `href`, so click handlers on the user's `<a>` elements don't run. Listen for `cork-nav-item-click` instead. SPA routers that use `event.composedPath()`, such as cork-app-state's, still intercept them.
- `item.matchesCoordinates(navPosition)` is true if the item is at exactly that position. `item.containsCoordinates(navPosition)` is also true for its ancestors, e.g. for highlighting the branch leading to a focused item.
- `item.renderedEles` holds the item's elements in the shadow DOM once rendered: `item` (from `item.render()`), and in the drill-down `linkToSubmenu` (the toggle button) and `submenu`. `item.focus(key)` focuses one of them (default `item`) and returns whether it took focus, e.g. `item.focus('linkToSubmenu')`.
- `is-open`, `mobile-only`, `desktop-only` and icons aren't supported yet.

Each parse fires a `cork-nav-items-update` event from the host (bubbling and composed), with `detail.navItems`.

To show another controller's items instead of parsing the host's own markup (as `cork-nav-lite` does with `copy-from-primary-nav`):

```js
new NavController(this, { noParseHostProperty: 'copyFromPrimaryNav' });

// later, e.g. on the other host's cork-nav-items-update event
this.ctl.nav.copyNavItems(otherController.navItems, { sliceEnd: 3 });
```

- `noParseHostProperty`: names a host property. While it's truthy, the light DOM isn't parsed, so the copies aren't overwritten.
- `copyNavItems(navItems, opts)` replaces `navItems` with copies and re-renders. The copies share nothing with the originals except `ele`, so button clicks still pass through to the original buttons. Their `renderedEles` start empty. Options: `sliceEnd` copies only the first n items; `copySubItems` (default `false`) copies sub items too.

For a drill-down (`renderDrillDown()`), two behaviors from campus's nav-drill.js are opt-in:

```js
new NavController(this, { closeSubmenusOnEscape: true, setChildHeight: true });
```

- `closeSubmenusOnEscape`: Escape closes the submenu that has focus (moving up a level), or all submenus if focus isn't in one, instead of closing the `cork-header` tray.
- `setChildHeight`: on narrow screens (999px or less), sizes the open submenus to the deepest one, since submenus from level 3 down are absolutely positioned.

Opening or closing a submenu always moves focus into it (its own link, or its first focusable item) or back to its toggle, and scrolls the other submenus back to the top. `cork-primary-nav` turns both options on.

## PageWidthController

Sets `--page-width` (the page width minus any scrollbar), which the theme's `--full-width` and layout classes such as `l-full-width` are derived from.

`cork-header` now runs one itself, so apps with a `cork-header` can remove their `(new PageWidthController).init()` call. To keep your own instead, set `no-page-width` on the header.

Otherwise, the old call still works. Changes:

- The file is `PageWidthController.js`, and the class is its default export. Importing it from `utils/controllers` works as before.
- It no longer sets `--full-width`. The theme's CSS sets that.
- It can take a Lit host as its first argument, and then starts and stops with the host: `new PageWidthController(this)`. With `shouldInit`, it only starts if that returns true: `new PageWidthController(this, { shouldInit: () => !this.noPageWidth })`.
- The property is set in a `<style id="cork-theme-page-width">` tag rather than inline on `<html>`. The `root` and `selector` options set it on a shadow root instead, like `setImageCssCustomProperties()`: `new PageWidthController(this, { root: this.renderRoot })`.
- The resize listener is now actually removed by `destroy()`, and `init()` no longer adds a second one when called twice.

## Not yet moved

- `BreakPointsController`
- `IntersectionObserverController`
- `PopStateObserverController`
- `SilsPrimoController`
- `WaitController`
