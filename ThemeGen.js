/**
 * @zakkster/lite-theme-gen — Professional OKLCH Theme Generation
 *
 * Generates a complete design system from a single OKLCH brand color.
 * Produces Tailwind-style 11-step neutral and accent scales, semantic tokens,
 * and guaranteed-contrast text colors.
 *
 * Powered by @zakkster/lite-color and @zakkster/lite-lerp.
 *
 * ALGORITHM:
 *   Uses a hand-tuned lightness map (not linear interpolation) inspired by
 *   Tailwind CSS and Radix UI. The dark and light ends are stretched for
 *   maximum visual separation. Dark shades receive a chroma boost to prevent
 *   the "muddy gray" collapse that OKLCH suffers at low lightness.
 */

import { lerpOklch, toCssOklch } from '@zakkster/lite-color';
import { clamp, lerp } from '@zakkster/lite-lerp';

// ─────────────────────────────────────────────────────────
//  LIGHTNESS MAP — The core of the algorithm.
//  Hand-tuned to match Tailwind/Radix visual weight.
//  Key insight: 800→900→950 must be spread apart (not linear).
// ─────────────────────────────────────────────────────────

const LIGHTNESS_MAP = {
    50:  0.97,
    100: 0.93,
    200: 0.87,
    300: 0.77,
    400: 0.66,
    500: 0.55,
    600: 0.44,
    700: 0.33,
    800: 0.23,
    900: 0.15,
    950: 0.07,
};

const STEP_NAMES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];


// ─────────────────────────────────────────────────────────
//  CHROMA CURVE — Prevents muddy darks and washed-out lights.
//  Below l=0.30: boost chroma by up to 25% (dark shades stay rich).
//  Above l=0.85: reduce chroma (light tints stay subtle, not garish).
//  Between: full saturation.
// ─────────────────────────────────────────────────────────

function adjustChroma(baseChroma, lightness) {
    if (lightness < 0.30) {
        // Dark boost: chroma * 1.0→1.25 as lightness drops from 0.30 → 0.0
        const boost = lerp(1.0, 1.25, 1 - lightness / 0.30);
        return Math.min(baseChroma * boost, 0.4);
    }
    if (lightness > 0.85) {
        // Light reduction: chroma * 1.0→0.15 as lightness rises from 0.85 → 1.0
        const reduction = lerp(1.0, 0.15, (lightness - 0.85) / 0.15);
        return baseChroma * reduction;
    }
    return baseChroma;
}


// ─────────────────────────────────────────────────────────
//  HUE SHIFT — Subtle hue rotation across the scale.
//  Warm highlights, cooler shadows. Matches how real paint
//  and lighting work (yellow in highlights, blue in shadows).
// ─────────────────────────────────────────────────────────

function shiftHue(baseHue, lightness, hueShift) {
    // Shift toward warm in highlights, cool in shadows
    const t = (lightness - 0.5) * 2; // -1 to +1
    return baseHue + t * hueShift;
}


// ─────────────────────────────────────────────────────────
//  SCALE BUILDER — Constructs a single 11-step scale.
// ─────────────────────────────────────────────────────────

function buildScale(baseHue, baseChroma, hueShift, isNeutral) {
    const scale = {};

    for (const step of STEP_NAMES) {
        const targetL = LIGHTNESS_MAP[step];

        // Chroma: neutrals get very low chroma (subtle brand tint)
        // Accents get the full brand chroma, adjusted for lightness
        const rawC = isNeutral
            ? baseChroma * 0.06  // 6% of brand chroma for neutrals
            : baseChroma;

        const c = adjustChroma(rawC, targetL);
        const h = shiftHue(baseHue, targetL, hueShift);

        scale[step] = { l: targetL, c, h };
    }

    return scale;
}


// ─────────────────────────────────────────────────────────
//  CONTRAST GUARANTEE
// ─────────────────────────────────────────────────────────

function ensureContrast(textColor, bgColor, minDelta = 0.45) {
    const out = { ...textColor };
    const delta = Math.abs(out.l - bgColor.l);

    if (delta < minDelta) {
        out.l = bgColor.l > 0.5
            ? clamp(bgColor.l - minDelta, 0, 1)
            : clamp(bgColor.l + minDelta, 0, 1);
    }
    return out;
}


// ─────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────

/**
 * Generate a complete theme palette from a single brand color.
 *
 * @param {{ l: number, c: number, h: number }} brand  OKLCH brand color
 * @param {Object}  [options]
 * @param {string}  [options.mode='light']     'light' or 'dark'
 * @param {number}  [options.contrast=0.45]    Minimum lightness delta for text
 * @param {number}  [options.hueShift=12]      Hue rotation for highlights/shadows
 * @returns {Object} Palette with neutral-50..950, accent-50..950, and semantic tokens
 */
export function generateTheme(brand, options = {}) {
    if (!brand || typeof brand.l !== 'number' || typeof brand.c !== 'number' || typeof brand.h !== 'number') {
        throw new Error('lite-theme-gen: brand must be an OKLCH object with { l, c, h }');
    }

    const mode     = options.mode || 'light';
    const contrast = options.contrast || 0.45;
    const hueShift = options.hueShift ?? 12;
    const isLight  = mode === 'light';

    // Build the two 11-step scales
    const neutralScale = buildScale(brand.h, brand.c, hueShift, true);
    const accentScale  = buildScale(brand.h, brand.c, hueShift, false);

    // Assemble the palette
    const palette = { mode, brand };

    for (const step of STEP_NAMES) {
        if (isLight) {
            palette[`neutral-${step}`] = neutralScale[step];
            palette[`accent-${step}`]  = accentScale[step];
        } else {
            // Dark mode: invert the scale (50 gets 950's lightness, etc.)
            const invertedStep = STEP_NAMES[STEP_NAMES.length - 1 - STEP_NAMES.indexOf(step)];
            palette[`neutral-${step}`] = neutralScale[invertedStep];
            palette[`accent-${step}`]  = accentScale[invertedStep];
        }
    }

    // ── Semantic Tokens ──
    palette.bg           = palette['neutral-50'];
    palette.bgMuted      = palette['neutral-100'];
    palette.surface      = palette['neutral-200'];
    palette.surfaceHover = palette['neutral-300'];

    palette.borderSubtle = palette['neutral-300'];
    palette.borderStrong = palette['neutral-400'];

    palette.accent      = brand;
    // Hover/active: pick from the scale rather than interpolating
    palette.accentHover      = isLight ? palette['accent-600'] : palette['accent-400'];
    palette.accentActive     = isLight ? palette['accent-700'] : palette['accent-300'];
    palette.accentSoftBg     = isLight ? palette['accent-100'] : palette['accent-900'];
    palette.accentSoftBorder = isLight ? palette['accent-300'] : palette['accent-700'];

    // ── Contrast-guaranteed text ──
    const rawText      = palette['neutral-900'];
    const rawTextMuted = palette['neutral-600'];

    palette.text      = ensureContrast(rawText, palette.bg, contrast);
    palette.textMuted = ensureContrast(rawTextMuted, palette.bg, contrast - 0.15);

    const textOnAccentBase = isLight ? { l: 0.97, c: 0, h: 0 } : { l: 0.1, c: 0, h: 0 };
    palette.textOnAccent = ensureContrast(textOnAccentBase, palette.accent, contrast);

    return palette;
}


/**
 * Convert a palette to CSS custom properties.
 */
export function toCssVariables(palette, { prefix = 'lt', selector = ':root' } = {}) {
    const entries = Object.entries(palette).filter(([k]) => k !== 'mode' && k !== 'brand');

    const lines = entries.map(([key, color]) => {
        const cssKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
        return `  --${prefix}-${cssKey}: ${toCssOklch(color)};`;
    });

    return `${selector} {\n${lines.join('\n')}\n}`;
}


/**
 * One-liner: generate theme + CSS variables.
 */
export function createThemeCss(brand, options = {}) {
    const palette = generateTheme(brand, options);
    const cssVars = toCssVariables(palette, options);
    return { palette, cssVars };
}