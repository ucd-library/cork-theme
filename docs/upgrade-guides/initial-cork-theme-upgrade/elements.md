# Elements

The `ucd-theme-*` elements from `@ucd-lib/theme-elements` are replaced by `cork-*` elements in `@ucd-lib/cork-theme`. This section is in progress and grows as more elements move over.

Import an element by its folder to register it:

```js
import '@ucd-lib/cork-theme/elements/cork-quick-links';
```

The import also returns the element's class. To get the class without registering the element (e.g. to subclass it under your own tag name), import its class file instead, and register it with its static `define()`:

```js
import CorkQuickLinks from '@ucd-lib/cork-theme/elements/cork-quick-links/cork-quick-links.js';

class MyQuickLinks extends CorkQuickLinks {}
MyQuickLinks.define('my-quick-links');
```

`define()` does nothing if the tag name is already registered. A class can only be registered under one tag name, so subclass it to use another.

Menu elements read their links with a new markup format: see [Nav Markup](nav-markup.md).

## Quick links

`ucd-theme-quick-links` is replaced by `cork-quick-links`. The old element had its own dropdown. The new one is a plain menu, meant to sit in a `cork-header`, which opens it in its nav tray.

### Steps

1. Find the old element:

   ```
   grep -rn "ucd-theme-quick-links" src
   ```

2. Change the import and the tag:

   ```js
   import '@ucd-lib/cork-theme/elements/cork-quick-links';
   ```

   ```html
   <!-- Before -->
   <ucd-theme-quick-links title="Shortcuts" style-modifiers="highlight two-columns">
     <a href="/hours">Hours</a>
     <a href="/give">Give</a>
   </ucd-theme-quick-links>

   <!-- After -->
   <cork-quick-links header-component-label="Shortcuts" highlight two-columns>
     <a href="/hours">Hours</a>
     <a href="/give">Give</a>
   </cork-quick-links>
   ```

3. Change the attributes, as in the table below.
4. Replace `item-click` listeners. The old element fired `item-click` for links without an `href`. Use a `button` with its own click listener instead:

   ```html
   <cork-quick-links>
     <a href="/hours">Hours</a>
     <button @click=${this._openChat}>Chat with a librarian</button>
   </cork-quick-links>
   ```

5. Check the links are direct children of the element (or in a list), not inside wrapper elements. See [Nav Markup](nav-markup.md).

### Attributes and properties

| Old | New |
| --- | --- |
| `title` | `header-component-label` (`headerComponentLabel`). Default: `Quick Links`. |
| `style-modifiers="highlight"` | `highlight` |
| `style-modifiers="two-columns"` | `two-columns` (`twoColumns`) |
| `style-modifiers="home-site"` | `home-site` (`homeSite`) |
| `opened`, `animation-duration`, `open()`, `close()` | Removed. `cork-header` opens and closes its nav tray. |
| `href`, `disable-dropdown` | Removed, along with the dropdown. |
| `use-icon`, `custom-icon` slot | Not supported yet. |

### Events

| Old | New |
| --- | --- |
| `toggle` | Removed, along with the dropdown. |
| `btn-click` | Removed, along with `disable-dropdown`. |
| `item-click` | Removed. Use a `button` with a click listener. |

### Icons

Custom icons aren't supported yet. The old element showed a first child element of each of the first three links as an icon, and a `custom-icon` slot next to its title. The new element shows link text only. `home-site` still adds the WWW home site's icons.

### Buttons

Buttons in the menu are styled like its links. The styles are in `@ucd-lib/cork-theme/styles/js/ucdlib-sass/_nav-quicklinks-buttons.css.js` and `style-ucdlib.css`, for use outside the element.
