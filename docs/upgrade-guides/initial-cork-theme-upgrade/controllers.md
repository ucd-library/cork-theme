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

Each item has `title`, `href`, `target`, `disabled`, `active` (marked with `data-active`), `ariaLabel`, `fields` (e.g. `fields.description`), `subItems`, `navPosition` (e.g. `[0, 2]`, for `getNavItem()`), `ele`, the light DOM link/button, and `click`.

- `item.render({ classes })` renders the item's own button, link, or (with no href) span, with click handling done. `classes` is a string or a `classMap` object, and a plain string works as shorthand: `item.render('menu__link')`. `activeClass` (a string or `classMap` object) is added if the item is active, and active items get `aria-current` (`page` on links, `true` on buttons).
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

For a drill-down (`renderDrillDown()`), three behaviors from campus's nav-drill.js are opt-in:

```js
new NavController(this, { closeSubmenusOnEscape: true, setChildHeight: true });
```

- `closeSubmenusOnEscape`: Escape closes the submenu that has focus (moving up a level), or all submenus if focus isn't in one, instead of closing the `cork-header` tray.
- `setChildHeight`: on narrow screens (999px or less), sizes the open submenus to the deepest one, since submenus from level 3 down are absolutely positioned.
- `autoHeightHostProperty`: the name of a host property that turns on campus's auto height (`nav-drill--auto-height`) while truthy. On wide screens the drill-down is as tall as its first menu level, and follows that menu's size; on narrow screens its height is `auto`. `cork-nav-sub` passes `'autoHeight'`, for its `auto-height` attribute.

Opening or closing a submenu always moves focus into it (its own link, or its first focusable item) or back to its toggle, and scrolls the other submenus back to the top. `cork-primary-nav` turns both options on.

## HeadingController

New. It reads a heading in an element's light DOM, for the element to render in its shadow DOM, and re-parses when that markup changes. `cork-nav-sub` uses it for its title, in place of `ucd-theme-subnav`'s `nav-title`, `title-href` and `title-click-event` attributes.

```js
import { HeadingController } from '@ucd-lib/cork-theme/utils/controllers';

this.ctl = { heading: new HeadingController(this) };
```

- The heading is the host's first direct child that is an `h1`-`h6`, or that has the `data-heading` attribute (e.g. `<div data-heading>`, for a title that shouldn't be a heading). The attribute can be changed with the `headingAttribute` option. Giving it a level, e.g. `<div data-heading="h2">`, adds the matching `.h1`-`.h6` class, so the element looks like that heading level.
- It's rendered with the same tag, unless the element passes `tag`. Its text can be wrapped in an `<a>` or `<button>`.
- `this.ctl.heading.render({ classes, typeClasses, linkClasses, tag })` renders it, or nothing if there's no heading. `typeClasses` adds classes by content (`a`, `button` or `text`), and `linkClasses` goes on the link or button.
- Include `...HeadingController.styles` in the element's styles, for the `h1`-`h6` and `.h1`-`.h6` styles.
- Clicks work as for `NavController` items: a `cork-heading-click` event (with `detail.heading` and `detail.originalEvent`), then, for buttons, the click is passed through to the light DOM button.
- When the heading changes (including the first parse on connection, if there is one), `cork-heading-update` fires, with `detail.heading` (null if it was removed). Light DOM changes that leave the heading as it was, such as menu edits in `cork-nav-sub`, don't fire it or re-render the host.

## PopoverController

New. It wires up a button and a popover in an element's shadow DOM with the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), in place of campus's popover script, which can't see into shadow roots. `cork-nav-sub-popover` uses it for its tray.

```js
import { PopoverController } from '@ucd-lib/cork-theme/utils/controllers';
import { ref } from 'lit/directives/ref.js';

this.ctl = { popover: new PopoverController(this) };

// in the template
html`
  <button ${ref(this.ctl.popover.buttonRef)}>Filters</button>
  <div ${ref(this.ctl.popover.popoverRef)}>…</div>
`;
```

- It adds the `popover` attribute (the `type` option, default `auto`), unless the template sets it, and links the button to the popover with `popoverTargetElement`, so no ids are needed.
- When the popover opens, focus moves to its first focusable element. Turn this off with `focusOnOpen: false`.
- `show()`, `hide()`, `toggle()` and `isOpen` open, close and check it from code.
- `cork-popover-toggle` fires from the element when it opens or closes, with `detail.open`. The native `toggle` event doesn't leave the shadow root.
- The browser does the rest: light dismiss (clicking outside or pressing Escape), returning focus to the button, and the button's ARIA state. If something in the popover cancels an Escape keydown, as `NavController` does when it closes a submenu, the popover stays open.

## ScriptPropsController

New. It sets an element's properties from a JSON script tag in its light DOM, so a server-rendered page can give the element its starting state without page JavaScript.

```js
import { ScriptPropsController } from '@ucd-lib/cork-theme/utils/controllers';

this.ctl = { scriptProps: new ScriptPropsController(this) };
```

```html
<my-results>
  <script type="application/json">
    { "query": "cats", "page": 2, "filters": { "format": "book" } }
  </script>
</my-results>
```

- It reads the first direct child `script[type="application/json"]`, or the tag matched by the `selector` option, when the element connects (before its first render) and whenever the script's text changes.
- Only the element's declared reactive properties are set, leaving out `state: true` ones. Other keys are skipped with a console warning. Values are assigned as they are, so objects and arrays work, and so do `attribute: false` properties.
- Last write wins: the script overrides defaults and attributes when the element connects, and later attribute or property changes override the script. Removing a key from the JSON doesn't change its property back.
- `setProps(obj)` applies an object with the same checks.

## PageWidthController

Sets `--page-width` (the page width minus any scrollbar), which the theme's `--full-width` and layout classes such as `l-full-width` are derived from.

`cork-header` now runs one itself, so apps with a `cork-header` can remove their `(new PageWidthController).init()` call. To keep your own instead, set `no-page-width` on the header.

Otherwise, the old call still works. Changes:

- The file is `PageWidthController.js`, and the class is its default export. Importing it from `utils/controllers` works as before.
- It no longer sets `--full-width`. The theme's CSS sets that.
- It can take a Lit host as its first argument, and then starts and stops with the host: `new PageWidthController(this)`. With `shouldInit`, it only starts if that returns true: `new PageWidthController(this, { shouldInit: () => !this.noPageWidth })`.
- The property is set in a `<style id="cork-theme-page-width">` tag rather than inline on `<html>`. The `root` and `selector` options set it on a shadow root instead, like `setImageCssCustomProperties()`: `new PageWidthController(this, { root: this.renderRoot })`.
- The resize listener is now actually removed by `destroy()`, and `init()` no longer adds a second one when called twice.

## AppStateController

New. Calls back on cork-app-state's `app-state-update` event, without this package importing cork-app-utils: it finds the `AppStateModel` through `window._corkAppUtils.Registery`. If no `AppStateModel` is registered, it does nothing.

```js
new AppStateController(this, { callback: this._onAppStateUpdate, shouldInit: () => !this.noAppStateClose });
```

- `callback`: a host method name or a function, called with the app state. Default: `'_onAppStateUpdate'`.
- `shouldInit`, `init()` and `destroy()` work as in `PageWidthController`. If the `AppStateModel` is registered after the host connects, call `init()` then.
- The event fires on every app state change, so compare `state.location` to catch navigation only.

`cork-header` uses it to close its tray on navigation.

## Not moving

- `PopStateObserverController`: `popstate` doesn't fire on `pushState`, so it misses SPA link clicks. Use `AppStateController` with cork-app-state, or a plain `popstate` listener.

## Not yet moved

- `BreakPointsController`
- `IntersectionObserverController`
- `SilsPrimoController`
- `WaitController`
