import { logger } from '../utils/logger.js';

/**
 * Content sanitizer to detect and redact sensitive information
 */
export class ContentSanitizer {
  private static readonly SENSITIVE_PATTERNS = [
    // API Keys and Tokens
    /(?:api[_-]?key|token|secret|password|pwd)\s*[:=]\s*['"`]?([a-zA-Z0-9_\-]{16,})['"`]?/gi,
    
    // Database URLs
    /(?:mongodb|mysql|postgres|redis):\/\/[^\s\n]+/gi,
    
    // AWS Keys
    /AKIA[0-9A-Z]{16}/gi,
    /(?:aws_access_key_id|aws_secret_access_key)\s*[:=]\s*['"`]?([a-zA-Z0-9\/\+]{20,})['"`]?/gi,
    
    // JWT Tokens
    /eyJ[a-zA-Z0-9_\-]*\.eyJ[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*/gi,
    
    // Private Keys
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
    
    // Email addresses (optional - might be too aggressive)
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    
    // Credit Card Numbers
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/gi,
    
    // Social Security Numbers
    /\b\d{3}-\d{2}-\d{4}\b/gi,
    
    // Phone Numbers
    /\b\d{3}-\d{3}-\d{4}\b/gi,
    
    // IP Addresses (private ranges only)
    /\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\b/gi,
    
    // Common secret environment variables
    /(?:SECRET|PRIVATE|CONFIDENTIAL|INTERNAL)_[A-Z_]+\s*[:=]\s*['"`]?([^\s'"`\n]+)['"`]?/gi
  ];

  private static readonly MALICIOUS_PATTERNS = [
    // Code injection patterns
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /setTimeout\s*\(\s*['"`][^'"`]*['"`]/gi,
    /setInterval\s*\(\s*['"`][^'"`]*['"`]/gi,
    
    // File system attacks
    /fs\.(unlink|rmdir|rm|delete)/gi,
    /child_process\.(exec|spawn|fork)/gi,
    /process\.exit/gi,
    
    // Network attacks
    /fetch\s*\(\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1)/gi,
    /XMLHttpRequest/gi,
    
    // Prototype pollution
    /__proto__/gi,
    /constructor\.prototype/gi,
    
    // SQL injection patterns
    /(?:union|select|insert|update|delete|drop|create|alter)\s+(?:all\s+)?(?:distinct\s+)?(?:from|into|table|database)/gi
  ];

  /**
   * Sanitize content by detecting and redacting sensitive information
   */
  static sanitizeContent(content: string, filePath: string): {
    sanitizedContent: string;
    sensitiveDataFound: boolean;
    maliciousPatterns: boolean;
    redactionCount: number;
  } {
    let sanitizedContent = content;
    let redactionCount = 0;
    let sensitiveDataFound = false;
    let maliciousPatterns = false;

    // Check for sensitive data patterns
    for (const pattern of this.SENSITIVE_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        sensitiveDataFound = true;
        redactionCount += matches.length;
        
        // Replace with redacted placeholder
        sanitizedContent = sanitizedContent.replace(pattern, (match) => {
          const type = this.getSensitiveDataType(match);
          logger.warn(`Sensitive data detected in ${filePath}: ${type}`);
          return `[REDACTED_${type.toUpperCase()}]`;
        });
      }
    }

    // Check for malicious patterns
    for (const pattern of this.MALICIOUS_PATTERNS) {
      if (pattern.test(content)) {
        maliciousPatterns = true;
        logger.warn(`Potentially malicious pattern detected in ${filePath}`);
        
        // Replace with warning placeholder
        sanitizedContent = sanitizedContent.replace(pattern, (match) => {
          return `[POTENTIALLY_MALICIOUS: ${match.substring(0, 20)}...]`;
        });
      }
    }

    return {
      sanitizedContent,
      sensitiveDataFound,
      maliciousPatterns,
      redactionCount
    };
  }

  /**
   * Determine the type of sensitive data detected
   */
  private static getSensitiveDataType(match: string): string {
    if (/api[_-]?key/i.test(match)) return 'api_key';
    if (/token/i.test(match)) return 'token';
    if (/password|pwd/i.test(match)) return 'password';
    if (/secret/i.test(match)) return 'secret';
    if (/AKIA[0-9A-Z]{16}/i.test(match)) return 'aws_key';
    if (/eyJ[a-zA-Z0-9_\-]*\./i.test(match)) return 'jwt_token';
    if (/-----BEGIN.*PRIVATE.*KEY-----/i.test(match)) return 'private_key';
    if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(match)) return 'email';
    if (/\d{3}-\d{2}-\d{4}/.test(match)) return 'ssn';
    if (/\d{3}-\d{3}-\d{4}/.test(match)) return 'phone';
    if (/(?:\d{4}[-\s]?){3}\d{4}/.test(match)) return 'credit_card';
    if (/mongodb|mysql|postgres|redis/.test(match)) return 'database_url';
    return 'sensitive_data';
  }

  /**
   * Check if file should be excluded from memory based on security rules
   */
  static shouldExcludeFile(filePath: string): boolean {
    const securityExclusions = [
      // Environment files
      /\.env(\.|$)/i,
      /\.env\.(local|development|production|test)$/i,
      
      // Key files
      /\.key$/i,
      /\.pem$/i,
      /\.p12$/i,
      /\.pfx$/i,
      
      // Config files with potential secrets
      /config\.(json|yaml|yml)$/i,
      /secrets\.(json|yaml|yml)$/i,
      /credentials\.(json|yaml|yml)$/i,
      
      // Database files
      /\.db$/i,
      /\.sqlite$/i,
      /\.sqlite3$/i,
      
      // Backup files
      /\.bak$/i,
      /\.backup$/i,
      
      // Log files (might contain sensitive data)
      /\.log$/i,
      
      // Certificate files
      /\.crt$/i,
      /\.cert$/i,
      /\.cer$/i,
      
      // SSH keys
      /id_rsa$/i,
      /id_dsa$/i,
      /id_ecdsa$/i,
      /id_ed25519$/i,
      
      // Docker secrets
      /docker-compose\.override\.(yml|yaml)$/i,
      
      // Kubernetes secrets
      /secret\.(yml|yaml)$/i
    ];

    return securityExclusions.some(pattern => pattern.test(filePath));
  }

  /**
   * Validate that content is safe to store and serve to AI agents
   */
  static validateContentSafety(content: string): {
    isSafe: boolean;
    risks: string[];
    recommendations: string[];
  } {
    const risks: string[] = [];
    const recommendations: string[] = [];

    // Check content length (prevent memory exhaustion)
    if (content.length > 1000000) { // 1MB limit
      risks.push('Content too large (>1MB)');
      recommendations.push('Consider excluding large files from memory');
    }

    // Check for binary content
    if (this.isBinaryContent(content)) {
      risks.push('Binary content detected');
      recommendations.push('Exclude binary files from memory');
    }

    // Check for excessive repetition (potential DoS)
    if (this.hasExcessiveRepetition(content)) {
      risks.push('Excessive repetition detected');
      recommendations.push('Content might be generated or malicious');
    }

    const isSafe = risks.length === 0;
    return { isSafe, risks, recommendations };
  }

  /**
   * Check if content appears to be binary
   */
  private static isBinaryContent(content: string): boolean {
    // Check for null bytes or high percentage of non-printable characters
    const nullBytes = (content.match(/\0/g) || []).length;
    const nonPrintable = (content.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g) || []).length;
    
    return nullBytes > 0 || (nonPrintable / content.length) > 0.3;
  }

  /**
   * Check for excessive repetition that might indicate generated content
   */
  private static hasExcessiveRepetition(content: string): boolean {
    // Check for repeated patterns
    const lines = content.split('\n');
    const uniqueLines = new Set(lines);
    
    // If less than 10% unique lines, it's suspicious
    return (uniqueLines.size / lines.length) < 0.1;
  }
}
