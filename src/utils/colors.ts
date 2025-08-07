import pc from 'picocolors';

// Re-export picocolors with SentVibe-specific color scheme
export const colors = {
  // Basic colors
  black: pc.black,
  red: pc.red,
  green: pc.green,
  yellow: pc.yellow,
  blue: pc.blue,
  magenta: pc.magenta,
  cyan: pc.cyan,
  white: pc.white,
  gray: pc.gray,

  // Background colors
  bgBlack: pc.bgBlack,
  bgRed: pc.bgRed,
  bgGreen: pc.bgGreen,
  bgYellow: pc.bgYellow,
  bgBlue: pc.bgBlue,
  bgMagenta: pc.bgMagenta,
  bgCyan: pc.bgCyan,
  bgWhite: pc.bgWhite,

  // Text styles
  bold: pc.bold,
  dim: pc.dim,
  italic: pc.italic,
  underline: pc.underline,
  strikethrough: pc.strikethrough,
  inverse: pc.inverse,

  // SentVibe-specific semantic colors
  success: pc.green,
  error: pc.red,
  warning: pc.yellow,
  info: pc.cyan,
  debug: pc.gray,
  
  // SentVibe brand colors
  primary: pc.cyan,      // Main brand color
  secondary: pc.blue,    // Secondary brand color
  accent: pc.magenta,    // Accent color for highlights
  
  // Status colors
  active: pc.green,
  inactive: pc.gray,
  pending: pc.yellow,
  
  // AI-specific colors
  ai: pc.magenta,        // AI agent related
  memory: pc.blue,       // Memory related
  sandbox: pc.yellow,    // Sandbox related
  confidence: pc.green,  // Confidence scoring
  
  // File operation colors
  created: pc.green,
  modified: pc.yellow,
  deleted: pc.red,
  
  // Special formatters
  highlight: (text: string) => pc.bgCyan(pc.black(text)),
  badge: (text: string) => pc.bgBlue(pc.white(` ${text} `)),
  code: (text: string) => pc.inverse(` ${text} `),
  
  // Progress indicators
  spinner: pc.cyan,
  progress: pc.blue,
  
  // Confidence level colors
  confidenceHigh: pc.green,     // 95%+
  confidenceMedium: pc.yellow,  // 70-94%
  confidenceLow: pc.red,        // <70%
};

// Utility functions for common formatting patterns
export const formatters = {
  // Format confidence score with appropriate color
  confidence: (score: number): string => {
    const color = score >= 95 
      ? colors.confidenceHigh 
      : score >= 70 
        ? colors.confidenceMedium 
        : colors.confidenceLow;
    return color(`${score}%`);
  },
  
  // Format file path with appropriate styling
  filePath: (path: string): string => colors.underline(colors.blue(path)),
  
  // Format timestamp
  timestamp: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return colors.gray(d.toLocaleString());
  },
  
  // Format AI agent name
  aiAgent: (name: string): string => colors.badge(colors.ai(name.toUpperCase())),
  
  // Format memory count
  memoryCount: (count: number): string => colors.badge(colors.memory(`${count} memories`)),
  
  // Format command
  command: (cmd: string): string => colors.code(cmd),
  
  // Format success message
  success: (message: string): string => `${colors.success('✅')} ${message}`,
  
  // Format error message
  error: (message: string): string => `${colors.error('❌')} ${message}`,
  
  // Format warning message
  warning: (message: string): string => `${colors.warning('⚠️')} ${message}`,
  
  // Format info message
  info: (message: string): string => `${colors.info('ℹ️')} ${message}`,
  
  // Format section header
  header: (title: string): string => colors.bold(colors.primary(title)),
  
  // Format subsection
  subheader: (title: string): string => colors.bold(colors.secondary(title)),
  
  // Format list item
  listItem: (text: string): string => `${colors.primary('•')} ${text}`,
  
  // Format key-value pair
  keyValue: (key: string, value: string): string => 
    `${colors.bold(key)}: ${colors.dim(value)}`,
};

export default colors;
