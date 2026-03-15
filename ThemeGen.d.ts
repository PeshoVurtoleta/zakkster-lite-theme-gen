import type { OklchColor } from '@zakkster/lite-color';

/** Scale step names matching the Tailwind convention. */
export type ScaleStep = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

export interface ThemeOptions {
    /** 'light' (default) or 'dark'. Dark mode inverts the lightness scale. */
    mode?: 'light' | 'dark';

    /** Minimum lightness delta between text and background. Default: 0.45 */
    contrast?: number;

    /**
     * Hue rotation for warm highlights / cool shadows. Default: 12
     *
     * Higher values produce more visible hue variation across the scale.
     * Set to 0 for a perfectly monochromatic ramp.
     */
    hueShift?: number;
}

export interface CssVariableOptions {
    /** CSS variable prefix. Default: 'lt' → `--lt-bg`, `--lt-accent-500`, etc. */
    prefix?: string;

    /** CSS selector to wrap the variables in. Default: ':root' */
    selector?: string;
}

/**
 * A complete theme palette generated from a single brand color.
 *
 * Contains:
 *   - 11-step neutral scale (neutral-50 through neutral-950)
 *   - 11-step accent scale (accent-50 through accent-950)
 *   - 14 semantic tokens (bg, text, accent, borders, surfaces, etc.)
 *   - mode ('light' | 'dark') and the original brand color
 *
 * Lightness is distributed via a hand-tuned map (not linear interpolation):
 *   50: 0.97, 100: 0.93, 200: 0.87, 300: 0.77, 400: 0.66,
 *   500: 0.55, 600: 0.44, 700: 0.33, 800: 0.23, 900: 0.15, 950: 0.07
 *
 * Chroma is compensated: boosted up to 25% below L=0.30 (rich darks),
 * reduced above L=0.85 (soft tints).
 */
export interface ThemePalette {
    mode: 'light' | 'dark';
    brand: OklchColor;

    // ── Neutral scale (brand-tinted grays) ──
    'neutral-50': OklchColor;
    'neutral-100': OklchColor;
    'neutral-200': OklchColor;
    'neutral-300': OklchColor;
    'neutral-400': OklchColor;
    'neutral-500': OklchColor;
    'neutral-600': OklchColor;
    'neutral-700': OklchColor;
    'neutral-800': OklchColor;
    'neutral-900': OklchColor;
    'neutral-950': OklchColor;

    // ── Accent scale (full-saturation brand ramp) ──
    'accent-50': OklchColor;
    'accent-100': OklchColor;
    'accent-200': OklchColor;
    'accent-300': OklchColor;
    'accent-400': OklchColor;
    'accent-500': OklchColor;
    'accent-600': OklchColor;
    'accent-700': OklchColor;
    'accent-800': OklchColor;
    'accent-900': OklchColor;
    'accent-950': OklchColor;

    // ── Semantic tokens: Surfaces ──
    /** Page background. Maps to neutral-50 (light) or neutral-950 (dark). */
    bg: OklchColor;
    /** Muted background for sidebars, cards. Maps to neutral-100. */
    bgMuted: OklchColor;
    /** Raised surface (cards, dropdowns). Maps to neutral-200. */
    surface: OklchColor;
    /** Hovered surface state. Maps to neutral-300. */
    surfaceHover: OklchColor;

    // ── Semantic tokens: Borders ──
    /** Subtle border for dividers. Maps to neutral-300. */
    borderSubtle: OklchColor;
    /** Strong border for inputs, focus rings. Maps to neutral-400. */
    borderStrong: OklchColor;

    // ── Semantic tokens: Accent ──
    /** Primary accent — the original brand color. */
    accent: OklchColor;
    /** Accent on hover. Maps to accent-600 (light) or accent-400 (dark). */
    accentHover: OklchColor;
    /** Accent on press/active. Maps to accent-700 (light) or accent-300 (dark). */
    accentActive: OklchColor;
    /** Soft accent background (badges, chips). Maps to accent-100 (light) or accent-900 (dark). */
    accentSoftBg: OklchColor;
    /** Soft accent border. Maps to accent-300 (light) or accent-700 (dark). */
    accentSoftBorder: OklchColor;

    // ── Semantic tokens: Text ──
    /** Primary text. Contrast-guaranteed against bg. */
    text: OklchColor;
    /** Muted text (descriptions, placeholders). Contrast-guaranteed against bg. */
    textMuted: OklchColor;
    /** Text rendered on top of the accent color. Contrast-guaranteed against accent. */
    textOnAccent: OklchColor;
}

/**
 * Generate a complete theme palette from a single brand color.
 *
 * Uses a hand-tuned lightness map (not linear interpolation) with chroma
 * compensation for rich darks and soft tints. Text colors are guaranteed
 * to meet the minimum contrast delta.
 *
 * @param brand  OKLCH brand color (e.g. `{ l: 0.55, c: 0.20, h: 260 }`)
 * @param options  Mode, contrast, hueShift
 * @returns A palette with 22 scale colors + 14 semantic tokens
 */
export function generateTheme(brand: OklchColor, options?: ThemeOptions): ThemePalette;

/**
 * Convert a palette to a CSS custom properties block.
 *
 * @returns CSS string like `:root { --lt-bg: oklch(...); ... }`
 */
export function toCssVariables(palette: ThemePalette, options?: CssVariableOptions): string;

/**
 * One-liner: generate theme + CSS variables.
 *
 * @returns `{ palette, cssVars }` — palette object and CSS string
 */
export function createThemeCss(
    brand: OklchColor,
    options?: ThemeOptions & CssVariableOptions
): {
    palette: ThemePalette;
    cssVars: string;
};