# CSS Custom Properties

`@ucd-lib/theme-sass`'s `css-properties.css` is replaced by `@ucd-lib/cork-theme`'s. Most properties now come from campus's SiteFarm styles, which use different names, so many properties were renamed. There are no aliases for old names: apps must update every reference.

## Steps

1. Update the import path:
   - Old: `@ucd-lib/theme-sass/css-properties.css`
   - New: `@ucd-lib/cork-theme/styles/css/css-properties.css`
2. Properties are now defined on `:root` instead of `html`. `:root` is more specific than `html`, so any app that overrides these properties on `html` must move those overrides to `:root`, or they will be ignored.
3. Rename every property in [Renamed](#renamed).
4. Replace every property in [Removed](#removed).

To find old names in an app, search for this regular expression:

```
--(ucd-black-[0-9]+|[a-z-]+--[a-z][a-z0-9-]*|unitrans-red|western-redbud|california-poppy|golden-lupine|sunny-grass|sky-blue|rec-pool-blue|wine-grape|mu-brick|hart-hall-stucco|sage-green|evergreen|winter-sky-gray|cork-oak|south-hall-brown|centennial-walk-gray)\b
```

It matches every renamed or removed property. It may also match an app's own custom properties that use a double hyphen; leave those alone.

## Renamed

57 properties. Replace the old name with the new name everywhere, including `var()` fallbacks.

| Old | New |
| --- | --- |
| `--ucd-black-90` | `--black-90` |
| `--ucd-black-80` | `--black-80` |
| `--ucd-black-70` | `--black-70` |
| `--ucd-black-60` | `--black-60` |
| `--ucd-black-50` | `--black-50` |
| `--ucd-black-40` | `--black-40` |
| `--ucd-black-30` | `--black-30` |
| `--ucd-black-20` | `--black-20` |
| `--ucd-black-10` | `--black-10` |
| `--brand--primary` | `--brand-primary` |
| `--brand--secondary` | `--brand-secondary` |
| `--brand--success` | `--brand-success` |
| `--brand--warning` | `--brand-warning` |
| `--brand--danger` | `--brand-danger` |
| `--brand--info` | `--brand-info` |
| `--brand--gray` | `--brand-gray` |
| `--brand--primary-90` | `--brand-primary-90` |
| `--brand--primary-80` | `--brand-primary-80` |
| `--brand--primary-70` | `--brand-primary-70` |
| `--brand--primary-60` | `--brand-primary-60` |
| `--brand--primary-50` | `--brand-primary-50` |
| `--brand--primary-40` | `--brand-primary-40` |
| `--brand--primary-30` | `--brand-primary-30` |
| `--brand--primary-20` | `--brand-primary-20` |
| `--brand--primary-10` | `--brand-primary-10` |
| `--brand--secondary-90` | `--brand-secondary-90` |
| `--brand--secondary-80` | `--brand-secondary-80` |
| `--brand--secondary-70` | `--brand-secondary-70` |
| `--brand--secondary-60` | `--brand-secondary-60` |
| `--brand--secondary-50` | `--brand-secondary-50` |
| `--brand--secondary-40` | `--brand-secondary-40` |
| `--brand--secondary-30` | `--brand-secondary-30` |
| `--brand--secondary-20` | `--brand-secondary-20` |
| `--brand--secondary-10` | `--brand-secondary-10` |
| `--link-color--secondary` | `--link-color-secondary` |
| `--link-color-hover--secondary` | `--link-color-hover-secondary` |
| `--font-family--sans-serif` | `--font-family-sans-serif` |
| `--font-family--icons` | `--font-family-icons` |
| `--font-family--icons-brand` | `--font-family-icons-brand` |
| `--font-family--serif` | `--font-family-serif` |
| `--font-family--monospace` | `--font-family-monospace` |
| `--font-family--headings` | `--font-family-headings` |
| `--font-size--large` | `--font-size-large` |
| `--font-size--small` | `--font-size-small` |
| `--line-height--small` | `--line-height-small` |
| `--font-weight--light` | `--font-weight-light` |
| `--font-weight--bold` | `--font-weight-bold` |
| `--font-weight--extra-bold` | `--font-weight-extra-bold` |
| `--font-weight--icons` | `--font-weight-icons` |
| `--font-weight--icons-regular` | `--font-weight-icons-regular` |
| `--spacer--tiny` | `--spacer-tiny` |
| `--spacer--small` | `--spacer-small` |
| `--spacer--medium` | `--spacer-medium` |
| `--spacer--large` | `--spacer-large` |
| `--spacer--huge` | `--spacer-huge` |
| `--border-radius--large` | `--border-radius-large` |
| `--border-radius--small` | `--border-radius-small` |

## Removed

16 deprecated legacy colors. Each was already an alias for a newer UC Davis color, so replace it with the property listed.

| Removed | Use instead |
| --- | --- |
| `--unitrans-red` | `--double-decker` |
| `--western-redbud` | `--redbud` |
| `--california-poppy` | `--poppy` |
| `--golden-lupine` | `--sunflower` |
| `--sunny-grass` | `--quad` |
| `--sky-blue` | `--tahoe` |
| `--rec-pool-blue` | `--putah-creek` |
| `--wine-grape` | `--pinot` |
| `--mu-brick` | `--rose` |
| `--hart-hall-stucco` | `--farmers-market` |
| `--sage-green` | `--sage` |
| `--evergreen` | `--redwood` |
| `--winter-sky-gray` | `--bodega` |
| `--cork-oak` | `--arboretum` |
| `--south-hall-brown` | `--california` |
| `--centennial-walk-gray` | `--black-30` |

## New

Properties that did not exist before. No action needed.

- `--container-edge-space`
- `--full-width`
- `--spacer-vast`
- `--wonder-blue`

The remaining 69 properties are unchanged.
