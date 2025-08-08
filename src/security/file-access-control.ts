import { resolve, relative, join } from 'path';
import { existsSync, statSync } from 'fs';
import { logger } from '../utils/logger.js';

/**
 * File access control to prevent directory traversal and unauthorized file access
 */
export class FileAccessControl {
  private projectRoot: string;
  private allowedExtensions: Set<string>;
  private blockedPaths: Set<string>;
  private maxFileSize: number;

  constructor(projectRoot: string) {
    this.projectRoot = resolve(projectRoot);
    this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
    
    // Allowed file extensions for memory storage
    this.allowedExtensions = new Set([
      '.js', '.ts', '.jsx', '.tsx',
      '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp',
      '.md', '.txt', '.json', '.yaml', '.yml',
      '.html', '.css', '.scss', '.sass', '.less',
      '.php', '.rb', '.swift', '.kt', '.dart',
      '.sql', '.graphql', '.proto',
      '.sh', '.bash', '.zsh', '.fish',
      '.dockerfile', '.gitignore', '.gitattributes'
    ]);

    // Blocked paths (relative to project root)
    this.blockedPaths = new Set([
      'node_modules',
      '.git',
      '.svn',
      '.hg',
      'dist',
      'build',
      'out',
      'target',
      'bin',
      'obj',
      '.next',
      '.nuxt',
      'coverage',
      '.nyc_output',
      'tmp',
      'temp',
      '.cache',
      '.vscode/settings.json', // May contain sensitive settings
      '.idea',
      'logs',
      '*.log',
      '.env*',
      'secrets',
      'credentials',
      'keys',
      '*.key',
      '*.pem',
      '*.p12',
      '*.pfx',
      '*.crt',
      '*.cert',
      '*.cer',
      'id_rsa*',
      'id_dsa*',
      'id_ecdsa*',
      'id_ed25519*'
    ]);
  }

  /**
   * Validate that a file path is safe to access
   */
  validateFilePath(filePath: string): {
    isValid: boolean;
    reason?: string;
    sanitizedPath?: string;
  } {
    try {
      // Resolve the absolute path
      const absolutePath = resolve(filePath);
      const relativePath = relative(this.projectRoot, absolutePath);

      // Check for directory traversal
      if (relativePath.startsWith('..') || absolutePath.includes('..')) {
        return {
          isValid: false,
          reason: 'Directory traversal detected'
        };
      }

      // Ensure file is within project root
      if (!absolutePath.startsWith(this.projectRoot)) {
        return {
          isValid: false,
          reason: 'File outside project root'
        };
      }

      // Check if path is blocked
      if (this.isPathBlocked(relativePath)) {
        return {
          isValid: false,
          reason: 'Path is in blocked list'
        };
      }

      // Check file extension
      const extension = this.getFileExtension(absolutePath);
      if (!this.allowedExtensions.has(extension)) {
        return {
          isValid: false,
          reason: `File extension '${extension}' not allowed`
        };
      }

      // Check if file exists and is readable
      if (!existsSync(absolutePath)) {
        return {
          isValid: false,
          reason: 'File does not exist'
        };
      }

      // Check file size
      const stats = statSync(absolutePath);
      if (stats.size > this.maxFileSize) {
        return {
          isValid: false,
          reason: `File too large (${stats.size} bytes > ${this.maxFileSize} bytes)`
        };
      }

      // Check if it's actually a file (not directory, symlink, etc.)
      if (!stats.isFile()) {
        return {
          isValid: false,
          reason: 'Path is not a regular file'
        };
      }

      return {
        isValid: true,
        sanitizedPath: absolutePath
      };

    } catch (error) {
      logger.error('File path validation error:', error);
      return {
        isValid: false,
        reason: 'File path validation failed'
      };
    }
  }

  /**
   * Check if a path is in the blocked list
   */
  private isPathBlocked(relativePath: string): boolean {
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    for (const blockedPath of this.blockedPaths) {
      // Exact match
      if (normalizedPath === blockedPath) {
        return true;
      }
      
      // Directory match (path starts with blocked directory)
      if (normalizedPath.startsWith(blockedPath + '/')) {
        return true;
      }
      
      // Wildcard match
      if (blockedPath.includes('*')) {
        const regex = new RegExp('^' + blockedPath.replace(/\*/g, '.*') + '$');
        if (regex.test(normalizedPath)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get file extension in lowercase
   */
  private getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filePath.substring(lastDot).toLowerCase();
  }

  /**
   * Get safe file watching patterns
   */
  getWatchPatterns(): string[] {
    const extensions = Array.from(this.allowedExtensions);
    return [
      `**/*{${extensions.join(',')}}`,
      '!node_modules/**',
      '!.git/**',
      '!dist/**',
      '!build/**',
      '!coverage/**',
      '!tmp/**',
      '!temp/**',
      '!.cache/**',
      '!logs/**',
      '!*.log',
      '!.env*',
      '!secrets/**',
      '!credentials/**',
      '!keys/**',
      '!*.key',
      '!*.pem',
      '!*.p12',
      '!*.pfx',
      '!*.crt',
      '!*.cert',
      '!*.cer',
      '!id_rsa*',
      '!id_dsa*',
      '!id_ecdsa*',
      '!id_ed25519*'
    ];
  }

  /**
   * Validate directory for initialization
   */
  validateProjectDirectory(projectPath: string): {
    isValid: boolean;
    reason?: string;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    try {
      const absolutePath = resolve(projectPath);
      
      // Check if directory exists
      if (!existsSync(absolutePath)) {
        return {
          isValid: false,
          reason: 'Project directory does not exist',
          warnings
        };
      }

      // Check if it's a directory
      const stats = statSync(absolutePath);
      if (!stats.isDirectory()) {
        return {
          isValid: false,
          reason: 'Path is not a directory',
          warnings
        };
      }

      // Check for common project indicators
      const projectIndicators = [
        'package.json',
        'requirements.txt',
        'Cargo.toml',
        'go.mod',
        'pom.xml',
        'build.gradle',
        'composer.json',
        'Gemfile',
        'setup.py',
        'pyproject.toml'
      ];

      const hasProjectFile = projectIndicators.some(file => 
        existsSync(join(absolutePath, file))
      );

      if (!hasProjectFile) {
        warnings.push('No common project files detected (package.json, requirements.txt, etc.)');
      }

      // Check for sensitive files in root
      const sensitiveFiles = [
        '.env',
        '.env.local',
        'secrets.json',
        'credentials.json',
        'id_rsa',
        'id_dsa'
      ];

      const foundSensitiveFiles = sensitiveFiles.filter(file =>
        existsSync(join(absolutePath, file))
      );

      if (foundSensitiveFiles.length > 0) {
        warnings.push(`Sensitive files detected: ${foundSensitiveFiles.join(', ')} (will be excluded from memory)`);
      }

      return {
        isValid: true,
        warnings
      };

    } catch (error) {
      logger.error('Project directory validation error:', error);
      return {
        isValid: false,
        reason: 'Directory validation failed',
        warnings
      };
    }
  }

  /**
   * Add custom blocked path
   */
  addBlockedPath(path: string): void {
    this.blockedPaths.add(path);
  }

  /**
   * Remove blocked path
   */
  removeBlockedPath(path: string): void {
    this.blockedPaths.delete(path);
  }

  /**
   * Add allowed file extension
   */
  addAllowedExtension(extension: string): void {
    this.allowedExtensions.add(extension.toLowerCase());
  }

  /**
   * Remove allowed file extension
   */
  removeAllowedExtension(extension: string): void {
    this.allowedExtensions.delete(extension.toLowerCase());
  }

  /**
   * Get current configuration
   */
  getConfiguration(): {
    projectRoot: string;
    allowedExtensions: string[];
    blockedPaths: string[];
    maxFileSize: number;
  } {
    return {
      projectRoot: this.projectRoot,
      allowedExtensions: Array.from(this.allowedExtensions),
      blockedPaths: Array.from(this.blockedPaths),
      maxFileSize: this.maxFileSize
    };
  }
}
