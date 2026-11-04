# Initial Cork Theme Upgrade

Changes an app must make when moving from `@ucd-lib/theme-sass` and `@ucd-lib/theme-elements` to `@ucd-lib/cork-theme`. Work through each topic below.

- [CSS Custom Properties](css-properties.md): new import path, `html` to `:root`, renamed and removed properties.
- [Stylesheets](stylesheets.md): new paths for `style-ucdlib.css` and `style.css`.
- [Images and Fonts](images-and-fonts.md): copy the theme's images and fonts into the app, and point the theme at them.
- [Lit Styles](lit-styles.md): new paths for `*.css.js` modules, and campus partials that were removed.
- [Colors](colors.md): new path for `colors.js`, and new brand fields.
- [Mixins](mixins.md): new path for the Lit element mixins, and `MainDomElement` renamed (in progress).
- [Controllers](controllers.md): new path for the Lit reactive controllers, and the new `NavController` (in progress).
- [Elements](elements.md): `ucd-theme-*` elements replaced by `cork-*` elements, starting with quick links (in progress).
- [Nav Markup](nav-markup.md): the new markup for menus: nested `li` items, `data-nav` fields, and buttons.
