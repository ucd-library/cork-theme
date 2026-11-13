# Header

The header and the components that sit in it: `cork-header`, `cork-primary-nav`, `cork-nav-lite`, the search elements (`cork-search-form`, `cork-search-tray`, `cork-search-common`), `cork-quick-links` and `cork-branding-bar`. For how to import and register elements, see [Elements](elements.md).

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
   import '@ucd-lib/cork-theme/elements/cork-search-form';
   import '@ucd-lib/cork-theme/elements/cork-quick-links';
   import '@ucd-lib/cork-theme/elements/cork-branding-bar';
   ```

   ```html
   <!-- Before -->
   <ucd-theme-header site-name="UC Davis Library" site-url="/">
     <ucd-theme-primary-nav>…</ucd-theme-primary-nav>
     <ucd-theme-search-popup>
       <ucd-theme-search-form>…</ucd-theme-search-form>
     </ucd-theme-search-popup>
     <ucd-theme-quick-links>…</ucd-theme-quick-links>
   </ucd-theme-header>

   <!-- After -->
   <cork-header>
     <cork-branding-bar site-name="UC Davis Library" site-url="/"></cork-branding-bar>
     <cork-primary-nav>…</cork-primary-nav>
     <cork-search-form>…</cork-search-form>
     <cork-quick-links>…</cork-quick-links>
   </cork-header>
   ```

3. Load the header's images: see [Images and Fonts](images-and-fonts.md). Without them, the header bar and trays have no background images.
4. Replace `open()`, `close()`, `opened` and `toggle` listeners with `openNavTray(name)`, `closeNavTray()` and `selectedNavComponentName` (see below).
5. In an SPA, the tray should close on navigation. The old header closed itself on `popstate`, which misses link clicks (routers use `pushState`). `cork-header` instead closes itself when cork-app-state's location changes, by listening for `app-state-update` (see [Controllers](controllers.md#appstatecontroller)). With any other router, call `header.closeNavTray()` on navigation.

### Children

A child is put in its slot automatically by tag name. Any other element can be used by giving it the `slot` attribute, e.g. `<my-search slot="search">`. Only slots with a child get a toggle button.

| Old child | New child | Slot |
| --- | --- | --- |
| `ucd-theme-primary-nav` | `cork-primary-nav`. See [Primary nav](#primary-nav). | `primary-nav` |
| `ucd-theme-search-popup` | `cork-search-form`, or a `cork-search-tray` wrapping a `cork-search-form` and a `cork-search-common`. If both are direct children, the tray is used. See [Search](#search). | `search` |
| `ucd-theme-quick-links` | `cork-quick-links`. See [Quick links](#quick-links). | `quick-links` |
| `ucdlib-branding-bar` | `cork-branding-bar`. See [Branding bar](#branding-bar). | `branding-bar` |
| (new) | `cork-nav-lite`. See [Nav lite](#nav-lite). | `nav-lite` |

The tray's title and the toggle's label come from the child's `header-component-label` attribute (`headerComponentLabel`), e.g. `Main Menu` for `cork-primary-nav`.

For your own slotted element:

- **Focus:** opening the tray calls the element's `focus()`. Use `delegatesFocus: true` in its shadow root options (as `cork-primary-nav` and `cork-quick-links` do), so focus goes to its first control.
- **Reset:** when the tray closes or switches to another component, the header calls the element's `onNavTrayHide()` method, if it has one. `cork-primary-nav` uses it to collapse its submenus.
- **Closing the tray:** dispatch a `cork-nav-tray-close-request` event, e.g. after a search. It's ignored if no tray is open.

  ```js
  this.dispatchEvent(new CustomEvent('cork-nav-tray-close-request', { bubbles: true, composed: true }));
  ```

### Attributes and properties

| Old | New |
| --- | --- |
| `site-name`, `slogan`, `figure-src`, `site-url`, `branding-figure-aria-label` | Moved to a child `cork-branding-bar`. See [Branding bar](#branding-bar). |
| `opened`, `open()`, `close()` | `selectedNavComponentName`: the slot name of the open component (`primary-nav`, `search` or `quick-links`), or `null` when closed. Set it to open or close a tray, or call `openNavTray(name)` and `closeNavTray()`. |
| `prevent-fixed` | Removed. The header isn't fixed to the top of the screen. Campus's sticky header isn't supported yet. |
| `is-demo`, `silence-warnings` | Removed. |
| (new) `backdrop`, `background-image-url`, `nav-tray-*-image-url` | Header bar variant and image overrides. See [Images and Fonts](images-and-fonts.md#cork-header). |
| (new) `no-page-width` | The header sets `--page-width` on the document by default. This turns it off, e.g. if the app runs its own `PageWidthController`. See [Controllers](controllers.md#pagewidthcontroller). |
| (new) `no-app-state-close` | The header closes its tray when cork-app-state's location changes. This turns it off. |
| (new) `image-url`, `font-url` | Where the theme's images and fonts are served from, for the whole document. In place of calling `setImageCssCustomProperties()` and `setFontFaces()`. See [Images and Fonts](images-and-fonts.md#cork-header). |

### Events

| Old | New |
| --- | --- |
| `toggle` | Removed. No event is fired yet. |

### Keyboard and closing

- Escape, a click outside the tray, the open component's toggle, or a `cork-nav-tray-close-request` event closes the tray. Focus returns to that toggle.
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

## Search

`ucd-theme-search-popup` and `ucd-theme-search-form` are replaced by three elements. The old popup had its own dropdown; now `cork-header` opens the search in its nav tray.

| Element | Use |
| --- | --- |
| `cork-search-form` | The form: a text input, a search button, and optional facet buttons. Put it directly in the header when it's the only thing in the search tray. |
| `cork-search-tray` | Lays out the search tray when it has a form and common searches. Wraps a `cork-search-form` and a `cork-search-common`. |
| `cork-search-common` | A list of common search links, below the form. |

### Steps

1. Find the old elements:

   ```
   grep -rnE "ucd-theme-search-(popup|form)" src
   ```

2. Replace the popup and form with a `cork-search-form` in the header. Drop the popup wrapper:

   ```js
   import '@ucd-lib/cork-theme/elements/cork-search-form';
   ```

   ```html
   <!-- Before -->
   <ucd-theme-search-popup>
     <ucd-theme-search-form @search=${this._onSearch}></ucd-theme-search-form>
   </ucd-theme-search-popup>

   <!-- After -->
   <cork-search-form @cork-search=${this._onSearch}></cork-search-form>
   ```

3. Change `search` listeners to `cork-search`, and `e.detail.searchTerm` to `e.detail.query`.
4. Change the attributes, as in the table below.
5. Optionally, add facet buttons or common searches (see below).

### Form attributes and properties

| Old (`ucd-theme-search-form`) | New (`cork-search-form`) |
| --- | --- |
| `value`, `placeholder`, `form-action`, `form-method`, `label-text`, `query-param`, `clear-on-search` | Unchanged. |
| `form-class`, `input-class` | Removed. Use `category-brand` for a background color. |
| (new) `submit-param` (`submitParam`) | Name of the search button, i.e. its key in the request: `search=Submit`. Default: `search`. |
| (new) `submit-aria-label` (`submitAriaLabel`) | Accessible name of the search button, which shows an icon. Default: `Search`. |
| (new) `keep-tray-open` (`keepTrayOpen`) | Keeps the header's tray open after a search. By default, a search closes it. |
| (new) `category-brand` (`categoryBrand`) | A campus category brand name, e.g. `admin-blue`, for the form's background color. |

| Old (`ucd-theme-search-popup`) | New |
| --- | --- |
| `opened`, `open()`, `close()` | Removed. `cork-header` opens and closes its nav tray. |
| `button-text` | Removed. The header's toggle button is labeled from `header-component-label`. |

### Events

| Old | New |
| --- | --- |
| `search`, with `detail.searchTerm` | `cork-search`, with `detail.query` and `detail.facet`. Fired only when `form-action` isn't set; with it, the form submits natively. |

`detail.facet` is the name of the button that submitted the form: a facet button's `name`, or the `submit-param` (default `search`) for the search button and the Enter key.

After `cork-search`, the form fires `cork-nav-tray-close-request`, so the header closes its tray. Set `keep-tray-open` to stop it. The input is also cleared whenever the tray closes.

### Facet buttons

New. Facet buttons run the search with a facet applied, e.g. searching only the directory. Add them as direct child `button` elements of `cork-search-form`:

```html
<cork-search-form>
  <button name="directory">Directory</button>
  <button name="news" aria-label="Search the news">News</button>
</cork-search-form>
```

- `name` is required: it's the facet's key in the request, and `detail.facet` in `cork-search`. Buttons without one are skipped.
- `value` defaults to the button's text, which is also the label shown.
- `aria-label` is copied over.

They're rendered as submit buttons, so a native submit sends `searchterm=library+hours&news=News`.

### Common searches

New. To show a list of common searches below the form, wrap both in a `cork-search-tray`:

```js
import '@ucd-lib/cork-theme/elements/cork-search-tray';
import '@ucd-lib/cork-theme/elements/cork-search-common';
```

```html
<cork-header>
  <cork-search-tray>
    <cork-search-form>…</cork-search-form>
    <cork-search-common heading="Popular Searches">
      <a href="/hours">Library hours</a>
      <a href="/print">How do I print?</a>
    </cork-search-common>
  </cork-search-tray>
</cork-header>
```

- `cork-search-tray` puts its children in place by tag name, or by a `slot` attribute (`form` or `common`) for your own elements. It focuses the form when the tray opens, and passes `onNavTrayHide()` on to its children.
- `cork-search-common` reads the same markup as the other menus (see [Nav Markup](nav-markup.md)), and shows top-level items only. Buttons are styled like its links.
- `heading` (default `Common Searches`) is the heading above the list. An empty value hides it.

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

   Or listen for `cork-nav-item-click`, which fires for every link and button, with the item in `detail.navItem`. See [Controllers](controllers.md#navcontroller).

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
| `item-click` | `cork-nav-item-click`, fired for every link and button, with `detail.navItem` and `detail.originalEvent`. Or use a `button` with a click listener. |

### Icons

Custom icons aren't supported yet. The old element showed a first child element of each of the first three links as an icon, and a `custom-icon` slot next to its title. The new element shows link text only. `home-site` still adds the WWW home site's icons.

### Buttons

Buttons in the menu are styled like its links. The styles are in `@ucd-lib/cork-theme/styles/js/ucdlib-sass/_nav-quicklinks-buttons.css.js` and `style-ucdlib.css`, for use outside the element.

## Branding bar

`ucdlib-branding-bar` is replaced by `cork-branding-bar`. It also takes over the site branding attributes of `ucd-theme-header` (`site-name`, `slogan`, etc.). It shows a logo and the site name, with an optional slogan, and is meant to sit in a `cork-header`.

### Steps

1. Find the old element and the header's branding attributes:

   ```
   grep -rnE "ucdlib-branding-bar|site-name|figure-src|branding-figure-aria-label" src
   ```

2. Change the import and the tag. If the branding was on `ucd-theme-header`, move its attributes to a `cork-branding-bar` in the `cork-header`:

   ```js
   import '@ucd-lib/cork-theme/elements/cork-branding-bar';
   ```

   ```html
   <!-- Before -->
   <ucd-theme-header site-name="Special Collections" site-url="/special-collections" slogan="Archives and rare books">
     …
   </ucd-theme-header>

   <!-- or -->
   <ucd-theme-header>
     <ucdlib-branding-bar site-name="Special Collections" site-url="/special-collections" slogan="Archives and rare books"></ucdlib-branding-bar>
     …
   </ucd-theme-header>

   <!-- After -->
   <cork-header>
     <cork-branding-bar site-name="Special Collections" site-url="/special-collections" slogan="Archives and rare books"></cork-branding-bar>
     …
   </cork-header>
   ```

3. Change the attributes, as in the table below.
4. If the old element had nav links, they aren't shown yet. See [Nav](#nav).

### Attributes and properties

| Old | New |
| --- | --- |
| `site-name`, `site-url`, `slogan` | Unchanged. `site-name` defaults to `UC Davis Library` (the old header's default was empty). |
| `figure="book"` | The default. |
| `figure="logo"` | Removed. |
| `figure="custom"`, `figure-src` | A direct child `img`, which goes in the `site-logo` slot. See [Logo](#logo). |
| `figure-custom-width` | Removed. Size the slotted logo with your own CSS. See [Logo](#logo). |
| `branding-figure-aria-label` | Removed. The logo link is now hidden from screen readers. See [Logo](#logo). |
| (new) `no-site-logo` (`noSiteLogo`) | Hides the logo. |
| `nav-aria-label`, `navItems` | Not supported yet. See [Nav](#nav). |

### Logo

The library's book logo is shown by default. For your own, add an `img` as a direct child. The first one goes in the `site-logo` slot automatically; any other element can use `slot="site-logo"`.

```html
<cork-branding-bar site-name="DataLab">
  <img src="/images/datalab-logo.svg">
</cork-branding-bar>
```

The slotted logo stays in the light DOM, so size it with your own CSS, in place of `figure-custom-width`:

```css
cork-branding-bar img {
  width: 150px;
  min-width: 150px;
}
```

The logo and the site name link to the same URL, so the logo link is hidden from screen readers and skipped by the Tab key. Your logo doesn't need alt text.

### Nav

Not supported yet. `ucdlib-branding-bar` showed its child links as a nav next to the branding. `cork-branding-bar` will too, but its styles aren't done, and child links are ignored for now.
