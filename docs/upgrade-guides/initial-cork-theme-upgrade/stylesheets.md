# Stylesheets

The compiled stylesheets moved from the root of `@ucd-lib/theme-sass` to `styles/css/` in `@ucd-lib/cork-theme`.

## Steps

Update the import or copy path of each stylesheet the app uses:

| Old | New |
| --- | --- |
| `@ucd-lib/theme-sass/style-ucdlib.css` | `@ucd-lib/cork-theme/styles/css/style-ucdlib.css` |
| `@ucd-lib/theme-sass/style.css` | `@ucd-lib/cork-theme/styles/css/style.css` |

`style-ucdlib.css` is the library stylesheet and the one most apps should use. `style.css` is campus's stylesheet, unmodified.

## Notes

- `style-ucdlib.css` still does not include fonts (Proxima Nova, Ryman Eco), as before. The fonts are now served by the cork-theme app at `https://cork-theme.library.ucdavis.edu/fonts`, and the package has a ready-made stylesheet for them. Use one of:
  - CSS: `@ucd-lib/cork-theme/styles/css/fonts.css`
  - Lit: `@ucd-lib/cork-theme/styles/js/ucdlib-sass/fonts.css.js`. Browsers ignore `@font-face` inside a shadow root, so adopt it on the document, not in a component's `static styles`: `document.adoptedStyleSheets = [...document.adoptedStyleSheets, fonts.styleSheet];`
  - Sass, to load the fonts from somewhere else: `@use "pkg:@ucd-lib/cork-theme/styles/ucdlib-sass/fonts" with ($fonts-url: "https://example.edu/fonts");`
- `@ucd-lib/cork-theme/styles/css/print.css` is new: campus's print stylesheet.
- `style-ucdlib.css` now includes `.h1`–`.h6` classes, which give an element the look of a heading level without its semantics (e.g. `<p class="h2">`). They are built from campus's own heading styles. Apps that defined these classes themselves (e.g. in a `headings.css`) can delete them. Campus's redesign changed some heading styles: `h3` is now blue rather than gray, and links in headings use `:focus-visible` rather than `:focus`.
- `style-ucdlib.css` now includes every custom property in `css-properties.css` (campus's and ours). An app that loads `style-ucdlib.css` does not also need `css-properties.css`.
- `style-ucdlib.css` now includes the Font Awesome icons the theme's CSS uses (e.g. `.icon--calendar`, collapse and panel icons), as a small embedded font subset. The app no longer needs to load Font Awesome for these. The same subset is available on its own as `@ucd-lib/cork-theme/styles/css/font-awesome-subset.css`.
- If the app uses other Font Awesome icons (in its own markup, or its own `--fa` value on `.btn--icon`), it must still load Font Awesome 7 itself. The two coexist: the subset only covers its own icons (`unicode-range`), so the full font supplies the rest.
- Campus's redesign also renamed and removed some CSS classes. Those changes will be documented separately.
