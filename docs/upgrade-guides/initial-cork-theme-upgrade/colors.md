# Colors

`colors.js`, the UC Davis palette as JS, moved from `@ucd-lib/theme-sass` to `styles/` in `@ucd-lib/cork-theme`. It is now generated from campus's Sass variables, so it always matches the stylesheets.

## Steps

1. Find imports of the old module:

   ```
   grep -rn "@ucd-lib/theme-sass/colors" --include=*.js src
   ```

2. Change the import path. Note the `.js` extension, which the old path did not need:

   | Old | New |
   | --- | --- |
   | `@ucd-lib/theme-sass/colors` | `@ucd-lib/cork-theme/styles/colors.js` |

The exports (`baseColors`, `blueTints`, `goldTints`, `blackTints`, `categoryBrands`) and their entries (`id`, `title`, `hex`, and `tint` for tints) are unchanged, and every existing color has the same value.

## New

- Each `categoryBrands` entry has two new fields, from campus's category brand definitions:
  - `contrast`: the color to use for text on the brand color
  - `brandTextOnWhite`: whether the brand color is readable as text on white
- New brands: `primary50`, `secondary50`, `centennialWalkGray`.

## Recommended

In element styles, use the CSS custom properties from `css-properties.css` instead of interpolating hex values. Custom properties inherit into shadow DOM, so this works inside components:

```js
// Before
color: ${unsafeCSS(categoryBrands.primary.hex)};

// After
color: var(--ucd-blue);
```

Keep `colors.js` for cases that need the values in JS, such as listing the palette or passing colors to a chart.
