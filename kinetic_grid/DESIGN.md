# Design System Documentation: Modular Futurism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Technical Monolith."** 

This is not a generic "dark mode" interface. It is a high-precision digital environment designed for users who value technical excellence and discerning aesthetic clarity. We move beyond standard templates by embracing a "Modular Tectonic" approach—where the UI is treated as a series of interlocking, sharp-edged plates. 

By rejecting rounded corners (0px radius) and traditional dividers, we create a signature visual identity that feels like a high-end specialized instrument. The layout should feel intentional, mathematical, and authoritative, utilizing extreme typographic scales and deliberate asymmetry to guide the user’s eye through complex data landscapes.

---

## 2. Colors & Surface Logic
The palette is rooted in deep obsidian and slate tones, punctuated by a singular, high-energy primary accent.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined through **Background Color Shifts**. For example, a sidebar should use `surface-container-high` (#20201f) against a main content area of `surface` (#0e0e0e). This creates "implied lines" that feel more sophisticated than explicit strokes.

### Surface Hierarchy & Nesting
Depth is achieved through the stacking of Material-based surface tokens.
*   **Base Layer:** `surface` (#0e0e0e)
*   **Structural Sub-sections:** `surface-container-low` (#131313)
*   **Interactive Cards/Modules:** `surface-container-high` (#20201f)
*   **Floating/Active Elements:** `surface-container-highest` (#262626)

### The "Glass & Gradient" Rule
To add "visual soul" to the technical rigidity, use **Glassmorphism** for overlays. Apply `surface-variant` (#262626) at 60% opacity with a `20px` to `40px` backdrop blur. 
*   **Signature Textures:** Use subtle linear gradients for primary CTAs, transitioning from `primary` (#aaffdc) to `primary-container` (#00fdc1) at a 135-degree angle. This prevents the accent color from feeling "flat" and adds a high-tech luminescence.

---

## 3. Typography
Our typography strategy balances the mathematical precision of **Space Grotesk** with the utilitarian readability of **Inter**.

*   **Display & Headlines (Space Grotesk):** These roles are our primary "Editorial" voice. 
    *   *Signature Treatment:* All `display-lg` and `headline-lg` must utilize `0.05em` to `0.1em` letter spacing (tracking). This "airy" precision conveys a forward-thinking, technical personality.
*   **Body & Labels (Inter):** Used for density and functional clarity. 
    *   `body-md` is your workhorse. 
    *   Use `label-sm` in uppercase with `0.1em` tracking for metadata and technical tags to maintain the "instrument panel" aesthetic.

---

## 4. Elevation & Depth
In this system, elevation is not about "distance from the page" but about **"Tonal Layering."**

### The Layering Principle
Do not use shadows to create hierarchy. Instead, "nest" containers. An element placed on `surface-container-high` is visually "closer" to the user than one on `surface-container-low`. 

### Ambient Shadows
If a floating element (like a modal) requires a shadow, it must be an **Ambient Glow**.
*   **Shadow Specs:** Color: `primary` (#aaffdc) at 5-8% opacity. Blur: `40px` to `80px`. Spread: `-10px`. This mimics the soft light-bleed of a high-tech display rather than a physical drop shadow.

### The "Ghost Border" Fallback
Where containment is required for accessibility, use a **Ghost Border**:
*   **Token:** `outline-variant` (#484847) at **15% opacity**.
*   **Constraint:** Never use a 100% opaque border for containment.

---

## 5. Components

### Buttons (The Kinetic Trigger)
*   **Primary:** Solid `primary` (#aaffdc) block. Text is `on_primary` (#00654b). 0px radius.
*   **Secondary:** Ghost Border (see above) with `on_surface` text. On hover, transition to a subtle `surface-container-highest` background.
*   **States:** Interactive states should never "soften." Use hard-cut color flips (e.g., hover = 100% opacity, default = 80%).

### Input Fields
*   **Base:** `surface-container-lowest` (#000000) with a 1px `outline-variant` ghost border.
*   **Focus:** Border shifts to `primary` (#aaffdc) with a 2px inner-shadow "glow" using the accent color at 10% opacity. 
*   **Label:** Always use `label-md` in uppercase, floating strictly above the input.

### Chips & Tags
*   Small, rectangular boxes with `surface-container-high` backgrounds. 
*   For active states, use a 2px left-side border of `primary` to indicate selection, rather than changing the entire background.

### Lists & Data Grids
*   **Rule:** Forbid divider lines.
*   **Separation:** Use `16px` or `24px` of vertical white space from the spacing scale.
*   **Alternating Rows:** Use a subtle shift from `surface` to `surface-container-low` for alternating data rows to maintain legibility without visual clutter.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use extreme white space to separate major conceptual modules.
*   **Do** lean into asymmetry. A wider left margin with a tight right-aligned technical column creates an editorial feel.
*   **Do** use `primary` sparingly. It is a laser pointer, not a paint brush. Use it to draw the eye to the single most important action.
*   **Do** ensure all corners remain at **0px**.

### Don’t:
*   **Don't** use standard "Grey" for shadows. If it glows, it glows in `primary` or `tertiary`.
*   **Don't** use icons without technical context. Icons should be thin-stroke (1px or 1.5px) and geometric.
*   **Don't** use "Soft" transitions (e.g., 500ms eases). Use "Snap" transitions (150ms - 200ms) or "Hard Cuts" to emphasize the high-tech, responsive nature of the system.
*   **Don't** center-align long-form text. Keep everything on a strict, left-aligned modular grid to maintain the "Technical" personality.