import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { SentVibeConfig, ProjectSettings } from '../types/index.js';
import { logger } from './logger.js';

export const SENTVIBE_DIR = '.sentvibe';
export const CONFIG_FILE = 'config.json';
export const DISABLED_DIR = '.sentvibe.disabled';

export function getDefaultConfig(): SentVibeConfig {
  return {
    version: '2.0.0',
    created: new Date().toISOString(),
    settings: getDefaultSettings(),
    aiAgentsWelcomed: [],
    userPreference: 'auto',
  };
}

export function getDefaultSettings(): ProjectSettings {
  return {
    watchPatterns: [
      '**/*.{js,ts,jsx,tsx,vue,svelte}',
      '**/*.{py,rb,go,rs,java,kt,scala}',
      '**/*.{php,cs,cpp,c,h,hpp}',
      '**/*.{md,mdx,txt,json,yaml,yml}',
      '**/*.{css,scss,sass,less,styl}',
      '**/*.{html,htm,xml,svg}',
    ],
    ignorePatterns: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '.sentvibe/**',
      '.sentvibe.disabled/**',
      '**/*.log',
      '**/coverage/**',
      '**/.nyc_output/**',
      '**/tmp/**',
      '**/temp/**',
    ],
    memoryEnabled: true,
    sandboxEnabled: true,
    vsCodeIntegration: true,
    autoInitialization: true,
    confidenceThreshold: 95,
    aiWelcomeEnabled: true,
  };
}

export function getConfigPath(projectPath: string = process.cwd()): string {
  return join(projectPath, SENTVIBE_DIR, CONFIG_FILE);
}

export function getDisabledConfigPath(projectPath: string = process.cwd()): string {
  return join(projectPath, DISABLED_DIR, CONFIG_FILE);
}

export function getSentVibeDir(projectPath: string = process.cwd()): string {
  return join(projectPath, SENTVIBE_DIR);
}

export function getDisabledDir(projectPath: string = process.cwd()): string {
  return join(projectPath, DISABLED_DIR);
}

export function isInitialized(projectPath: string = process.cwd()): boolean {
  return existsSync(getConfigPath(projectPath));
}

export function isDisabled(projectPath: string = process.cwd()): boolean {
  return existsSync(getDisabledConfigPath(projectPath));
}

export function getProjectState(projectPath: string = process.cwd()): 'active' | 'disabled' | 'never-initialized' {
  if (isInitialized(projectPath)) {
    return 'active';
  }
  if (isDisabled(projectPath)) {
    return 'disabled';
  }
  return 'never-initialized';
}

export function loadConfig(projectPath: string = process.cwd()): SentVibeConfig | null {
  const configPath = getConfigPath(projectPath);
  
  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const configData = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData) as SentVibeConfig;
    
    // Validate and merge with defaults for missing properties
    return {
      ...getDefaultConfig(),
      ...config,
      settings: {
        ...getDefaultSettings(),
        ...config.settings,
      },
    };
  } catch (error) {
    logger.error('Failed to load config:', error);
    return null;
  }
}

export function saveConfig(config: SentVibeConfig, projectPath: string = process.cwd()): boolean {
  const configPath = getConfigPath(projectPath);
  const configDir = dirname(configPath);

  try {
    // Ensure directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Write config with pretty formatting
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    logger.error('Failed to save config:', error);
    return false;
  }
}

export function updateConfig(
  updates: Partial<SentVibeConfig>,
  projectPath: string = process.cwd()
): boolean {
  const currentConfig = loadConfig(projectPath);
  if (!currentConfig) {
    logger.error('No config found to update');
    return false;
  }

  const updatedConfig: SentVibeConfig = {
    ...currentConfig,
    ...updates,
    settings: {
      ...currentConfig.settings,
      ...(updates.settings || {}),
    },
  };

  return saveConfig(updatedConfig, projectPath);
}

export function createInitialConfig(projectPath: string = process.cwd()): SentVibeConfig {
  const config = getDefaultConfig();
  
  // Detect project type and adjust settings
  const projectType = detectProjectType(projectPath);
  if (projectType) {
    config.settings = adjustSettingsForProjectType(config.settings, projectType);
  }

  return config;
}

function detectProjectType(projectPath: string): string | null {
  const indicators = [
    { file: 'package.json', type: 'node' },
    { file: 'requirements.txt', type: 'python' },
    { file: 'Cargo.toml', type: 'rust' },
    { file: 'go.mod', type: 'go' },
    { file: 'pom.xml', type: 'java' },
    { file: 'Gemfile', type: 'ruby' },
    { file: 'composer.json', type: 'php' },
    { file: '.csproj', type: 'dotnet' },
  ];

  for (const indicator of indicators) {
    if (existsSync(join(projectPath, indicator.file))) {
      return indicator.type;
    }
  }

  return null;
}

function adjustSettingsForProjectType(
  settings: ProjectSettings,
  projectType: string
): ProjectSettings {
  const adjustments: Record<string, Partial<ProjectSettings>> = {
    node: {
      ignorePatterns: [
        ...settings.ignorePatterns,
        'node_modules/**',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*',
        '.npm',
        '.yarn',
      ],
    },
    python: {
      ignorePatterns: [
        ...settings.ignorePatterns,
        '__pycache__/**',
        '*.pyc',
        '*.pyo',
        '*.pyd',
        '.Python',
        'env/**',
        'venv/**',
        '.venv/**',
        'pip-log.txt',
        'pip-delete-this-directory.txt',
      ],
    },
    rust: {
      ignorePatterns: [
        ...settings.ignorePatterns,
        'target/**',
        'Cargo.lock',
      ],
    },
    go: {
      ignorePatterns: [
        ...settings.ignorePatterns,
        'vendor/**',
        '*.exe',
        '*.exe~',
        '*.dll',
        '*.so',
        '*.dylib',
      ],
    },
    java: {
      ignorePatterns: [
        ...settings.ignorePatterns,
        'target/**',
        '*.class',
        '*.jar',
        '*.war',
        '*.ear',
        'hs_err_pid*',
      ],
    },
  };

  return {
    ...settings,
    ...(adjustments[projectType] || {}),
  };
}

export function validateConfig(config: SentVibeConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.version) {
    errors.push('Missing version');
  }

  if (!config.created) {
    errors.push('Missing created timestamp');
  }

  if (!config.settings) {
    errors.push('Missing settings');
  } else {
    if (!Array.isArray(config.settings.watchPatterns)) {
      errors.push('watchPatterns must be an array');
    }

    if (!Array.isArray(config.settings.ignorePatterns)) {
      errors.push('ignorePatterns must be an array');
    }

    if (typeof config.settings.confidenceThreshold !== 'number' ||
        config.settings.confidenceThreshold < 0 ||
        config.settings.confidenceThreshold > 100) {
      errors.push('confidenceThreshold must be a number between 0 and 100');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
