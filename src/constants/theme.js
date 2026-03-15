// CorrectiveRehabApp — Industrial Biomechanics Theme
// Dark, precise, athletic. Performance tool, not wellness app.

export const COLORS = {
  // Core palette
  primary: '#00E5CC',        // Electric cyan — precision, technology, biomechanics
  primaryDim: '#00B8A3',     // Dimmed primary for subtle accents
  primaryGlow: 'rgba(0, 229, 204, 0.15)', // Glow effect background

  secondary: '#1A1E2E',      // Deep navy-charcoal — card surfaces

  accent: '#FF6B35',         // Hot orange — warnings, asymmetry alerts
  accentGlow: 'rgba(255, 107, 53, 0.15)',

  success: '#00D68F',        // Sharp green — improvements, good form
  successGlow: 'rgba(0, 214, 143, 0.12)',

  danger: '#FF4757',         // Red — critical alerts
  dangerGlow: 'rgba(255, 71, 87, 0.12)',

  // Backgrounds
  background: '#0D0F1A',     // Near-black with blue undertone
  surface: '#141729',        // Slightly lighter cards/surfaces
  surfaceLight: '#1C2039',   // Elevated surface (modals, active cards)

  // Borders
  border: '#2A2F45',         // Subtle borders
  borderLight: '#363C58',    // Active/hover borders

  // Text
  text: '#EAEDF3',           // Primary text — off-white
  textSecondary: '#8B92A8',  // Secondary/muted text
  textTertiary: '#565E78',   // Disabled/hint text

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Consistent border radius scale
export const RADIUS = {
  s: 6,
  m: 12,
  l: 16,
  xl: 20,
  full: 999,
};

// Shadow presets for dark theme (glow effect)
export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: (color = COLORS.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  }),
};
