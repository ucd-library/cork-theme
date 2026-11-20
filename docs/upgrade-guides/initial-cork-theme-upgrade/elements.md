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

## Moved so far

| Old | New |
| --- | --- |
| `ucd-theme-header` | `cork-header`. See [Header](header.md#cork-header). |
| `ucd-theme-primary-nav` | `cork-primary-nav`. See [Header](header.md#primary-nav). |
| (new) | `cork-nav-lite`. See [Header](header.md#nav-lite). |
| `ucd-theme-search-popup`, `ucd-theme-search-form` | `cork-search-form`, and the new `cork-search-tray` and `cork-search-common`. See [Header](header.md#search). |
| `ucd-theme-quick-links` | `cork-quick-links`. See [Header](header.md#quick-links). |
| `ucdlib-branding-bar` | `cork-branding-bar`. See [Header](header.md#branding-bar). |
| `ucd-theme-subnav` | `cork-nav-sub`. See [cork-nav-sub](#cork-nav-sub). |
| (new) | `cork-nav-tabs`. See [cork-nav-tabs](#cork-nav-tabs). |
| `ucd-theme-pagination` | `cork-pager`. See [cork-pager](#cork-pager). |
| `ucd-theme-collapse` | `cork-collapse`. See [cork-collapse](#cork-collapse). |
| `ucdlib-pages` | `cork-pages`. See [cork-pages](#cork-pages). |
| `ucdlib-md`, `ucdlib-md-content` | `cork-markdown`. See [cork-markdown](#cork-markdown). |

## cork-nav-sub

`ucd-theme-subnav` is replaced by `cork-nav-sub`. The old element was an accordion: each item with children had a toggle that expanded them in place. The new one is campus's drill-down menu, the same one `cork-primary-nav` uses, with an optional title above it. The title moves from attributes into the light DOM.

### Steps

1. Find the old element:

   ```
   grep -rn "ucd-theme-subnav" src
   ```

2. Change the import:

   ```js
   // Before
   import '@ucd-lib/theme-elements/brand/ucd-theme-subnav/ucd-theme-subnav.js';

   // After
   import '@ucd-lib/cork-theme/elements/cork-nav-sub';
   ```

3. Rename the tag, move the title into a heading as the first child, and rewrite the menu as nested `li` items. Old-style `<ul link-text="…">` lists still parse, but are deprecated. See [Nav Markup](nav-markup.md).

   ```html
   <!-- Before -->
   <ucd-theme-subnav nav-title="Services" title-href="/services">
     <li><a href="/services/borrow">Borrowing</a></li>
     <ul link-text="Digital Services" href="/services/digital">
       <li><a href="/services/digital/gis">GIS and Mapping</a></li>
     </ul>
   </ucd-theme-subnav>

   <!-- After -->
   <cork-nav-sub>
     <h2><a href="/services">Services</a></h2>
     <ul>
       <li><a href="/services/borrow">Borrowing</a></li>
       <li>
         <a href="/services/digital">Digital Services</a>
         <ul>
           <li><a href="/services/digital/gis">GIS and Mapping</a></li>
         </ul>
       </li>
     </ul>
   </cork-nav-sub>
   ```

4. Change the remaining attributes, properties and events, as in the table below.
5. If you query the element in code or style it in CSS, change the tag name there too.

### Title

The title is the element's first direct child that is an `h1`-`h6`, or that has the `data-heading` attribute. It's rendered with the same tag, so the heading level is up to you. It's parsed by `HeadingController` (see [Controllers](controllers.md#headingcontroller)).

| Title | Markup |
| --- | --- |
| Plain (was `nav-title`) | `<h2>Services</h2>` |
| Linked (was `nav-title` with `title-href`) | `<h2><a href="/services">Services</a></h2>` |
| Clickable, no link (was `nav-title` with `title-click-event`) | `<h2><button>Services</button></h2>`. Listen for clicks on the button itself, or for `cork-heading-click` on the element. |
| Not a heading | `<div data-heading>Services</div>`, or `<div data-heading="h2">Services</div>` to look like an `h2`. |

### Attributes, properties and events

| Old | New |
| --- | --- |
| `nav-title`, `title-href`, `title-click-event` | A heading child. See [Title](#title). |
| `title-click` event | `cork-heading-click`, with `detail.heading` and `detail.originalEvent`. Fired for linked and button titles. Click listeners on a title `<button>` also run. |
| `item-click` event (items without an `href`), with `detail.linkText` and `detail.location` | `cork-nav-item-click`, fired for every item link and button, with `detail.navItem` and `detail.originalEvent`. For an item without a link, use a `<button>`; its click listeners run. See [Controllers](controllers.md#navcontroller). |
| `nav-aria-label` | Unchanged. Its default is now the title's text, or `Submenu` if there's no title. It was `Sub navigation`. |
| `openNavItem()`, `closeNavItem()` | `focused-nav-item` (`focusedNavItem`): the `navPosition` of the open submenu, e.g. `[1, 0]`, or `"1,0"` as an attribute. Its ancestors open with it. `[]` closes them all. |
| `animation-duration` | Removed. Transitions come from campus's styles, and are off with `prefers-reduced-motion`. |
| `navItems` | On the controller: `this.ctl.nav.navItems`. |
| (new) `auto-height` (`autoHeight`) | On wide screens, the menu is as tall as its first level, and follows that level's size. On narrow screens its height is `auto`. Without it, the menu is as tall as its container, and at least 18rem. |

### Keyboard

- Opening a submenu moves focus into it: to the parent's own link, or its first item. Closing it returns focus to its toggle.
- Escape closes the submenu that has focus (moving up a level), or all submenus if focus isn't in one.

See the [reference](../../reference/elements/cork-nav-sub.md) for every property.

### cork-nav-sub-popover

New, with no old equivalent. It's `cork-nav-sub` in campus's popover: a full-width button that opens a tray with the title and menu. It takes the same light DOM as `cork-nav-sub`, and its menu always uses auto height.

```html
<cork-nav-sub-popover button-label="In this section">
  <h2><a href="/services">Services</a></h2>
  <ul>…</ul>
</cork-nav-sub-popover>
```

- The button says "Submenu", or `button-label`. With `heading-label`, it uses the title's text instead.
- `hide-heading` leaves the title out of the tray.
- The tray closes when the user clicks outside it or presses Escape, and, in apps using cork-app-state, when the location changes (`no-app-state-close` turns that off). Other SPAs can call `hide()` from their router.

See the [reference](../../reference/elements/cork-nav-sub-popover.md) for every property.

## cork-nav-tabs

New, with no old equivalent. It renders campus's navigation tabs (the `tabs` component): the tab bar only, not `tabs__content`. It takes the same light DOM as the other menu elements (see [Nav Markup](nav-markup.md)), shows top-level items only, and highlights the item marked with `data-active`.

```html
<cork-nav-tabs>
  <ul>
    <li data-active><a href="/record/1">Overview</a></li>
    <li><a href="/record/1/holdings">Holdings</a></li>
  </ul>
</cork-nav-tabs>
```

- `secondary` switches to campus's `tabs--secondary` style.
- The tabs are a `<nav>` of links or buttons, not an ARIA tablist, since they don't switch panels on the page. The active one gets `aria-current`. Label the nav with `nav-aria-label` (default 'Tabs').

See the [reference](../../reference/elements/cork-nav-tabs.md) for every property.

## cork-pager

`ucd-theme-pagination` is replaced by `cork-pager`. It still builds its links from a base path, or leaves them to the app, but it can also take a page query parameter or a link function, shows ellipses by default, and switches to a mini view on its own when it's narrow.

### Steps

1. Find the old element:

   ```
   grep -rn "ucd-theme-pagination" src
   ```

2. Change the import:

   ```js
   // Before
   import '@ucd-lib/theme-elements/brand/ucd-theme-pagination/ucd-theme-pagination.js';

   // After
   import '@ucd-lib/cork-theme/elements/cork-pager';
   ```

3. Rename the tag, and change `max-pages` to `max-page`:

   ```html
   <!-- Before -->
   <ucd-theme-pagination current-page="2" max-pages="33" base-path="/foo/bar/"></ucd-theme-pagination>

   <!-- After -->
   <cork-pager current-page="2" max-page="33" base-path="/foo/bar/"></cork-pager>
   ```

4. Change the remaining attributes and events, as in the table below. Remove `darkmode`, `size` and `disable-label`.
5. If you listen for `page-change`, listen for `cork-pager-item-click` instead.
6. If you query the element in code or style it in CSS, change the tag name there too.

### Attributes, properties and events

| Old | New |
| --- | --- |
| `current-page` | Unchanged, but no longer reflected back to the attribute. |
| `max-pages` | `max-page` (`maxPage`). |
| `base-path`, `query-params`, `use-hash` | Unchanged. A `base-path` without a trailing slash now gets one (`/search` makes `/search/2`, not `/search2`), and a leading `?` on `query-params` is dropped. The `queryParams` property is now a plain object or a `URLSearchParams` instance, rather than a string, e.g. `.queryParams=${{ q: 'cats' }}`. |
| (new) `page-param` | Puts the page in a query parameter instead of the path: `base-path="/search" page-param="page"` makes `/search?page=2`. |
| (new) `linkFunction`, or a `<script type="text/link-function">` child | Makes each page's link yourself, e.g. `` pager.linkFunction = page => `/search?page=${page}` ``. The script tag needs a CSP that allows `unsafe-eval`. |
| `visible-link-count` | Unchanged, default 7. It now sets the number of page numbers in the ellipses layout too, counting the first and last pages. |
| `ellipses` | Ellipses are now on by default, at any page count. `no-ellipses` turns them off. Ellipses still link to the next hidden page; `static-ellipses` makes them plain text. A gap of one page shows that page instead. |
| `xs-screen` | The mini view ("Page X of Y") now turns on by itself when the pager is under 768px wide (its own width, not the window's). `no-mini` turns that off, `only-mini` always shows it, and `no-max-on-mini` leaves out "of Y". |
| `darkmode` | Removed. The pager's colors use campus's `--forced-contrast` custom property, which campus styles set on dark backgrounds, such as sections with `layout-section--force-contrast`. Put the pager inside one instead. |
| `size`, `disable-label` | Removed. Neither had an effect. |
| `page-change` event, with `detail.page`. Fired only when the pager had no links. | `cork-pager-item-click`, fired for every link and button click, with `detail.page`, `detail.item` and `detail.originalEvent`. It bubbles and is composed. Link clicks with a modifier key (e.g. cmd-click for a new tab) don't fire it. The pager still doesn't change `current-page` itself: set it in response. |
| (new) `nav-aria-label` | Label for the pager's `nav`. Default: `Pagination`. |

### Without links

With no link options set, page items were `<a>` elements with no `href`. They're now `<button>` elements, styled like the links, so they're reachable by keyboard without a `tabindex`. The button styles are in `@ucd-lib/cork-theme/styles/js/ucdlib-sass/_pager-buttons.css.js` and `style-ucdlib.css`, for use outside the element.

See the [reference](../../reference/elements/cork-pager.md) for every property.

## cork-collapse

`ucd-theme-collapse` is replaced by `cork-collapse`. It's still campus's collapse: a title bar that slides its content open and closed. The title moves from an attribute into the light DOM, as a heading with a real button in it.

### Steps

1. Find the old element:

   ```
   grep -rn "ucd-theme-collapse" src
   ```

2. Change the import:

   ```js
   // Before
   import '@ucd-lib/theme-elements/brand/ucd-theme-collapse/ucd-theme-collapse.js';

   // After
   import '@ucd-lib/cork-theme/elements/cork-collapse';
   ```

3. Move the title into a heading. The old element always rendered `title` as an `h2`, so write `<h2>` to keep the same heading level, or pick the level that suits the page. Every level looks the same. For a title that shouldn't be a heading, use `<div data-heading>`. Move `brand-class` to the element's `class`, and rename `opened` to `open`:

   ```html
   <!-- Before -->
   <ucd-theme-collapse title="How do I renew a book?" brand-class="category-brand--rec-pool" opened>
     <p>Sign in to your library account.</p>
   </ucd-theme-collapse>

   <!-- After -->
   <cork-collapse class="category-brand--rec-pool" open>
     <h2>How do I renew a book?</h2>
     <p>Sign in to your library account.</p>
   </cork-collapse>
   ```

4. Replace calls to `open()`, `close()` and `toggle()` by setting `open`, and listen for `cork-collapse-toggle` instead of `accordion-toggle`.

5. Make sure the app loads `style-ucdlib.css` (see [Stylesheets](stylesheets.md)). The element needs it for brand classes, for link colors in its content inside force-contrast layout sections, and to hide closed content before the element is registered.

### Changes

| Old | New |
| --- | --- |
| `title` | Removed. The title is the first `h1`-`h6` child, or a child with `data-heading`. It's rendered with the same tag, with a `<button>` in it that has `aria-expanded` and `aria-controls`. Before, it was always an `h2` with `tabindex="0"`. |
| `opened` | `open`. Still reflected. Starting open no longer animates. |
| `brand-class` | Removed. Put the brand class on the element itself. |
| `open()`, `close()`, `toggle()` | Removed. Set `open`. Changes from code animate too. |
| `accordion-toggle` (`detail.isOpen`) | `cork-collapse-toggle` (`detail.open`). Fired on title clicks only, as before. |
| Content in force-contrast layout sections | Links and headings in the content keep their normal colors. Campus's own collapse turns them white on its white box in dark sections; `style-ucdlib.css` now fixes that for campus's markup and `cork-collapse` alike. |
| Animation | Uses campus's `slide-element` library, which respects `prefers-reduced-motion`. |

See the [reference](../../reference/elements/cork-collapse.md) for every property.

## cork-pages

`ucdlib-pages` is now `cork-pages`. It works the same way: it shows the child that `selected` matches, by index or by attribute, and hides the rest.

### Steps

1. Find the old element:

   ```
   grep -rn "ucdlib-pages" src
   ```

2. Change the import:

   ```js
   // Before
   import '@ucd-lib/theme-elements/ucdlib/ucdlib-pages/ucdlib-pages.js';

   // After
   import '@ucd-lib/cork-theme/elements/cork-pages';
   ```

3. Rename the tag. The attributes are unchanged:

   ```html
   <!-- Before -->
   <ucdlib-pages selected=${this.page} attr-for-selected="page-id">
     <app-home page-id="home"></app-home>
     <app-search page-id="search"></app-search>
   </ucdlib-pages>

   <!-- After -->
   <cork-pages selected=${this.page} attr-for-selected="page-id">
     <app-home page-id="home"></app-home>
     <app-search page-id="search"></app-search>
   </cork-pages>
   ```

4. If you query the element in code (e.g. `querySelector('ucdlib-pages')`) or style it in CSS, change the tag name there too.

### Changes

| Old | New |
| --- | --- |
| `fallbackSelection` | Now an attribute too, `fallback-selection`. Before, it could only be set as a property. |
| `fallbackSelection` matching | Now matched like `selected`: a whole number is a child index, anything else an attribute value. Before, it was treated as an index whenever `selected` contained a digit, whatever the fallback's own value. |
| `attrForSelected` | Unchanged, but it now reads `'id'` when left unset, rather than `undefined`. |
| (new) `prop-for-selected` | Match `selected` against a property of each child instead of an attribute, e.g. `pageId`. Takes precedence over `attr-for-selected` when set. |
| (new) `inline-display-value` | The selected child's inline `display`, e.g. `flex`. Default: `block`, as before. |
| `console.warn` when nothing matches | Removed. Every child is hidden, as before. |

See the [reference](../../reference/elements/cork-pages.md) for every attribute.

## cork-markdown

`ucdlib-md` is now `cork-markdown`. It still renders markdown as sanitized HTML in the light DOM, with marked and DOMPurify. `ucdlib-md-content` is replaced by a script tag.

### Steps

1. Find the old elements:

   ```
   grep -rn "ucdlib-md" src
   ```

2. Change the import:

   ```js
   // Before
   import '@ucd-lib/theme-elements/ucdlib/ucdlib-md/ucdlib-md.js';

   // After
   import '@ucd-lib/cork-theme/elements/cork-markdown';
   ```

3. Rename the tag, and replace `ucdlib-md-content` with a `<script type="text/markdown">`:

   ```html
   <!-- Before -->
   <ucdlib-md>
     <ucdlib-md-content>
       ## A heading
       Some **bold** text
     </ucdlib-md-content>
   </ucdlib-md>

   <!-- After -->
   <cork-markdown>
     <script type="text/markdown">
       ## A heading
       Some **bold** text
     </script>
   </cork-markdown>
   ```

4. Rename the `data` property to `markdown`:

   ```html
   <!-- Before -->
   <ucdlib-md .data=${this.doc}></ucdlib-md>

   <!-- After -->
   <cork-markdown .markdown=${this.doc}></cork-markdown>
   ```

5. Move `renderer`, `use` and `options` into a single `markedOptions` object, which takes the same object as `marked.use()`:

   ```js
   // Before
   ele.renderer = { heading(token) { … } };
   ele.options = { breaks: false };

   // After
   ele.markedOptions = {
     breaks: false,
     renderer: { heading(token) { … } }
   };
   ```

6. If you query the element in code or style it in CSS, change the tag name there too.

### Changes

| Old | New |
| --- | --- |
| `ucdlib-md-content` | A `<script type="text/markdown">` child. Its text isn't parsed as HTML, so `<`, `&` and autolinks like `<https://…>` reach marked as written. |
| Inline indentation | Only the indentation shared by all lines is removed. Before, every line was trimmed, which broke nested lists and indented code. |
| `data` | Renamed `markdown`. |
| `renderer`, `use`, `options` | One `markedOptions` property, merged over the defaults rather than replacing them. A renderer method can return `false` to fall back to the default. |
| marked settings | Each element has its own marked instance. Before, options were set on the shared `marked` object, so one element's options affected every other, and extensions piled up on each update. |
| Ordered lists | Now `<ol class="list--multilevel">`, so they're numbered, with letters for nested lists. Before, they were rendered as `<ul>`. |
| (new) Heading ids | Headings get GitHub-style ids with an `md-` prefix, e.g. `## Slots` gets `id="md-slots"`, and the `#hash` of relative links gets the same prefix, so `[Slots](#slots)` still works. The prefix stops DOMPurify from removing ids such as `children` or `title`. Change it with `heading-id-prefix`. |
| Rendered wrapper | The HTML is rendered directly in the element, not in a `<div rendered>`. |
| marked, DOMPurify | marked 18 (was 16) and DOMPurify 3 (was 2), plus marked-gfm-heading-id. |

See the [reference](../../reference/elements/cork-markdown.md) for every property.
