# Images and Fonts

Large theme images (the header bar and its variants, the nav tray backgrounds, the footer) and the theme fonts (Proxima Nova, Ryman Eco) are not bundled into the CSS or elements. The app chooses where they are served from. Small images (icons, etc.) are still embedded, and so are the Font Awesome icons the theme uses.

## Steps

1. Copy the images and fonts into the app at build time, e.g. in its Dockerfile after `npm install`:

   ```dockerfile
   RUN npx cork-theme copy-images ./public/images/cork-theme
   RUN npx cork-theme copy-fonts ./public/fonts/cork-theme
   ```

   Each command prints the call to add to the app. From Node, the same functions are `copyImages(dest)` and `copyFonts(dest)` in `@ucd-lib/cork-theme/utils/assets/copy.js`.

2. Point the theme at them, early in the app's entry file (before the header first renders):

   ```js
   import { setImageCssCustomProperties, setFontFaces } from '@ucd-lib/cork-theme/utils/assets';

   setImageCssCustomProperties('/images/cork-theme');
   setFontFaces('/fonts/cork-theme');
   ```

   Both take any base URL, e.g. a CDN. The browser only downloads the images actually shown (e.g. a nav tray image when its tray first opens).

3. Remove any old font loading (e.g. a `fonts.css` pointing at campus's font server), and any copying of `@ucd-lib/theme-sass` images.

## Alternatives

- **Hosted fonts, no copying:** load `@ucd-lib/cork-theme/styles/css/fonts.css` (or its `css.js`/Sass versions, see [Stylesheets](stylesheets.md)) instead of calling `setFontFaces()`. It points at the cork-theme app.
- **Without `setImageCssCustomProperties()`:** set the properties yourself in CSS. Their names are in `@ucd-lib/cork-theme/styles/image-properties.js`.

  ```css
  :root {
    --cork-image-header-bar1: url("/images/cork-theme/header-bar1.webp");
  }
  ```

  Always give a full `url(...)` value. An invalid value (such as a bare path) makes the browser drop the whole `background` declaration, color included.

## Building the Sass yourself

The `--cork-image-*` properties, the embedded small images and the embedded Font Awesome icons are added by the package's own build, after Sass compiles. An app that compiles the package's Sass itself (e.g. `@use "pkg:@ucd-lib/cork-theme/styles/ucdlib-sass/style-ucdlib";`) gets campus's plain output instead. So:

- **Images:** the compiled CSS keeps campus's relative URLs, `url("../images/<file>")`, for every image, large and small. Copy them all with `--all`, and serve them as an `images/` folder next to the folder holding the compiled CSS. For example, with the CSS at `/css/app.css`, serve the images at `/images/`:

  ```dockerfile
  RUN npx cork-theme copy-images ./public/images --all
  ```

  Without `--all`, only the large images are copied. `setImageCssCustomProperties()` has no effect here, since the properties aren't in the CSS. From Node, use `copyImages(dest, { all: true })`.
- **Fonts:** compile `fonts.scss` with your fonts folder, and copy the fonts there:

  ```scss
  @use "pkg:@ucd-lib/cork-theme/styles/ucdlib-sass/fonts" with ($fonts-url: "/fonts/cork-theme");
  ```

  ```dockerfile
  RUN npx cork-theme copy-fonts ./public/fonts/cork-theme
  ```

  Or skip `fonts.scss` and call `setFontFaces('/fonts/cork-theme')`, as in [Steps](#steps).
- **Font Awesome icons:** the icons the theme's CSS uses come from a font subset that isn't in the Sass. Load `@ucd-lib/cork-theme/styles/css/font-awesome-subset.css` alongside the compiled CSS, or load Font Awesome 7 Free.

The `.css.js` modules and `css/style-ucdlib.css` are already built, so none of this applies to apps that use them.

## How it works

In `style-ucdlib.css` and the `css.js` modules, every image is a custom property named after its file: `--cork-image-<file name without extension>`, e.g. `--cork-image-nav-tray-menu-bg`.

- **Large images** fall back to `none`. Until the property is set, the element keeps its background color and has no image.
- **Small images** fall back to their embedded copy. They work with no setup, and can be overridden the same way.

Custom properties are inherited into shadow DOM, so setting them once on the document covers the global stylesheet and every element. `style.css` (campus's stylesheet, unmodified) still uses relative `../images/` URLs.

The fonts can't work the same way, as `@font-face` doesn't allow custom properties. `setFontFaces()` adds them with the browser's FontFace API instead, which also works inside shadow DOM.

## cork-header

- `backdrop="1"` to `"7"` picks campus's header bar variant (1 is the default). Plain HTML can use campus's classes, `header__bar--backdrop2` to `header__bar--backdrop7`.
- `background-image-url` replaces the header bar image, whichever backdrop is picked.
- `nav-tray-menu-background-image-url`, `nav-tray-search-background-image-url`, `nav-tray-quicklinks-background-image-url` and `nav-tray-quicklinks-accent-image-url` replace a nav tray image.

These set the matching `--cork-image-*` properties on that header only.
