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
