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
| `ucdlib-pages` | `cork-pages`. See [cork-pages](#cork-pages). |

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
