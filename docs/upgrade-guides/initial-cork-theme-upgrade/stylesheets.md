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

- `style-ucdlib.css` still does not include fonts, as before. The app must load them itself.
- `@ucd-lib/cork-theme/styles/css/print.css` is new: campus's print stylesheet.
- `style-ucdlib.css` now includes the Font Awesome icons the theme's CSS uses (e.g. `.icon--calendar`, collapse and panel icons), as a small embedded font subset. The app no longer needs to load Font Awesome for these. The same subset is available on its own as `@ucd-lib/cork-theme/styles/css/font-awesome-subset.css`.
- If the app uses other Font Awesome icons (in its own markup, or its own `--fa` value on `.btn--icon`), it must still load Font Awesome 7 itself. The two coexist: the subset only covers its own icons (`unicode-range`), so the full font supplies the rest.
- Campus's redesign also renamed and removed some CSS classes. Those changes will be documented separately.
