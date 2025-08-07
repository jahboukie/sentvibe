import { existsSync } from 'fs';
import { join } from 'path';
import { AIDetector } from './detector.js';
import { init } from '../commands/init.js';
import {
  getProjectState,
  loadConfig,
  updateConfig
} from '../utils/config.js';
import { logger } from '../utils/logger.js';

export class AutoInitializer {
  private detector: AIDetector;
  private initialized = new Set<string>();
  private isWatching = false;

  constructor() {
    this.detector = new AIDetector();
  }

  async startAutoInitialization(): Promise<void> {
    if (this.isWatching) return;

    try {
      this.isWatching = true;
      
      // Check current project immediately
      await this.checkAndInitializeProject(process.cwd());

      // Set up periodic checks for new projects
      this.startPeriodicChecks();

      logger.debug('Auto-initialization started');
    } catch (error) {
      logger.error('Failed to start auto-initialization:', error);
      this.isWatching = false;
    }
  }

  private startPeriodicChecks(): void {
    // Check every 30 seconds for workspace changes
    setInterval(async () => {
      try {
        await this.checkAndInitializeProject(process.cwd());
      } catch (error) {
        logger.debug('Periodic check failed:', error);
      }
    }, 30000);
  }

  async checkAndInitializeProject(projectPath: string): Promise<boolean> {
    try {
      // Skip if already processed
      if (this.initialized.has(projectPath)) {
        return false;
      }

      // Check if this looks like a development project
      if (!this.isValidProject(projectPath)) {
        return false;
      }

      const state = getProjectState(projectPath);

      // Skip if user explicitly disabled
      if (state === 'disabled') {
        this.initialized.add(projectPath);
        return false;
      }

      // Skip if already active
      if (state === 'active') {
        this.initialized.add(projectPath);
        await this.checkForAIAgents(projectPath);
        return false;
      }

      // Auto-initialize
      await this.performAutoInitialization(projectPath);
      this.initialized.add(projectPath);

      return true;
    } catch (error) {
      logger.error('Project check failed:', error);
      return false;
    }
  }

  private isValidProject(projectPath: string): boolean {
    // Check for common project indicators
    const projectIndicators = [
      'package.json',
      'requirements.txt',
      'Cargo.toml',
      'go.mod',
      'pom.xml',
      'Gemfile',
      'composer.json',
      '.csproj',
      '.sln',
      'pyproject.toml',
      'setup.py',
      '.git'
    ];

    return projectIndicators.some(indicator => 
      existsSync(join(projectPath, indicator))
    );
  }

  private async performAutoInitialization(projectPath: string): Promise<void> {
    try {
      logger.info(`Auto-initializing SentVibe for: ${projectPath}`);

      // Initialize silently
      const originalCwd = process.cwd();
      process.chdir(projectPath);

      try {
        await init({ silent: true, force: false });
        
        // Check for AI agents and show welcome if found
        setTimeout(async () => {
          await this.checkForAIAgents(projectPath);
        }, 2000); // Delay to allow initialization to complete

      } finally {
        process.chdir(originalCwd);
      }

      logger.info(`SentVibe auto-initialized for: ${projectPath}`);
    } catch (error) {
      logger.error('Auto-initialization failed:', error);
      throw error;
    }
  }

  private async checkForAIAgents(projectPath: string): Promise<void> {
    try {
      const activeAgents = await this.detector.detectActiveAgents();
      
      if (activeAgents.length === 0) {
        return;
      }

      const config = loadConfig(projectPath);
      if (!config) {
        return;
      }

      // Show welcome messages for new agents
      const newAgents = activeAgents.filter(agent => 
        !config.aiAgentsWelcomed.includes(agent)
      );

      if (newAgents.length > 0) {
        await this.showWelcomeMessages(newAgents, projectPath);
        
        // Update config to mark agents as welcomed
        const updatedWelcomed = [...config.aiAgentsWelcomed, ...newAgents];
        updateConfig({ aiAgentsWelcomed: updatedWelcomed }, projectPath);
      }
    } catch (error) {
      logger.error('AI agent check failed:', error);
    }
  }

  private async showWelcomeMessages(agents: string[], projectPath: string): Promise<void> {
    try {
      for (const agent of agents) {
        await this.showWelcomeMessage(agent, projectPath);
      }
    } catch (error) {
      logger.error('Failed to show welcome messages:', error);
    }
  }

  private async showWelcomeMessage(agentType: string, projectPath: string): Promise<void> {
    try {
      const welcomeMessage = this.detector.getWelcomeMessage(agentType);
      
      // Create a welcome file in the project root
      const welcomeFilePath = join(projectPath, `.sentvibe-welcome-${agentType}.md`);
      
      const fs = await import('fs/promises');
      await fs.writeFile(welcomeFilePath, welcomeMessage, 'utf8');

      // Also log to console if in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🎉 ${agentType.toUpperCase()} DETECTED! Welcome message created at: ${welcomeFilePath}\n`);
      }

      // Auto-delete welcome file after 24 hours
      setTimeout(async () => {
        try {
          if (existsSync(welcomeFilePath)) {
            await fs.unlink(welcomeFilePath);
          }
        } catch (error) {
          logger.debug('Failed to cleanup welcome file:', error);
        }
      }, 24 * 60 * 60 * 1000); // 24 hours

      logger.info(`Welcome message shown for ${agentType}`);
    } catch (error) {
      logger.error('Failed to show welcome message:', error);
    }
  }

  async forceInitialization(projectPath: string): Promise<boolean> {
    try {
      // Remove from initialized set to force re-check
      this.initialized.delete(projectPath);
      
      return await this.checkAndInitializeProject(projectPath);
    } catch (error) {
      logger.error('Forced initialization failed:', error);
      return false;
    }
  }

  async detectWorkspaceChange(): Promise<void> {
    try {
      const currentPath = process.cwd();
      
      // Check if this is a new workspace
      if (!this.initialized.has(currentPath)) {
        await this.checkAndInitializeProject(currentPath);
      }
    } catch (error) {
      logger.error('Workspace change detection failed:', error);
    }
  }

  isProjectInitialized(projectPath: string): boolean {
    return this.initialized.has(projectPath);
  }

  getInitializedProjects(): string[] {
    return Array.from(this.initialized);
  }

  async cleanup(): Promise<void> {
    try {
      this.isWatching = false;
      this.initialized.clear();
      logger.debug('AutoInitializer cleanup completed');
    } catch (error) {
      logger.error('AutoInitializer cleanup failed:', error);
    }
  }

  // Static method for one-time initialization check
  static async checkProject(projectPath: string = process.cwd()): Promise<boolean> {
    const initializer = new AutoInitializer();
    return await initializer.checkAndInitializeProject(projectPath);
  }

  // Static method to start global auto-initialization
  static async startGlobal(): Promise<AutoInitializer> {
    const initializer = new AutoInitializer();
    await initializer.startAutoInitialization();
    return initializer;
  }
}
