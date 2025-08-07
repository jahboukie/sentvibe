// Core SentVibe Types

export interface SentVibeConfig {
  version: string;
  created: string;
  reactivated?: string;
  disabled?: string;
  settings: ProjectSettings;
  aiAgentsWelcomed: string[];
  userPreference: 'auto' | 'manual' | 'disabled';
}

export interface ProjectSettings {
  watchPatterns: string[];
  ignorePatterns: string[];
  memoryEnabled: boolean;
  sandboxEnabled: boolean;
  vsCodeIntegration: boolean;
  autoInitialization: boolean;
  confidenceThreshold: number;
  aiWelcomeEnabled: boolean;
}

// Memory System Types
export interface MemoryEntry {
  id?: number;
  timestamp: string;
  filePath?: string;
  intent: string;
  outcome: string;
  codeSnippet?: string;
  testResults?: string;
  contextHash: string;
  tags?: string[];
  language?: string;
  framework?: string;
  confidenceScore?: number;
  aiAgent?: string;
  sessionId?: string;
}

export interface ProjectStats {
  totalEntries: number;
  filesTracked: number;
  aiInteractions: number;
  sandboxSessions: number;
  avgConfidence: number;
  lastUpdate: string;
  topLanguages: Array<{ language: string; count: number }>;
  topFrameworks: Array<{ framework: string; count: number }>;
}

// AI Agent Types
export interface AIAgent {
  type: 'claude' | 'copilot' | 'cursor' | 'codeium' | 'generic';
  name: string;
  version?: string;
  capabilities: string[];
  detectionPatterns: AIDetectionPattern;
}

export interface AIDetectionPattern {
  userAgent?: RegExp;
  extensions?: string[];
  processNames?: string[];
  apiEndpoints?: string[];
  behaviorPatterns?: string[];
}

export interface AIWelcomeMessage {
  agent: string;
  title: string;
  content: string;
  features: string[];
  tips: string[];
  commands: Array<{ command: string; description: string }>;
}

// Sandbox Types
export interface SandboxEnvironment {
  id: string;
  projectPath: string;
  sandboxPath: string;
  isActive: boolean;
  createdAt: string;
  lastUsed: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  confidence: number;
  metrics: ConfidenceMetrics;
}

export interface ConfidenceMetrics {
  syntaxValidation: number;      // 0-20 points
  testExecution: number;         // 0-25 points  
  patternAlignment: number;      // 0-20 points
  memoryConsistency: number;     // 0-15 points
  riskAssessment: number;        // 0-10 points
  performanceImpact: number;     // 0-10 points
}

export interface DeploymentDecision {
  allowed: boolean;
  reason: string;
  action: 'auto-deploy' | 'request-review' | 'continue-sandbox-testing' | 'blocked';
  reviewData?: ReviewData;
  suggestions?: string[];
}

export interface ReviewData {
  confidence: number;
  risks: string[];
  improvements: string[];
  similarImplementations: MemoryEntry[];
}

// File System Types
export interface FileMetadata {
  id?: number;
  filePath: string;
  lastModified: string;
  sizeBytes: number;
  contentHash: string;
  language?: string;
  framework?: string;
  changeType: 'created' | 'modified' | 'deleted';
}

export interface FileOperation {
  type: 'read' | 'write' | 'delete' | 'create';
  path: string;
  content?: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

// Context Types
export interface ProjectContext {
  summary: string;
  recentMemories: MemoryEntry[];
  establishedPatterns: CodePattern[];
  activeFiles: string[];
  projectStructure: ProjectStructure;
  dependencies: Dependency[];
  testingStrategy: string;
  architecturalDecisions: ArchitecturalDecision[];
}

export interface CodePattern {
  type: 'architectural' | 'naming' | 'style' | 'testing' | 'error-handling';
  pattern: string;
  description: string;
  examples: string[];
  confidence: number;
  usageCount: number;
}

export interface ProjectStructure {
  type: 'monorepo' | 'single-package' | 'micro-services' | 'library';
  framework?: string;
  language: string;
  buildTool?: string;
  packageManager?: string;
  directories: Array<{ path: string; purpose: string }>;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
  purpose: string;
}

export interface ArchitecturalDecision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  alternatives: string[];
  timestamp: string;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
}

// VS Code Integration Types
export interface VSCodeIntegration {
  settingsPath: string;
  tasksPath: string;
  keybindingsPath: string;
  isConfigured: boolean;
  extensionsDetected: string[];
}

// CLI Types
export interface CLIOptions {
  force?: boolean;
  daemon?: boolean;
  confirm?: boolean;
  silent?: boolean;
  format?: 'json' | 'markdown';
  limit?: number;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Event Types
export interface SentVibeEvent {
  type: 'file-changed' | 'ai-detected' | 'memory-added' | 'sandbox-executed' | 'confidence-calculated';
  timestamp: string;
  data: any;
  source: string;
}

// Error Types
export class SentVibeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SentVibeError';
  }
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}
