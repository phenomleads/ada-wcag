import type { ParsedDocument, Validator, Violation, RGBColor, Luminance, ContrastRatio } from '../types/index.js';

/**
 * Parses a CSS color value (hex #RGB/#RRGGBB or rgb(r, g, b)) into an
 * RGBColor. Returns undefined for unsupported formats (named colors,
 * hsl(), etc.) since contrast checking requires concrete RGB values.
 *
 * @param colorString - A CSS color value, e.g. "#ffffff" or "rgb(0, 0, 0)".
 * @returns The parsed RGBColor, or undefined if the format is unsupported.
 */
export function parseColor(colorString: string): RGBColor | undefined {
  const trimmed = colorString.trim();

  const hexMatch = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(trimmed);
  if (hexMatch) {
    const hex = hexMatch[1]!;
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0]! + hex[0], 16),
        g: parseInt(hex[1]! + hex[1], 16),
        b: parseInt(hex[2]! + hex[2], 16),
      };
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/.exec(trimmed);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]!, 10),
      g: parseInt(rgbMatch[2]!, 10),
      b: parseInt(rgbMatch[3]!, 10),
    };
  }

  return undefined;
}

/**
 * Calculates the relative luminance of an RGB color per the WCAG 2.1
 * formula (gamma-corrected, weighted channel sum).
 *
 * @param color - The RGB color (0-255 per channel).
 * @returns The relative luminance in [0, 1].
 */
export function calculateLuminance(color: RGBColor): Luminance {
  const channels = [color.r, color.g, color.b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

/**
 * Calculates the WCAG contrast ratio between two colors. Symmetric: the
 * result does not depend on which color is passed as foreground vs
 * background.
 *
 * @param fg - The foreground (or either) color.
 * @param bg - The background (or either) color.
 * @returns The contrast ratio in [1, 21].
 */
export function calculateContrastRatio(fg: RGBColor, bg: RGBColor): ContrastRatio {
  const l1 = calculateLuminance(fg);
  const l2 = calculateLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Extracts a named CSS property value from an inline style attribute string. */
function extractStyleProperty(style: string, property: string): string | undefined {
  const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`, 'i');
  const match = regex.exec(style);
  return match?.[1]?.trim();
}

/** Determines whether inline font-size/font-weight styles indicate "large text" per WCAG 1.4.3. */
function isLargeText(style: string): boolean {
  const fontSize = extractStyleProperty(style, 'font-size');
  const fontWeight = extractStyleProperty(style, 'font-weight');

  if (fontSize === undefined) {
    return false;
  }

  const ptMatch = /^([\d.]+)pt$/.exec(fontSize);
  if (!ptMatch) {
    return false;
  }
  const sizePt = parseFloat(ptMatch[1]!);
  const isBold = fontWeight !== undefined && (fontWeight === 'bold' || parseInt(fontWeight, 10) >= 700);

  return sizePt >= 18 || (sizePt >= 14 && isBold);
}

/**
 * Validates text/background color contrast on elements with inline
 * styles, per WCAG 1.4.3 (Contrast Minimum). Only elements with both an
 * inline `color` and `background-color` are checked; elements without
 * both are skipped (contrast cannot be determined from CSS classes or
 * external stylesheets in this tool).
 */
export class ColorContrastValidator implements Validator {
  readonly name = 'ColorContrastValidator';
  readonly wcagCriterion = '1.4.3';

  /**
   * Checks elements with inline color + background-color styles against
   * the WCAG 1.4.3 contrast thresholds (4.5:1 normal text, 3:1 large text).
   *
   * @param doc - The parsed document to check.
   * @returns An array of warnings for insufficient contrast.
   */
  validate(doc: ParsedDocument): Violation[] {
    const { $ } = doc;
    const violations: Violation[] = [];

    $('[style*="color"]').each((_, elem) => {
      const $elem = $(elem);
      const style = $elem.attr('style') ?? '';

      const colorValue = extractStyleProperty(style, 'color');
      const bgValue = extractStyleProperty(style, 'background-color');

      if (colorValue === undefined || bgValue === undefined) {
        return;
      }

      const fg = parseColor(colorValue);
      const bg = parseColor(bgValue);
      if (fg === undefined || bg === undefined) {
        return;
      }

      const ratio = calculateContrastRatio(fg, bg);
      const large = isLargeText(style);
      const threshold = large ? 3.0 : 4.5;

      if (ratio < threshold) {
        violations.push({
          wcag: this.wcagCriterion,
          severity: 'warning',
          element: `<${elem.tagName}>`,
          issue: `Insufficient contrast${large ? ' for large text' : ''}: ${ratio.toFixed(2)}:1 (need ${threshold}:1)`,
          line: elem.sourceCodeLocation?.startLine,
          fix: 'Increase contrast between text and background colors',
        });
      }
    });

    return violations;
  }
}
