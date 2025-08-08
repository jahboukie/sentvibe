import { ContentSanitizer } from './content-sanitizer.js';
import { FileAccessControl } from './file-access-control.js';
import { DatabaseEncryption } from './database-encryption.js';
import { logger } from '../utils/logger.js';

/**
 * Central security manager that coordinates all security features
 */
export class SecurityManager {
  private fileAccessControl: FileAccessControl;
  private databaseEncryption: DatabaseEncryption;
  private securityConfig: SecurityConfig;

  constructor(projectRoot: string, config?: Partial<SecurityConfig>) {
    this.fileAccessControl = new FileAccessControl(projectRoot);
    this.databaseEncryption = new DatabaseEncryption(projectRoot);
    
    this.securityConfig = {
      enableContentSanitization: true,
      enableFileAccessControl: true,
      enableDatabaseEncryption: true,
      enableSensitiveDataDetection: true,
      enableMaliciousPatternDetection: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxMemoryEntries: 100000,
      encryptSensitiveContent: true,
      auditLogging: true,
      strictMode: false,
      ...config
    };
  }

  /**
   * Initialize all security components
   */
  async initialize(): Promise<void> {
    try {
      if (this.securityConfig.enableDatabaseEncryption) {
        await this.databaseEncryption.initialize();
      }

      // Validate project directory
      const validation = this.fileAccessControl.validateProjectDirectory(
        this.fileAccessControl.getConfiguration().projectRoot
      );

      if (!validation.isValid) {
        throw new Error(`Project validation failed: ${validation.reason}`);
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => logger.warn(warning));
      }

      logger.info('Security manager initialized successfully');
    } catch (error) {
      logger.error('Security manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Secure file processing pipeline
   */
  async processFile(filePath: string): Promise<SecureFileResult> {
    try {
      // Step 1: Validate file access
      const accessValidation = this.fileAccessControl.validateFilePath(filePath);
      if (!accessValidation.isValid) {
        return {
          success: false,
          reason: accessValidation.reason || 'File access denied',
          securityIssues: ['file_access_denied']
        };
      }

      // Step 2: Read file content
      const fs = await import('fs');
      const content = fs.readFileSync(accessValidation.sanitizedPath!, 'utf8');

      // Step 3: Validate content safety
      const safetyValidation = ContentSanitizer.validateContentSafety(content);
      if (!safetyValidation.isSafe) {
        return {
          success: false,
          reason: 'Content safety validation failed',
          securityIssues: safetyValidation.risks,
          recommendations: safetyValidation.recommendations
        };
      }

      // Step 4: Sanitize content
      const sanitizationResult = ContentSanitizer.sanitizeContent(content, filePath);
      
      // Step 5: Encrypt sensitive content if needed
      let finalContent = sanitizationResult.sanitizedContent;
      let isEncrypted = false;

      if (this.securityConfig.enableDatabaseEncryption && 
          (sanitizationResult.sensitiveDataFound || this.securityConfig.encryptSensitiveContent)) {
        finalContent = this.databaseEncryption.encryptData(finalContent);
        isEncrypted = true;
      }

      // Step 6: Audit logging
      if (this.securityConfig.auditLogging) {
        this.auditLog('file_processed', {
          filePath,
          sensitiveDataFound: sanitizationResult.sensitiveDataFound,
          maliciousPatterns: sanitizationResult.maliciousPatterns,
          redactionCount: sanitizationResult.redactionCount,
          isEncrypted
        });
      }

      return {
        success: true,
        content: finalContent,
        isEncrypted,
        sanitizationResult,
        securityMetadata: {
          processedAt: new Date().toISOString(),
          securityVersion: '1.0.0',
          sanitized: sanitizationResult.redactionCount > 0,
          encrypted: isEncrypted
        }
      };

    } catch (error) {
      logger.error(`File processing failed for ${filePath}:`, error);
      return {
        success: false,
        reason: 'File processing error',
        securityIssues: ['processing_error']
      };
    }
  }

  /**
   * Secure content retrieval (decrypt if needed)
   */
  async retrieveContent(storedContent: string, isEncrypted: boolean): Promise<string> {
    if (!isEncrypted) {
      return storedContent;
    }

    if (!this.securityConfig.enableDatabaseEncryption) {
      throw new Error('Content is encrypted but encryption is disabled');
    }

    return this.databaseEncryption.decryptData(storedContent);
  }

  /**
   * Validate memory entry before storage
   */
  validateMemoryEntry(entry: any): {
    isValid: boolean;
    sanitizedEntry?: any;
    securityIssues: string[];
  } {
    const issues: string[] = [];
    const sanitizedEntry = { ...entry };

    // Validate required fields
    if (!entry.intent || !entry.outcome) {
      issues.push('Missing required fields (intent, outcome)');
    }

    // Validate content length
    if (entry.codeSnippet && entry.codeSnippet.length > this.securityConfig.maxFileSize) {
      issues.push('Code snippet too large');
    }

    // Sanitize text fields
    if (entry.intent) {
      const sanitized = ContentSanitizer.sanitizeContent(entry.intent, 'memory_entry');
      sanitizedEntry.intent = sanitized.sanitizedContent;
      if (sanitized.sensitiveDataFound) {
        issues.push('Sensitive data in intent field');
      }
    }

    if (entry.outcome) {
      const sanitized = ContentSanitizer.sanitizeContent(entry.outcome, 'memory_entry');
      sanitizedEntry.outcome = sanitized.sanitizedContent;
      if (sanitized.sensitiveDataFound) {
        issues.push('Sensitive data in outcome field');
      }
    }

    // Validate file path if present
    if (entry.filePath) {
      const pathValidation = this.fileAccessControl.validateFilePath(entry.filePath);
      if (!pathValidation.isValid) {
        issues.push(`Invalid file path: ${pathValidation.reason}`);
      }
    }

    return {
      isValid: issues.length === 0 || !this.securityConfig.strictMode,
      sanitizedEntry: issues.length === 0 ? sanitizedEntry : undefined,
      securityIssues: issues
    };
  }

  /**
   * Get safe file watching patterns
   */
  getWatchPatterns(): string[] {
    return this.fileAccessControl.getWatchPatterns();
  }

  /**
   * Security audit logging
   */
  private auditLog(event: string, data: any): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      securityLevel: this.determineSecurityLevel(event, data)
    };

    logger.info('Security audit:', auditEntry);

    // In production, this could write to a separate audit log file
    // or send to a security monitoring system
  }

  /**
   * Determine security level for audit events
   */
  private determineSecurityLevel(_event: string, data: any): 'low' | 'medium' | 'high' | 'critical' {
    if (data.maliciousPatterns) return 'critical';
    if (data.sensitiveDataFound) return 'high';
    if (data.securityIssues && data.securityIssues.length > 0) return 'medium';
    return 'low';
  }

  /**
   * Get security status and metrics
   */
  getSecurityStatus(): SecurityStatus {
    const encryptionStatus = this.databaseEncryption.getStatus();
    const fileControlConfig = this.fileAccessControl.getConfiguration();

    return {
      isSecure: encryptionStatus.isInitialized,
      encryptionEnabled: this.securityConfig.enableDatabaseEncryption,
      contentSanitizationEnabled: this.securityConfig.enableContentSanitization,
      fileAccessControlEnabled: this.securityConfig.enableFileAccessControl,
      strictModeEnabled: this.securityConfig.strictMode,
      encryptionStatus,
      allowedExtensions: fileControlConfig.allowedExtensions,
      blockedPaths: fileControlConfig.blockedPaths,
      maxFileSize: fileControlConfig.maxFileSize,
      securityVersion: '1.0.0'
    };
  }

  /**
   * Update security configuration
   */
  updateConfiguration(newConfig: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...newConfig };
    logger.info('Security configuration updated');
  }

  /**
   * Cleanup security resources
   */
  async cleanup(): Promise<void> {
    if (this.securityConfig.enableDatabaseEncryption) {
      this.databaseEncryption.cleanup();
    }
    logger.info('Security manager cleanup completed');
  }

  /**
   * Run security self-test
   */
  async runSecuritySelfTest(): Promise<SecurityTestResult> {
    const results: SecurityTestResult = {
      passed: true,
      tests: [],
      issues: [],
      recommendations: []
    };

    // Test encryption
    if (this.securityConfig.enableDatabaseEncryption) {
      try {
        const testData = 'test-encryption-data';
        const encrypted = this.databaseEncryption.encryptData(testData);
        const decrypted = this.databaseEncryption.decryptData(encrypted);
        
        if (decrypted === testData) {
          results.tests.push({ name: 'encryption', passed: true });
        } else {
          results.tests.push({ name: 'encryption', passed: false, error: 'Decryption mismatch' });
          results.passed = false;
        }
      } catch (error) {
        results.tests.push({ name: 'encryption', passed: false, error: String(error) });
        results.passed = false;
      }
    }

    // Test content sanitization
    try {
      const testContent = 'const apiKey = "sk-1234567890abcdef"; console.log("test");';
      const sanitized = ContentSanitizer.sanitizeContent(testContent, 'test');
      
      if (sanitized.sensitiveDataFound && sanitized.sanitizedContent.includes('[REDACTED_')) {
        results.tests.push({ name: 'content_sanitization', passed: true });
      } else {
        results.tests.push({ name: 'content_sanitization', passed: false, error: 'Sanitization failed' });
        results.passed = false;
      }
    } catch (error) {
      results.tests.push({ name: 'content_sanitization', passed: false, error: String(error) });
      results.passed = false;
    }

    // Test file access control
    try {
      const validation = this.fileAccessControl.validateFilePath('../../../etc/passwd');
      if (!validation.isValid) {
        results.tests.push({ name: 'file_access_control', passed: true });
      } else {
        results.tests.push({ name: 'file_access_control', passed: false, error: 'Path traversal not blocked' });
        results.passed = false;
      }
    } catch (error) {
      results.tests.push({ name: 'file_access_control', passed: false, error: String(error) });
      results.passed = false;
    }

    return results;
  }
}

// Type definitions
interface SecurityConfig {
  enableContentSanitization: boolean;
  enableFileAccessControl: boolean;
  enableDatabaseEncryption: boolean;
  enableSensitiveDataDetection: boolean;
  enableMaliciousPatternDetection: boolean;
  maxFileSize: number;
  maxMemoryEntries: number;
  encryptSensitiveContent: boolean;
  auditLogging: boolean;
  strictMode: boolean;
}

interface SecureFileResult {
  success: boolean;
  content?: string;
  isEncrypted?: boolean;
  sanitizationResult?: any;
  securityMetadata?: any;
  reason?: string;
  securityIssues?: string[];
  recommendations?: string[];
}

interface SecurityStatus {
  isSecure: boolean;
  encryptionEnabled: boolean;
  contentSanitizationEnabled: boolean;
  fileAccessControlEnabled: boolean;
  strictModeEnabled: boolean;
  encryptionStatus: any;
  allowedExtensions: string[];
  blockedPaths: string[];
  maxFileSize: number;
  securityVersion: string;
}

interface SecurityTestResult {
  passed: boolean;
  tests: Array<{ name: string; passed: boolean; error?: string }>;
  issues: string[];
  recommendations: string[];
}

export type { SecurityConfig, SecureFileResult, SecurityStatus, SecurityTestResult };
