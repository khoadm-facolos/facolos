// Chart.js Font & Color defaults
Chart.defaults.font.family = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
Chart.defaults.color = '#5C6B66';
Chart.defaults.font.size = 12;

// Brand Color Palette Config
const BRAND = '#0E3D34';
const BRAND_DARK = '#071F1A';
const BRAND_SURFACE = '#123B2E';
const GOLD = '#C8A161';
const GOLD_BOLD = '#B8860B';
const GOLD_DARK = '#9E7B3B';
const LINE = '#DCD5C9';
const FAINT_GRID = 'rgba(14, 61, 52, 0.04)';
const INK = '#2F3A36';
const DOWN = '#A93C3C';

const PALETTE = [
  '#0E3D34', // Brand Green
  '#C8A161', // Gold
  '#2F3A36', // Slate Ink
  '#4A7265', // Muted Green
  '#A68144', // Dark Gold Accent
  '#123B2E', // Brand Forest
  '#E6E1D8', // Warm gray
  '#6E8E84', // Minty Sage
  '#B8860B', // Dark Goldenrod
  '#7A5C2E'  // Olive Gold
];

// Expose configs to window context
window.BRAND = BRAND;
window.BRAND_DARK = BRAND_DARK;
window.BRAND_SURFACE = BRAND_SURFACE;
window.GOLD = GOLD;
window.GOLD_BOLD = GOLD_BOLD;
window.GOLD_DARK = GOLD_DARK;
window.LINE = LINE;
window.FAINT_GRID = FAINT_GRID;
window.INK = INK;
window.DOWN = DOWN;
window.PALETTE = PALETTE;
