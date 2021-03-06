# Ripple | PreCSS
[![Coverage Status](https://coveralls.io/repos/rijs/precss/badge.svg?branch=master&service=github)](https://coveralls.io/github/rijs/precss?branch=master)
[![Build Status](https://travis-ci.org/rijs/precss.svg)](https://travis-ci.org/rijs/precss)
<br>[![Browser Results](https://saucelabs.com/browser-matrix/precss.svg)](https://saucelabs.com/u/precss)


Extends the [rendering pipeline]() to prepend stylesheet(s) for a component. It will be added to either the start of the shadow root if one exists, or scoped and added once in the `head`.

Using the following syntax:

```html
<component-name css="styles.css">
```

A `style` tag with the CSS styles from the specified resource (`ripple('styles.css')`) will be added to the beginning of the shadow root.

```html
<component-name css="styles.css">
  #shadow-root
    <style resource="styles.css"> /* ... */ </style>
```

If there is no shadow, the styles will scoped and added to the end of the document `head`. The style tags are deduped so there will only be one for each specfic CSS resource in use.

Multiple CSS modules are also possible:

```html
<component-name css="component-styles.css fa-circle.css fa-square.css">
  #shadow-root
    <style resource="component-styles.css"> /* ... */ </style>
    <style resource="fa-circle.css"> /* ... */ </style>
    <style resource="fa-square.css"> /* ... */ </style>
```