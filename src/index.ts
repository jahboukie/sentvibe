// SentVibe - Universal AI Memory and Sandbox
// Main library exports for programmatic usage

import { join } from 'path';

export * from './types/index.js';

// Core classes
export { ProjectMemory } from './memory/project-memory.js';
export { SandboxManager } from './sandbox/sandbox-manager.js';
export { AIDetector } from './ai/detector.js';
export { AutoInitializer } from './ai/auto-initializer.js';

// Security classes
export { SecurityManager } from './security/security-manager.js';
export { ContentSanitizer } from './security/content-sanitizer.js';
export { FileAccessControl } from './security/file-access-control.js';
export { DatabaseEncryption } from './security/database-encryption.js';
export { SecurityTestSuite } from './security/security-test-suite.js';

// Utilities
export { createLogger } from './utils/logger.js';
export { colors } from './utils/colors.js';
export { spinner } from './utils/spinner.js';

// Configuration
export { loadConfig, saveConfig, getDefaultConfig } from './utils/config.js';

// Constants
export const SENTVIBE_VERSION = '2.0.0';
export const SENTVIBE_DIR = '.sentvibe';
export const CONFIDENCE_THRESHOLD = 95;

// Main SentVibe class for programmatic usage
export class SentVibe {
  private projectPath: string;
  private memory?: any; // ProjectMemory - loaded dynamically
  private sandbox?: any; // SandboxManager - loaded dynamically
  private detector?: any; // AIDetector - loaded dynamically

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  async initialize(): Promise<void> {
    const { ProjectMemory } = await import('./memory/project-memory.js');
    const { SandboxManager } = await import('./sandbox/sandbox-manager.js');
    const { AIDetector } = await import('./ai/detector.js');

    this.memory = new ProjectMemory(join(this.projectPath, '.sentvibe', 'memory.db'));
    this.sandbox = new SandboxManager(this.projectPath);
    this.detector = new AIDetector();

    await this.memory.initialize();
    await this.sandbox.initialize();
  }

  async getMemory(): Promise<any> {
    if (!this.memory) {
      throw new Error('SentVibe not initialized - call initialize() first');
    }
    return this.memory;
  }

  async getSandbox(): Promise<any> {
    if (!this.sandbox) {
      throw new Error('SentVibe not initialized - call initialize() first');
    }
    return this.sandbox;
  }

  async getDetector(): Promise<any> {
    if (!this.detector) {
      throw new Error('SentVibe not initialized - call initialize() first');
    }
    return this.detector;
  }

  async cleanup(): Promise<void> {
    if (this.memory) {
      await this.memory.cleanup();
    }
    if (this.sandbox) {
      await this.sandbox.cleanup();
    }
  }
}
