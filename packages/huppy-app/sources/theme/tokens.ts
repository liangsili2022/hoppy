// Huppy Design Tokens
export const colors = {
    // Primary — neon orange
    primary: '#FF9A3C',
    primaryDark: '#FF6B1A',
    primaryGradient: ['#FF9A3C', '#FF6B1A'] as const,

    // Backgrounds
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceElevated: '#252525',
    border: '#2A2A2A',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#888888',
    textTertiary: '#555555',

    // Status
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',

    // AI brand colors
    claude: '#CC785C',
    gemini: '#4285F4',
    codex: '#412991',
} as const

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const

export const radius = {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    full: 9999,
} as const

export const typography = {
    fontFamily: {
        regular: 'System',
        medium: 'System',
        bold: 'System',
    },
    fontSize: {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 17,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },
} as const
