

# Fix Mobile Modals on Real Phones

## Root Causes Identified

1. **Viewport meta tag is incomplete** -- `index.html` line 6 has `width=device-width, initial-scale=1.0` but is missing `maximum-scale=1.0, user-scalable=no`. Without these, mobile browsers may zoom in when focusing inputs, making the modal appear oversized and pushing buttons off-screen.

2. **Sheet uses fixed `h-[95vh]` instead of dynamic viewport height** -- On real phones, `95vh` includes the browser chrome (address bar, toolbar), so the sheet extends behind it. The keyboard then covers even more. Using `dvh` (dynamic viewport height) solves this.

3. **No global box-sizing or max-width constraint** -- Form elements inside the sheet can exceed the viewport width, causing horizontal overflow.

## Changes

### 1. `index.html` -- Fix viewport meta tag
Change line 6 from:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
to:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```
This prevents the browser from zooming when the user taps an input, keeping the modal properly sized on screen.

### 2. `src/components/ui/responsive-dialog.tsx` -- Fix Sheet sizing
Update the mobile Sheet branch:
- Change `h-[95vh]` to `max-h-[90vh]` with a `dvh` fallback via inline style (`maxHeight: '90dvh'`)
- Add `w-full` and `overflow-x-hidden` to SheetContent
- Add `box-border` to the scrollable body div
- These changes ensure the sheet fits within the visible viewport even when the browser chrome is present

### 3. `src/index.css` -- Add global mobile safety rules
Add to the base layer:
```css
*, *::before, *::after {
  box-sizing: border-box;
}
```
And add a mobile-specific rule to prevent any element from exceeding viewport width:
```css
@media (max-width: 767px) {
  input, textarea, select, button {
    max-width: 100%;
  }
}
```

## Technical Details

| File | Change |
|------|--------|
| `index.html` | Add `maximum-scale=1.0, user-scalable=no` to viewport meta |
| `src/components/ui/responsive-dialog.tsx` | Replace `h-[95vh]` with `max-h-[90vh]` + `dvh` fallback, add width/overflow constraints |
| `src/index.css` | Add `box-sizing: border-box` globally and mobile max-width on form elements |

## Risk
Low -- viewport meta change prevents zoom on all pages (intentional for an app-like experience). The CSS changes are additive and scoped.
