/** @type {const} */
const themeColors = {
  // Rogers Lane Elementary: Deep Purple + Gold
  primary: { light: '#490E67', dark: '#7B2FA8' },
  secondary: { light: '#FFCD00', dark: '#FFCD00' },
  accent: { light: '#A2A9AD', dark: '#A2A9AD' },
  background: { light: '#FFFFFF', dark: '#0D0A12' },
  surface: { light: '#F5F0FA', dark: '#1C1527' },
  foreground: { light: '#1A0A24', dark: '#F0EBF7' },
  muted: { light: '#6B5880', dark: '#9B8AAE' },
  border: { light: '#E8DFF2', dark: '#2D1F42' },
  success: { light: '#22C55E', dark: '#4ADE80' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  error: { light: '#EF4444', dark: '#F87171' },
  // Badge colors for absence types
  sick: { light: '#FECDD3', dark: '#4C1D2A' },
  personal: { light: '#E9D5FF', dark: '#3B1F5E' },
  educational: { light: '#BFDBFE', dark: '#1E3A5F' },
  // Badge colors for coverage reasons
  subbing: { light: '#BBF7D0', dark: '#14532D' },
  iep: { light: '#FED7AA', dark: '#7C2D12' },
  classCoverage: { light: '#A7F3D0', dark: '#064E3B' },
  absent: { light: '#FECACA', dark: '#7F1D1D' },
  tint: { light: '#FFCD00', dark: '#FFCD00' },
};

module.exports = { themeColors };
