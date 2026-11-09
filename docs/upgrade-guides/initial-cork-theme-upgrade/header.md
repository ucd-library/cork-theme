# Header

The header and the components that sit in it: `cork-header`, `cork-primary-nav`, `cork-nav-lite` and `cork-quick-links`. For how to import and register elements, see [Elements](elements.md).

## cork-header

`ucd-theme-header` is replaced by `cork-header`, which follows campus's current header: a bar with the UC Davis logo and a toggle button per component. Each toggle opens that component in a nav tray, a modal `<dialog>`. The old mobile bar, off-canvas menu and horizontal desktop nav are gone; the menu opens in the tray at every screen size.

### Steps

1. Find the old elements:

   ```
   grep -rnE "ucd-theme-(header|primary-nav|search-popup|search-form)|ucdlib-branding-bar" src
   ```

2. Change the import and the tags. Swap the children as in the [Children](#children) table.

   ```js
   import '@ucd-lib/cork-theme/elements/cork-header';
   import '@ucd-lib/cork-theme/elements/cork-primary-nav';
   import '@ucd-lib/cork-theme/elements/cork-quick-links';
   ```

   ```html
   <!-- Before -->
   <ucd-theme-header site-name="UC Davis Library" site-url="/">
     <ucd-theme-primary-nav>…</ucd-theme-primary-nav>
     <ucd-theme-search-popup>…</ucd-theme-search-popup>
     <ucd-theme-quick-links>…</ucd-theme-quick-links>
   </ucd-theme-header>

   <!-- After -->
   <cork-header>
     <cork-primary-nav>…</cork-primary-nav>
     <cork-quick-links>…</cork-quick-links>
   </cork-header>
   ```

3. Load the header's images: see [Images and Fonts](images-and-fonts.md). Without them, the header bar and trays have no background images.
4. Replace `open()`, `close()`, `opened` and `toggle` listeners with `selectedNavComponentName` (see below).
5. In an SPA, close the tray on navigation. The old header closed itself on `popstate`; `cork-header` doesn't yet. For example, in a cork-app-state route handler: `header.selectedNavComponentName = null`.

### Children

A child is put in its slot automatically by tag name. Any other element can be used by giving it the `slot` attribute, e.g. `<my-search slot="search">`. Only slots with a child get a toggle button.

| Old child | New child | Slot |
| --- | --- | --- |
| `ucd-theme-primary-nav` | `cork-primary-nav`. See [Primary nav](#primary-nav). | `primary-nav` |
| `ucd-theme-search-popup` | `cork-search`, not built yet. Use your own element with `slot="search"` for now. | `search` |
| `ucd-theme-quick-links` | `cork-quick-links`. See [Quick links](#quick-links). | `quick-links` |
| `ucdlib-branding-bar` | `cork-branding-bar`, not built yet. The `branding-bar` slot isn't rendered yet. | `branding-bar` |
| (new) | `cork-nav-lite`. See [Nav lite](#nav-lite). | `nav-lite` |

The tray's title and the toggle's label come from the child's `header-component-label` attribute (`headerComponentLabel`), e.g. `Main Menu` for `cork-primary-nav`.

For your own slotted element:

- **Focus:** opening the tray calls the element's `focus()`. Use `delegatesFocus: true` in its shadow root options (as `cork-primary-nav` and `cork-quick-links` do), so focus goes to its first control.
- **Reset:** when the tray closes or switches to another component, the header calls the element's `onNavTrayHide()` method, if it has one. `cork-primary-nav` uses it to collapse its submenus.

### Attributes and properties

| Old | New |
| --- | --- |
| `site-name`, `slogan`, `figure-src`, `site-url`, `branding-figure-aria-label` | Removed. Campus's header has no site branding area. A branding bar is planned (see [Children](#children)). |
| `opened`, `open()`, `close()` | `selectedNavComponentName`: the slot name of the open component (`primary-nav`, `search` or `quick-links`), or `null` when closed. Set it to open or close a tray. |
| `prevent-fixed` | Removed. The header isn't fixed to the top of the screen. Campus's sticky header isn't supported yet. |
| `is-demo`, `silence-warnings` | Removed. |
| (new) `backdrop`, `background-image-url`, `nav-tray-*-image-url` | Header bar variant and image overrides. See [Images and Fonts](images-and-fonts.md#cork-header). |

### Events

| Old | New |
| --- | --- |
| `toggle` | Removed. No event is fired yet. |

### Keyboard and closing

- Escape, a click outside the tray, or the open component's toggle closes the tray. Focus returns to that toggle.
- With a `cork-nav-lite`, widening the window past 768px with the menu tray open closes it, since its toggle is hidden.
- `cork-primary-nav` uses Escape to close its submenus first. See [Primary nav](#primary-nav).

## Primary nav

`ucd-theme-primary-nav` is replaced by `cork-primary-nav`. The old element was a horizontal desktop nav (superfish or mega menu) that became an accordion on mobile. The new one is campus's drill-down menu, meant to sit in a `cork-header`, which opens it in its menu tray.

### Steps

1. Change the import and the tag:

   ```js
   import '@ucd-lib/cork-theme/elements/cork-primary-nav';
   ```

2. Rewrite the menu as nested `li` items. Old-style `<ul link-text="…">` lists still parse, but are deprecated. See [Nav Markup](nav-markup.md).

   ```html
   <cork-primary-nav>
     <ul>
       <li>
         <a href="/services">Services</a>
         <span data-nav="description">Borrowing, printing, and research help</span>
         <ul>
           <li><a href="/services/borrow">Borrowing</a></li>
         </ul>
       </li>
     </ul>
   </cork-primary-nav>
   ```

3. Change the attributes, as in the table below.

### Attributes and properties

| Old | New |
| --- | --- |
| (new) `header-component-label` (`headerComponentLabel`) | The menu's label, for the tray title and the nav's `aria-label`. Default: `Main Menu`. |
| `nav-type` (`superfish`, `mega`), `style-modifiers`, `hover-delay`, `animation-duration` | Removed. There's one style: the drill-down. |
| `max-depth` | Removed. Every level of the markup is shown. |
| `openSubNav()`, `closeSubNav()`, `closeAllSubNavs()`, `openMegaNav()`, `closeMegaNav()` | `focused-nav-item` (`focusedNavItem`): the `navPosition` of the open submenu, e.g. `[1, 0]`, or `"1,0"` as an attribute. Its ancestors open with it. `[]` closes them all. |
| `navItems`, `getNavItem()` | On the controller: `this.ctl.nav.navItems` and `this.ctl.nav.getNavItem()`. See [Controllers](controllers.md#navcontroller). |
| `isMegaMenu()` | Removed. |

### Fields

A `data-nav="description"` field is shown under the item's title, at the top of its submenu.

### Keyboard

- Opening a submenu moves focus into it: to the parent's own link, or its first item. Closing it returns focus to its toggle.
- Escape closes the submenu that has focus (moving up a level), or all submenus if focus isn't in one. With no submenus open, Escape closes the tray.
- Hidden submenus are still in the tab order. This is the same in campus's nav-drill.

## Nav lite

New: `cork-nav-lite` is campus's single-level menu, shown inline in the `cork-header` bar instead of behind the menu tray toggle. **If your app has a small number of top-level menu items, it's a candidate for nav lite.**

- It shows at 768px and up, where it replaces the menu tray toggle. Smaller screens still use the menu tray, so keep a `cork-primary-nav` too.
- Only top-level items are shown. Sub menus and fields are ignored, so it suits menus whose top-level items are all links or buttons.

The simplest setup copies the primary nav's top-level items, so the links are only written once. `primary-nav-max-items` limits it to the first few:

```html
<cork-header>
  <cork-nav-lite copy-from-primary-nav primary-nav-max-items="3"></cork-nav-lite>
  <cork-primary-nav>
    <a href="/services">Services</a>
    <a href="/collections">Collections</a>
    <a href="/about">About</a>
    <button>Chat with a librarian</button>
  </cork-primary-nav>
</cork-header>
```

The header does the copying, and copies again whenever the primary nav's items change. Button clicks are still passed through to the buttons in `cork-primary-nav`.

Or write its own links, in the same markup as the other menus (see [Nav Markup](nav-markup.md)):

```html
<cork-header>
  <cork-nav-lite>
    <a href="/services">Services</a>
    <a href="/collections">Collections</a>
  </cork-nav-lite>
  <cork-primary-nav>…</cork-primary-nav>
</cork-header>
```

| Attribute | Notes |
| --- | --- |
| `header-component-label` (`headerComponentLabel`) | The nav's `aria-label`. Default: `Main Menu`. |
| `copy-from-primary-nav` (`copyFromPrimaryNav`) | Copies the top-level items of the header's `cork-primary-nav`. The element's own links are ignored. |
| `primary-nav-max-items` (`primaryNavMaxItems`) | With `copy-from-primary-nav`, how many items to copy, from the start. Default: all. |

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
