# Nav Markup

Elements that show a menu, such as `cork-primary-nav`, `cork-nav-lite` and `cork-quick-links`, read their links from their light DOM children with `NavController` (see [Controllers](controllers.md#navcontroller)). The markup they accept differs from the old `@ucd-lib/theme-elements` elements, which used the `NavElement` mixin or their own parsing.

## What changed

- **Metadata moves off the list.** Old menus put an item's title and link on its `ul`/`ol` (`<ul link-text="Services" href="/services">`). Now an item is a `li`. Its link is a child `a`, and its sub menu is a nested `ul`/`ol`.
- **Extra fields are marked child elements.** A description, for example, is `<span data-nav="description">…</span>` inside the `li`. Any `data-nav` value becomes a field, so elements can add fields without new parsing.
- **Only direct children are read.** The old quick links found every `a` at any depth. Now links must be direct children of the element, of a `ul`/`ol` that's a direct child, or of a `li`. A link inside a wrapper `div` is ignored.
- **Buttons work.** A `button` can be used wherever an `a` can. Its click listeners still run.
- **Not supported yet:** the `is-open`, `mobile-only` and `desktop-only` attributes, and icons.

## Steps

1. Find menus in old markup:

   ```
   grep -rnE "link-text|is-open|mobile-only|desktop-only" --include=*.html --include=*.js src
   ```

2. Rewrite old-style lists as nested `li` items:

   ```html
   <!-- Before -->
   <ul link-text="Services" href="/services">
     <li><a href="/services/borrow">Borrowing</a></li>
   </ul>

   <!-- After -->
   <ul>
     <li>
       <a href="/services">Services</a>
       <ul>
         <li><a href="/services/borrow">Borrowing</a></li>
       </ul>
     </li>
   </ul>
   ```

   Old-style lists still parse, so this step can wait. But they're deprecated: only `link-text`, `href` and `aria-label` are read from them, and they can't have fields.

3. Move links out of wrapper elements, so each one is a direct child of the element, the list, or its `li`.
4. Remove `is-open`, `mobile-only` and `desktop-only`. They're ignored for now.

## Formats

### Flat

For simple menus: a series of `a`/`button` elements. Each one is a title-only item.

```html
<cork-quick-links>
  <a href="/hours">Hours</a>
  <a href="/give">Give</a>
  <button>Chat with a librarian</button>
</cork-quick-links>
```

### List

A `ul`/`ol` of `li` items, nested for sub menus. A top-level list is just a wrapper: its `li`s become the top-level items.

```html
<ul>
  <li>
    <a href="/services">Services</a>
    <span data-nav="description">Borrowing, printing, and research help</span>
    <ul>
      <li><a href="/services/borrow">Borrowing</a></li>
      <li><a href="/services/print">Printing</a></li>
    </ul>
  </li>
  <li>
    Collections
    <ul>
      <li><a href="/collections/special">Special Collections</a></li>
    </ul>
  </li>
</ul>
```

Formats can be mixed: each direct child is read on its own.

## Items

### Title

- **A `li`:** its first child `a`/`button`, skipping marked fields. With no `a`/`button`, it's the `li`'s own text (e.g. `Collections` above), not counting fields and nested lists.
- **A flat `a`/`button`:** its text.

Whitespace is collapsed. Items with no title are dropped.

### Attributes

Read from the element that supplies the title:

| Attribute | Notes |
| --- | --- |
| `href` | Kept as written, so relative URLs work with SPA routing. An `a` without one is shown as plain text. |
| `target` | e.g. `_blank`. |
| `disabled` | Buttons only. |
| `aria-label` | For a `li` without a link, put it on the `li`. |

### Fields

Direct children of a `li` with `data-nav="<name>"`. Their text, not their markup, is stored as a field: `<span data-nav="description">` becomes the `description` field. Fields aren't read from flat `a`/`button` elements.

Each element decides which fields it shows. `cork-primary-nav` shows `description`. `cork-nav-lite`, `cork-search-common` and `cork-quick-links` show titles only.

An element can use a different attribute name, with NavController's `fieldAttribute` option. Its docs say if it does.

### Links and buttons

- **Links:** the element renders its own link with the same `href`. Click listeners on your `a` don't run. Routers that watch document clicks, such as cork-app-state, still work.
- **Buttons:** a click on the rendered button is passed to your `button`, so its listeners run.

### Updates

The element re-reads the menu when its markup changes: items added or removed, text edited, or a read attribute changed. Menus rendered by a Lit template or another framework stay in sync.
