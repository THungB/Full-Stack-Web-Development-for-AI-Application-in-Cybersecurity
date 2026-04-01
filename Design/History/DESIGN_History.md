# Design System Strategy: The Sentinel Aesthetic

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Observatory."** 

In the high-stakes world of cybersecurity, we must move beyond the "hacker terminal" trope. Instead, we are building a sophisticated, high-fidelity environment that feels like a premium command center. We break the standard "template" look through **intentional asymmetry**—using wide gutters and offset data visualizations—and **tonal depth**. Rather than a flat grid of boxes, the UI is treated as a series of translucent, illuminated layers that appear to float in a deep, atmospheric space.

## 2. Colors & Atmospheric Depth
Our palette is rooted in the `surface` (#0b1326), a deep, obsidian indigo that provides the canvas for our high-tech accents.

*   **Primary (Brand):** `primary` (#bac3ff) and `primary_container` (#3f51b5). Use these for high-level brand moments and interactive focal points.
*   **Semantic Intelligence:** 
    *   **Ham (Safe):** `secondary` (#4ae176). This represents safety. It should be used with a subtle outer glow to simulate "active health."
    *   **Spam (Threat):** `tertiary` (#ffb3ad) / `error` (#ffb4ab). This represents heat and friction. Use it sparingly to ensure high-impact alerts.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Traditional lines clutter the "Observatory" feel. Boundaries must be defined strictly through:
1.  **Background Shifts:** Place a `surface_container_high` card on a `surface` background.
2.  **Tonal Transitions:** Use the hierarchy of `surface_container_lowest` to `highest` to imply structure.

### The "Glass & Gradient" Rule
To achieve a signature feel, main CTAs and "Hero" data points must use a linear gradient (e.g., `primary` transitioning to `primary_container`). Floating panels should utilize **Glassmorphism**: a combination of semi-transparent surface colors (60-80% opacity) and a `20px` backdrop-blur to allow the "energy" of the background data to bleed through.

## 3. Typography: Editorial Authority
We utilize a dual-font approach to balance technical precision with executive readability.

*   **Display & Headlines (Manrope):** Used for large data points and section headers. Manrope’s geometric nature feels architectural. Use `display-lg` (3.5rem) for high-level "Threat Scores" to create an editorial, magazine-style hierarchy.
*   **Body & Labels (Inter):** Used for all functional data. Inter is selected for its high legibility in dense cybersecurity logs.
*   **The Hierarchy Strategy:** Create contrast by pairing a `headline-lg` title with a `label-sm` metadata tag. This gap in scale creates a "Pro" aesthetic that feels custom-engineered.

## 4. Elevation & Depth
We eschew traditional "Material" dropshadows in favor of **Tonal Layering** and **Ambient Glows.**

*   **The Layering Principle:** Depth is achieved by "stacking." 
    *   *Base:* `surface`
    *   *Section:* `surface_container_low`
    *   *Component/Card:* `surface_container_high`
*   **Ambient Glows:** For "Safe" or "Danger" states, use a glow instead of a shadow. A `secondary` (Green) glow with a 24px blur at 10% opacity creates a "status light" effect that feels integrated into the hardware of the screen.
*   **The "Ghost Border" Fallback:** If a separator is required for accessibility, use the `outline_variant` token at **15% opacity**. Anything higher is too aggressive for this system.

## 5. Components

### Buttons & Interaction
*   **Primary:** High-saturation `primary_container` with a `primary` subtle inner glow. 
*   **Semantic (Ham/Spam):** Use `secondary_container` for "Allow" and `tertiary_container` for "Quarantine."
*   **Shape:** Strictly follow the Roundedness Scale `DEFAULT` (0.5rem / 8px) for a modern, compact look.

### Input Fields & Search
*   **Styling:** Use `surface_container_highest` for the field background. No bottom line. Use a `2px` `primary` left-border only when the field is focused to create a "sidebar" active state.

### Cards & Lists
*   **No Dividers:** Forbid the use of `hr` lines. Use `spacing-6` (1.3rem) of vertical whitespace to separate log entries.
*   **The Hover State:** On hover, a list item should transition from `surface` to `surface_container_low`, giving a "lift" effect without moving pixels.

### Cybersecurity-Specific Components
*   **The "Threat Meter":** A radial gauge using a gradient from `secondary` (Green) to `tertiary` (Red).
*   **Status Chips:** Small, pill-shaped (`rounded-full`) indicators. Use `on_secondary_container` text on a `secondary_container` background for a low-contrast, premium look.

## 6. Do’s and Don’ts

### Do:
*   **DO** use `surface_container_highest` for "hover" states on cards to create a tactile feel.
*   **DO** use `display-lg` for "Large Numbers" (e.g., 99.9% detection rate). Make the data the hero.
*   **DO** use Lucide icons with a `1.5px` stroke weight to match the Inter typography.

### Don’t:
*   **DON'T** use pure white (#FFFFFF) for text. Always use `on_surface` (#dae2fd) to reduce eye strain in dark mode.
*   **DON'T** use standard 1px borders. If you feel you need a border, try an extra `0.5rem` of padding first.
*   **DON'T** use vibrant red text on dark backgrounds without a container; it vibrates. Use the `tertiary` (#ffb3ad) peach-red for better legibility.