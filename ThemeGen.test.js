import { describe, it, expect, vi } from 'vitest';

// Mock peer dependencies
vi.mock('@zakkster/lite-color', () => ({
    createGradient: (colors, ease) => (t) => {
        if (colors.length === 1) return colors[0];
        const clamped = Math.max(0, Math.min(1, ease ? ease(t) : t));
        const scaled = clamped * (colors.length - 1);
        const idx = Math.min(Math.floor(scaled), colors.length - 2);
        const local = scaled - idx;
        const a = colors[idx], b = colors[idx + 1];
        return {
            l: a.l + (b.l - a.l) * local,
            c: a.c + (b.c - a.c) * local,
            h: a.h + (b.h - a.h) * local,
        };
    },
    toCssOklch: ({ l, c, h, a = 1 }) => `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)} / ${a})`,
}));

vi.mock('@zakkster/lite-lerp', () => ({
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    easeOut: (t) => { const f = t - 1; return f * f * f + 1; },
}));

import { generateTheme, toCssVariables, createThemeCss } from './LiteThemeGen.js';

const brand = { l: 0.65, c: 0.20, h: 40 };

describe('🎨 lite-theme-gen', () => {

    describe('generateTheme()', () => {
        it('returns a palette object', () => {
            const palette = generateTheme(brand);
            expect(palette).toBeTypeOf('object');
            expect(palette.mode).toBe('light');
        });

        it('includes neutral and accent scales', () => {
            const p = generateTheme(brand);
            expect(p['neutral-50']).toBeDefined();
            expect(p['neutral-500']).toBeDefined();
            expect(p['neutral-950']).toBeDefined();
            expect(p['accent-50']).toBeDefined();
            expect(p['accent-950']).toBeDefined();
        });

        it('includes semantic tokens', () => {
            const p = generateTheme(brand);
            expect(p.bg).toBeDefined();
            expect(p.text).toBeDefined();
            expect(p.accent).toBe(brand);
            expect(p.accentHover).toBeDefined();
            expect(p.textOnAccent).toBeDefined();
        });

        it('supports dark mode', () => {
            const light = generateTheme(brand, { mode: 'light' });
            const dark = generateTheme(brand, { mode: 'dark' });
            expect(dark.mode).toBe('dark');
            // Dark mode inverts the neutral scale
            expect(dark['neutral-50'].l).not.toBeCloseTo(light['neutral-50'].l, 1);
        });

        it('throws on invalid brand', () => {
            expect(() => generateTheme(null)).toThrow(/OKLCH/);
            expect(() => generateTheme({ l: 0.5 })).toThrow(/OKLCH/);
            expect(() => generateTheme('red')).toThrow(/OKLCH/);
        });

        it('ensures text contrast', () => {
            const p = generateTheme(brand, { contrast: 0.45 });
            const delta = Math.abs(p.text.l - p.bg.l);
            expect(delta).toBeGreaterThanOrEqual(0.44); // floating point tolerance
        });
    });

    describe('toCssVariables()', () => {
        it('returns a CSS string with custom properties', () => {
            const p = generateTheme(brand);
            const css = toCssVariables(p);
            expect(css).toContain(':root');
            expect(css).toContain('--lt-');
            expect(css).toContain('oklch(');
        });

        it('uses custom prefix and selector', () => {
            const p = generateTheme(brand);
            const css = toCssVariables(p, { prefix: 'app', selector: '.theme' });
            expect(css).toContain('.theme');
            expect(css).toContain('--app-');
        });

        it('converts camelCase to kebab-case', () => {
            const p = generateTheme(brand);
            const css = toCssVariables(p);
            expect(css).toContain('surface-hover');
            expect(css).toContain('text-on-accent');
        });

        it('excludes mode and brand keys', () => {
            const p = generateTheme(brand);
            const css = toCssVariables(p);
            expect(css).not.toContain('--lt-mode');
            expect(css).not.toContain('--lt-brand');
        });
    });

    describe('createThemeCss()', () => {
        it('returns palette and cssVars', () => {
            const result = createThemeCss(brand);
            expect(result.palette).toBeDefined();
            expect(result.cssVars).toContain('oklch(');
        });

        it('passes options through', () => {
            const result = createThemeCss(brand, { mode: 'dark', prefix: 'dk' });
            expect(result.palette.mode).toBe('dark');
            expect(result.cssVars).toContain('--dk-');
        });
    });
});