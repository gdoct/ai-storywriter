import type { PaletteName } from '../types/board'

export const PALETTES: Record<PaletteName, Record<string, string>> = {
  warm: {
    '--paper': '#f6f1e7',
    '--paper-2': '#eee7d6',
    '--accent': 'oklch(0.72 0.14 65)',
    '--accent-deep': 'oklch(0.55 0.17 55)',
    '--accent-soft': 'oklch(0.94 0.045 75)',
  },
  cool: {
    '--paper': '#eef1ea',
    '--paper-2': '#e3e8de',
    '--accent': 'oklch(0.62 0.11 190)',
    '--accent-deep': 'oklch(0.45 0.12 200)',
    '--accent-soft': 'oklch(0.94 0.035 190)',
  },
  rose: {
    '--paper': '#f4ece8',
    '--paper-2': '#ebe0d9',
    '--accent': 'oklch(0.65 0.15 15)',
    '--accent-deep': 'oklch(0.48 0.17 15)',
    '--accent-soft': 'oklch(0.94 0.04 15)',
  },
  ink: {
    '--paper': '#ece8df',
    '--paper-2': '#d9d4c6',
    '--accent': 'oklch(0.5 0.14 270)',
    '--accent-deep': 'oklch(0.35 0.15 275)',
    '--accent-soft': 'oklch(0.93 0.03 270)',
  },
}

export function applyPalette(name: PaletteName) {
  const p = PALETTES[name] ?? PALETTES.warm
  for (const [k, v] of Object.entries(p)) {
    document.documentElement.style.setProperty(k, v)
  }
}
