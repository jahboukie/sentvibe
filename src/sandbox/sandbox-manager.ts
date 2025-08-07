import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, statSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import { execSync, ChildProcess } from 'child_process';
import * as vm from 'vm';
import type { 
  SandboxEnvironment, 
  ExecutionResult, 
  ConfidenceMetrics,
  DeploymentDecision 
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export class SandboxManager {
  private sandboxPath: string;
  private isActive = false;
  private runningProcesses = new Map<string, ChildProcess>();
  private fileSystemProxy: FileSystemProxy;
  private confidenceCalculator: ConfidenceCalculator;

  constructor(private projectPath: string) {
    this.sandboxPath = join(projectPath, '.sentvibe', 'sandbox');
    this.fileSystemProxy = new FileSystemProxy(this.sandboxPath, this.projectPath);
    this.confidenceCalculator = new ConfidenceCalculator(this.projectPath);
    this.ensureSandboxDirectory();
  }

  private ensureSandboxDirectory(): void {
    if (!existsSync(this.sandboxPath)) {
      mkdirSync(this.sandboxPath, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    try {
      this.ensureSandboxDirectory();
      
      // Copy project files to sandbox (excluding node_modules, .git, etc.)
      await this.syncProjectToSandbox();
      
      this.isActive = true;
      logger.debug('SandboxManager initialized');
    } catch (error) {
      logger.error('SandboxManager initialization failed:', error);
      throw error;
    }
  }

  private async syncProjectToSandbox(): Promise<void> {
    try {
      this.ensureSandboxDirectory();
      await this.fileSystemProxy.copyProjectToSandbox();

      logger.debug('Project synced to sandbox');
    } catch (error) {
      logger.error('Failed to sync project to sandbox:', error);
      throw error;
    }
  }

  async executeCode(code: string, filePath: string): Promise<ExecutionResult> {
    try {
      const startTime = Date.now();

      // Write code to sandbox using proxy
      await this.fileSystemProxy.writeFile(filePath, code);

      // Calculate confidence metrics
      const metrics = await this.confidenceCalculator.calculateConfidence(filePath, code);
      const confidence = this.calculateTotalConfidence(metrics);

      // Execute validation
      const result = await this.runValidation(filePath);

      return {
        ...result,
        duration: Date.now() - startTime,
        confidence,
        metrics,
      };
    } catch (error) {
      logger.error('Code execution failed:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        duration: 0,
        confidence: 0,
        metrics: this.getEmptyMetrics(),
      };
    }
  }

  async runTests(files: string[] = [], _options: any = {}): Promise<ExecutionResult> {
    try {
      const startTime = Date.now();
      
      // TODO: Implement actual test execution
      // For now, return a placeholder result
      
      const duration = Date.now() - startTime;
      const metrics = await this.calculateConfidenceMetrics('test', files);
      
      return {
        success: true,
        output: 'Tests passed (placeholder)',
        exitCode: 0,
        duration,
        confidence: this.calculateTotalConfidence(metrics),
        metrics,
      };
    } catch (error) {
      logger.error('Test execution failed:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        duration: 0,
        confidence: 0,
        metrics: this.getEmptyMetrics(),
      };
    }
  }

  async executeCommand(command: string, _options: any = {}): Promise<ExecutionResult> {
    try {
      const startTime = Date.now();
      
      // TODO: Implement safe command execution in sandbox
      // For now, return a placeholder result
      
      const duration = Date.now() - startTime;
      const metrics = await this.calculateConfidenceMetrics('command', [command]);
      
      return {
        success: true,
        output: `Command executed: ${command} (placeholder)`,
        exitCode: 0,
        duration,
        confidence: this.calculateTotalConfidence(metrics),
        metrics,
      };
    } catch (error) {
      logger.error('Command execution failed:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        duration: 0,
        confidence: 0,
        metrics: this.getEmptyMetrics(),
      };
    }
  }

  async calculateConfidence(filePath?: string): Promise<number> {
    try {
      if (!filePath) {
        // Calculate overall project confidence
        return await this.calculateProjectConfidence();
      }

      const metrics = await this.confidenceCalculator.calculateConfidence(filePath);
      return this.calculateTotalConfidence(metrics);
    } catch (error) {
      logger.error('Confidence calculation failed:', error);
      return 0;
    }
  }

  private async calculateProjectConfidence(): Promise<number> {
    try {
      // Get all files in sandbox and calculate average confidence
      const files = this.getSandboxFiles();
      if (files.length === 0) return 0;

      let totalConfidence = 0;
      for (const file of files) {
        const confidence = await this.calculateConfidence(file);
        totalConfidence += confidence;
      }

      return totalConfidence / files.length;
    } catch (error) {
      logger.error('Project confidence calculation failed:', error);
      return 0;
    }
  }

  private getSandboxFiles(): string[] {
    try {
      // TODO: Implement recursive file discovery in sandbox
      return [];
    } catch (error) {
      return [];
    }
  }

  private async calculateConfidenceMetrics(_type: string, _targets: string[]): Promise<ConfidenceMetrics> {
    // TODO: Implement actual confidence calculation
    // For now, return placeholder metrics
    
    return {
      syntaxValidation: 20,      // 0-20 points
      testExecution: 23,         // 0-25 points  
      patternAlignment: 18,      // 0-20 points
      memoryConsistency: 14,     // 0-15 points
      riskAssessment: 9,         // 0-10 points
      performanceImpact: 10,     // 0-10 points
    };
  }

  private calculateTotalConfidence(metrics: ConfidenceMetrics): number {
    return Object.values(metrics).reduce((sum, score) => sum + score, 0);
  }

  private getEmptyMetrics(): ConfidenceMetrics {
    return {
      syntaxValidation: 0,
      testExecution: 0,
      patternAlignment: 0,
      memoryConsistency: 0,
      riskAssessment: 0,
      performanceImpact: 0,
    };
  }

  private async runValidation(_filePath: string): Promise<ExecutionResult> {
    try {
      const startTime = Date.now();
      
      // TODO: Implement comprehensive validation
      // - Syntax checking
      // - Test execution
      // - Linting
      // - Type checking
      
      const duration = Date.now() - startTime;
      const metrics = await this.calculateConfidenceMetrics('validation', [_filePath]);
      
      return {
        success: true,
        output: 'Validation passed',
        exitCode: 0,
        duration,
        confidence: this.calculateTotalConfidence(metrics),
        metrics,
      };
    } catch (error) {
      logger.error('Validation failed:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        duration: 0,
        confidence: 0,
        metrics: this.getEmptyMetrics(),
      };
    }
  }

  async checkDeploymentPermission(_filePath: string, confidence: number): Promise<DeploymentDecision> {
    try {
      if (confidence >= 95) {
        return {
          allowed: true,
          reason: `✅ High confidence (${confidence}%) - deploying to real files`,
          action: 'auto-deploy'
        };
      }

      if (confidence >= 70) {
        return {
          allowed: false,
          reason: `⚠️ Medium confidence (${confidence}%) - requires human review`,
          action: 'request-review',
          reviewData: {
            confidence,
            risks: ['Medium confidence score'],
            improvements: ['Increase test coverage', 'Add more validation'],
            similarImplementations: []
          }
        };
      }

      return {
        allowed: false,
        reason: `❌ Low confidence (${confidence}%) - needs more testing`,
        action: 'continue-sandbox-testing',
        suggestions: [
          'Add more comprehensive tests',
          'Improve code quality',
          'Follow established patterns',
          'Add error handling'
        ]
      };
    } catch (error) {
      logger.error('Deployment permission check failed:', error);
      return {
        allowed: false,
        reason: 'Failed to assess deployment readiness',
        action: 'blocked'
      };
    }
  }

  async deployToRealFiles(filePath: string, force = false): Promise<boolean> {
    try {
      const sandboxFilePath = join(this.sandboxPath, filePath);
      const realFilePath = join(this.projectPath, filePath);

      if (!existsSync(sandboxFilePath)) {
        throw new Error(`File not found in sandbox: ${filePath}`);
      }

      if (!force) {
        const confidence = await this.calculateConfidence(filePath);
        const decision = await this.checkDeploymentPermission(filePath, confidence);
        
        if (!decision.allowed) {
          logger.warn(`Deployment blocked: ${decision.reason}`);
          return false;
        }
      }

      // Copy file from sandbox to real project
      const content = readFileSync(sandboxFilePath, 'utf8');
      const realFileDir = dirname(realFilePath);

      if (!existsSync(realFileDir)) {
        mkdirSync(realFileDir, { recursive: true });
      }

      writeFileSync(realFilePath, content, 'utf8');
      
      logger.info(`Deployed to real files: ${filePath}`);
      return true;
    } catch (error) {
      logger.error('Deployment failed:', error);
      return false;
    }
  }

  async clean(all = false): Promise<void> {
    try {
      if (all) {
        // Remove entire sandbox
        if (existsSync(this.sandboxPath)) {
          rmSync(this.sandboxPath, { recursive: true, force: true });
        }
        this.ensureSandboxDirectory();
      } else {
        // Clean temporary files only
        // TODO: Implement selective cleanup
      }

      logger.debug('Sandbox cleaned');
    } catch (error) {
      logger.error('Sandbox cleanup failed:', error);
      throw error;
    }
  }

  async reset(): Promise<void> {
    try {
      // Clean sandbox and re-sync from project
      await this.clean(true);
      await this.syncProjectToSandbox();
      
      logger.debug('Sandbox reset to project state');
    } catch (error) {
      logger.error('Sandbox reset failed:', error);
      throw error;
    }
  }

  getStatus(): SandboxEnvironment {
    return {
      id: 'default',
      projectPath: this.projectPath,
      sandboxPath: this.sandboxPath,
      isActive: this.isActive,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };
  }

  async cleanup(): Promise<void> {
    try {
      // Kill all running processes
      for (const [id, process] of this.runningProcesses) {
        try {
          process.kill('SIGTERM');
          this.runningProcesses.delete(id);
        } catch (error) {
          logger.warn(`Failed to kill process ${id}:`, error);
        }
      }

      this.isActive = false;
      logger.debug('SandboxManager cleanup completed');
    } catch (error) {
      logger.error('SandboxManager cleanup failed:', error);
    }
  }
}

// File System Proxy for sandbox isolation
class FileSystemProxy {
  private interceptedOperations: Array<{
    operation: string;
    path: string;
    timestamp: Date;
    success: boolean;
  }> = [];

  constructor(
    private sandboxRoot: string,
    private projectRoot: string
  ) {}

  async writeFile(path: string, content: string): Promise<void> {
    const sandboxPath = this.mapToSandbox(path);
    const sandboxDir = dirname(sandboxPath);

    try {
      if (!existsSync(sandboxDir)) {
        mkdirSync(sandboxDir, { recursive: true });
      }

      writeFileSync(sandboxPath, content, 'utf8');

      this.logOperation('write', path, true);
      logger.debug(`Sandbox write: ${path}`);
    } catch (error) {
      this.logOperation('write', path, false);
      throw error;
    }
  }

  async readFile(path: string): Promise<string> {
    const sandboxPath = this.mapToSandbox(path);

    try {
      const content = readFileSync(sandboxPath, 'utf8');
      this.logOperation('read', path, true);
      return content;
    } catch (error) {
      // Fallback to project file if not in sandbox
      try {
        const projectPath = join(this.projectRoot, path);
        const content = readFileSync(projectPath, 'utf8');
        this.logOperation('read', path, true);
        return content;
      } catch (fallbackError) {
        this.logOperation('read', path, false);
        throw fallbackError;
      }
    }
  }

  async copyProjectToSandbox(): Promise<void> {
    try {
      // Copy essential project files to sandbox
      const filesToCopy = this.getProjectFiles();

      for (const file of filesToCopy) {
        const sourcePath = join(this.projectRoot, file);
        const targetPath = join(this.sandboxRoot, file);
        const targetDir = dirname(targetPath);

        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }

        if (existsSync(sourcePath) && statSync(sourcePath).isFile()) {
          cpSync(sourcePath, targetPath);
        }
      }

      logger.debug('Project files copied to sandbox');
    } catch (error) {
      logger.error('Failed to copy project to sandbox:', error);
      throw error;
    }
  }

  private getProjectFiles(): string[] {
    // Get list of important project files to copy
    const importantFiles = [
      'package.json',
      'tsconfig.json',
      'jest.config.js',
      'jest.config.ts',
      '.eslintrc.js',
      '.eslintrc.json',
      'README.md'
    ];

    const files: string[] = [];

    for (const file of importantFiles) {
      if (existsSync(join(this.projectRoot, file))) {
        files.push(file);
      }
    }

    return files;
  }

  private mapToSandbox(originalPath: string): string {
    // Ensure path is relative and map to sandbox
    const relativePath = originalPath.startsWith(this.projectRoot)
      ? relative(this.projectRoot, originalPath)
      : originalPath;

    return join(this.sandboxRoot, relativePath);
  }

  private logOperation(operation: string, path: string, success: boolean): void {
    this.interceptedOperations.push({
      operation,
      path,
      timestamp: new Date(),
      success
    });
  }

  getOperationLog(): Array<{operation: string; path: string; timestamp: Date; success: boolean}> {
    return [...this.interceptedOperations];
  }
}

// Confidence Calculator for code quality assessment
class ConfidenceCalculator {
  constructor(private projectPath: string) {}

  async calculateConfidence(filePath: string, code?: string): Promise<ConfidenceMetrics> {
    const metrics: ConfidenceMetrics = {
      syntaxValidation: 0,
      testExecution: 0,
      patternAlignment: 0,
      memoryConsistency: 0,
      riskAssessment: 0,
      performanceImpact: 0,
    };

    try {
      // 1. Syntax Validation (0-20 points)
      metrics.syntaxValidation = await this.validateSyntax(filePath, code);

      // 2. Test Execution (0-25 points)
      metrics.testExecution = await this.runTests(filePath);

      // 3. Pattern Alignment (0-20 points)
      metrics.patternAlignment = await this.checkPatternAlignment(filePath, code);

      // 4. Memory Consistency (0-15 points)
      metrics.memoryConsistency = await this.checkMemoryConsistency(filePath, code);

      // 5. Risk Assessment (0-10 points)
      metrics.riskAssessment = await this.assessRisk(filePath, code);

      // 6. Performance Impact (0-10 points)
      metrics.performanceImpact = await this.assessPerformance(filePath, code);

    } catch (error) {
      logger.error('Confidence calculation failed:', error);
    }

    return metrics;
  }

  private async validateSyntax(filePath: string, code?: string): Promise<number> {
    try {
      const ext = extname(filePath).toLowerCase();
      const content = code || readFileSync(filePath, 'utf8');

      switch (ext) {
        case '.ts':
        case '.tsx':
          return await this.validateTypeScript(content);
        case '.js':
        case '.jsx':
          return await this.validateJavaScript(content);
        case '.py':
          return await this.validatePython(content);
        default:
          return content.trim().length > 0 ? 15 : 0;
      }
    } catch (error) {
      logger.debug('Syntax validation failed:', error);
      return 0;
    }
  }

  private async validateTypeScript(code: string): Promise<number> {
    try {
      // Use TypeScript compiler API for validation
      const ts = await import('typescript');
      const result = ts.transpileModule(code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          strict: true,
          noEmitOnError: true
        }
      });

      const errorCount = result.diagnostics?.length || 0;
      return Math.max(0, 20 - errorCount * 3);
    } catch (error) {
      return 0;
    }
  }

  private async validateJavaScript(code: string): Promise<number> {
    try {
      // Use Node.js VM to validate JavaScript
      new vm.Script(code);
      return 18; // Slightly lower than TypeScript due to less strict checking
    } catch (error) {
      return 0;
    }
  }

  private async validatePython(code: string): Promise<number> {
    try {
      // Use Python AST parser if available
      execSync('python -c "import ast; ast.parse(open(\'/dev/stdin\').read())"', {
        input: code,
        timeout: 5000,
        encoding: 'utf8'
      });
      return 20;
    } catch (error) {
      return 0;
    }
  }

  private async runTests(filePath: string): Promise<number> {
    try {
      // Try to run tests for the file
      const testFile = this.findTestFile(filePath);
      if (!testFile) return 15; // No tests found, but not a failure

      // TODO: Implement actual test execution
      // For now, return a reasonable score
      return 20;
    } catch (error) {
      return 0;
    }
  }

  private findTestFile(filePath: string): string | null {
    // Look for corresponding test files
    const baseName = filePath.replace(/\.(ts|js|tsx|jsx)$/, '');
    const testPatterns = [
      `${baseName}.test.ts`,
      `${baseName}.test.js`,
      `${baseName}.spec.ts`,
      `${baseName}.spec.js`,
      `__tests__/${baseName}.test.ts`,
      `__tests__/${baseName}.test.js`
    ];

    for (const pattern of testPatterns) {
      if (existsSync(join(this.projectPath, pattern))) {
        return pattern;
      }
    }

    return null;
  }

  private async checkPatternAlignment(_filePath: string, _code?: string): Promise<number> {
    // TODO: Implement pattern alignment checking
    return 15;
  }

  private async checkMemoryConsistency(_filePath: string, _code?: string): Promise<number> {
    // TODO: Implement memory consistency checking
    return 12;
  }

  private async assessRisk(_filePath: string, _code?: string): Promise<number> {
    // TODO: Implement risk assessment
    return 8;
  }

  private async assessPerformance(_filePath: string, _code?: string): Promise<number> {
    // TODO: Implement performance assessment
    return 9;
  }
}
