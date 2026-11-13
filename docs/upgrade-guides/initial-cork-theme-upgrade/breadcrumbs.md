# Breadcrumbs

Breadcrumb class and markup are nearly identical: 

```html
<ol class="breadcrumbs ">
  <li>
    <a href="/">Home</a>
  </li>
  <li>
    Current Page
  </li>
</ol>
```

Except now there are decorative dots that come after (`class='breadcrumb__dots'`):
```html
<ol class="breadcrumbs">
  <li>
    <a href="/">Home</a>
  </li>
  <li>
    Current Page
  </li>
</ol>
<div class="breadcrumbs__dots"></div>
```