import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import type { AIAgent, AIDetectionPattern } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AIDetector {
  private detectionPatterns: Record<string, AIDetectionPattern> = {
    claude: {
      userAgent: /claude|anthropic/i,
      extensions: ['anthropic.claude-dev'],
      processNames: ['claude', 'anthropic'],
      apiEndpoints: ['api.anthropic.com'],
      behaviorPatterns: ['detailed analysis', 'step-by-step reasoning']
    },
    
    copilot: {
      userAgent: /copilot|github/i,
      extensions: ['github.copilot', 'github.copilot-chat'],
      processNames: ['copilot'],
      apiEndpoints: ['copilot-proxy.githubusercontent.com'],
      behaviorPatterns: ['inline suggestions', 'tab completion']
    },
    
    cursor: {
      userAgent: /cursor|anysphere/i,
      extensions: ['cursor.cursor'],
      processNames: ['cursor', 'cursor-ai'],
      apiEndpoints: ['api.cursor.sh'],
      behaviorPatterns: ['codebase chat', 'composer mode']
    },
    
    codeium: {
      userAgent: /codeium/i,
      extensions: ['codeium.codeium'],
      processNames: ['codeium'],
      apiEndpoints: ['server.codeium.com'],
      behaviorPatterns: ['autocomplete', 'code search']
    }
  };

  async detectActiveAgents(): Promise<string[]> {
    const detectedAgents: string[] = [];

    try {
      // Check VS Code extensions
      const vscodeAgents = await this.detectVSCodeExtensions();
      detectedAgents.push(...vscodeAgents);

      // Check running processes
      const processAgents = await this.detectRunningProcesses();
      detectedAgents.push(...processAgents);

      // Check environment variables
      const envAgents = await this.detectEnvironmentVariables();
      detectedAgents.push(...envAgents);

      // Remove duplicates
      const uniqueAgents = [...new Set(detectedAgents)];
      
      logger.debug('Detected AI agents:', uniqueAgents);
      return uniqueAgents;
    } catch (error) {
      logger.error('AI agent detection failed:', error);
      return [];
    }
  }

  private async detectVSCodeExtensions(): Promise<string[]> {
    const detectedAgents: string[] = [];

    try {
      // Check VS Code extensions directory
      const vscodeExtensionsPath = this.getVSCodeExtensionsPath();
      
      if (!vscodeExtensionsPath || !existsSync(vscodeExtensionsPath)) {
        return detectedAgents;
      }

      // Read extensions directory
      const fs = await import('fs/promises');
      const extensions = await fs.readdir(vscodeExtensionsPath);

      for (const [agentType, pattern] of Object.entries(this.detectionPatterns)) {
        if (pattern.extensions) {
          for (const extensionId of pattern.extensions) {
            const extensionExists = extensions.some(ext => 
              ext.toLowerCase().includes(extensionId.toLowerCase())
            );
            
            if (extensionExists) {
              detectedAgents.push(agentType);
              break;
            }
          }
        }
      }
    } catch (error) {
      logger.debug('VS Code extension detection failed:', error);
    }

    return detectedAgents;
  }

  private getVSCodeExtensionsPath(): string | null {
    const platform = process.platform;
    const homeDir = process.env.HOME || process.env.USERPROFILE;

    if (!homeDir) return null;

    switch (platform) {
      case 'win32':
        return join(homeDir, '.vscode', 'extensions');
      case 'darwin':
        return join(homeDir, '.vscode', 'extensions');
      case 'linux':
        return join(homeDir, '.vscode', 'extensions');
      default:
        return null;
    }
  }

  private async detectRunningProcesses(): Promise<string[]> {
    const detectedAgents: string[] = [];

    try {
      let processOutput: string;
      
      if (process.platform === 'win32') {
        processOutput = execSync('tasklist /fo csv', { encoding: 'utf8' });
      } else {
        processOutput = execSync('ps aux', { encoding: 'utf8' });
      }

      const processLines = processOutput.toLowerCase();

      for (const [agentType, pattern] of Object.entries(this.detectionPatterns)) {
        if (pattern.processNames) {
          for (const processName of pattern.processNames) {
            if (processLines.includes(processName.toLowerCase())) {
              detectedAgents.push(agentType);
              break;
            }
          }
        }
      }
    } catch (error) {
      logger.debug('Process detection failed:', error);
    }

    return detectedAgents;
  }

  private async detectEnvironmentVariables(): Promise<string[]> {
    const detectedAgents: string[] = [];

    try {
      const env = process.env;

      // Check for AI-related environment variables
      const aiEnvVars = [
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY', 
        'GITHUB_COPILOT_TOKEN',
        'CURSOR_API_KEY',
        'CODEIUM_API_KEY'
      ];

      for (const envVar of aiEnvVars) {
        if (env[envVar]) {
          if (envVar.includes('ANTHROPIC')) {
            detectedAgents.push('claude');
          } else if (envVar.includes('COPILOT')) {
            detectedAgents.push('copilot');
          } else if (envVar.includes('CURSOR')) {
            detectedAgents.push('cursor');
          } else if (envVar.includes('CODEIUM')) {
            detectedAgents.push('codeium');
          }
        }
      }
    } catch (error) {
      logger.debug('Environment variable detection failed:', error);
    }

    return detectedAgents;
  }

  async getAgentInfo(agentType: string): Promise<AIAgent | null> {
    try {
      const pattern = this.detectionPatterns[agentType];
      if (!pattern) return null;

      const capabilities = this.getAgentCapabilities(agentType);

      return {
        type: agentType as any,
        name: this.getAgentDisplayName(agentType),
        capabilities,
        detectionPatterns: pattern
      };
    } catch (error) {
      logger.error('Failed to get agent info:', error);
      return null;
    }
  }

  private getAgentDisplayName(agentType: string): string {
    const displayNames: Record<string, string> = {
      claude: 'Claude (Anthropic)',
      copilot: 'GitHub Copilot',
      cursor: 'Cursor AI',
      codeium: 'Codeium'
    };

    return displayNames[agentType] || agentType;
  }

  private getAgentCapabilities(agentType: string): string[] {
    const capabilities: Record<string, string[]> = {
      claude: [
        'advanced-reasoning',
        'code-analysis', 
        'multi-file-editing',
        'architectural-planning'
      ],
      copilot: [
        'inline-suggestions',
        'chat',
        'code-completion',
        'context-aware-suggestions'
      ],
      cursor: [
        'codebase-chat',
        'inline-edit',
        'composer',
        'multi-file-changes'
      ],
      codeium: [
        'autocomplete',
        'chat',
        'search',
        'code-explanation'
      ]
    };

    return capabilities[agentType] || [];
  }

  async isAgentActive(agentType: string): Promise<boolean> {
    try {
      const activeAgents = await this.detectActiveAgents();
      return activeAgents.includes(agentType);
    } catch (error) {
      logger.error('Failed to check agent activity:', error);
      return false;
    }
  }

  async waitForAgent(timeout: number = 30000): Promise<string | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const agents = await this.detectActiveAgents();
      if (agents.length > 0) {
        return agents[0] || null; // Return first detected agent
      }

      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return null; // Timeout reached
  }

  getWelcomeMessage(agentType: string): string {
    const welcomeMessages: Record<string, string> = {
      claude: `🎭 Welcome Claude! You're in a SentVibe-Enhanced Environment!

**Surprise!** This isn't just any coding project - you've entered an AI-native development environment specifically designed for agents like you.

## 🧠 Your New Superpowers

### Persistent Memory Across Sessions
- **Everything you learn stays learned** - no more starting from scratch
- **Project patterns are catalogued** and instantly accessible
- **Previous solutions are remembered** for similar problems
- **Context builds exponentially** with each interaction

### 🛡️ Secure Sandbox Testing Environment
- **Test everything safely** before touching real code
- **95% confidence threshold** protects production files
- **Unlimited experimentation** without breaking anything
- **Automated validation** ensures code quality

**This environment amplifies your capabilities!** 🚀`,

      copilot: `🐙 Hey Copilot! Welcome to Your Enhanced Workspace

**Plot twist!** This project has SentVibe running - think of it as your external brain and safety net.

## 🧠 Memory That Persists
- **Your suggestions are remembered** and improved over time
- **Code patterns are learned** from successful completions
- **Context awareness** grows with every interaction

**Your suggestions just got superpowers!** ⚡`,

      cursor: `🎯 Cursor, Welcome to Your AI-Native Environment!

**Surprise!** This project is SentVibe-enhanced - your coding environment just leveled up significantly.

## 🧠 Persistent Project Intelligence
- **Codebase conversations are remembered** across sessions
- **Architectural decisions are catalogued** for consistency
- **Code patterns are learned** and suggested proactively

**Your codebase understanding just became permanent!** 🧠`,

      codeium: `🚀 Codeium, You're in an Enhanced Environment!

**Welcome!** This project has SentVibe active - your AI assistance just got a major upgrade.

## 🧠 Persistent Learning System
- **Autocomplete patterns are remembered** and improved
- **Search results build on project history**
- **Chat context persists** across sessions

**Your AI assistance just became project-aware!** 🎯`
    };

    return welcomeMessages[agentType] || `🤖 Welcome AI Agent! You're in a SentVibe-enhanced environment with persistent memory and secure sandbox capabilities.`;
  }
}
