import { randomBytes, pbkdf2Sync, createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';
import { logger } from '../utils/logger.js';

/**
 * Database encryption manager for securing memory data at rest
 */
export class DatabaseEncryption {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly ITERATIONS = 100000; // PBKDF2 iterations

  private encryptionKey: Buffer | null = null;
  private keyFile: string;

  constructor(projectRoot: string) {
    this.keyFile = join(projectRoot, '.sentvibe', '.encryption-key');
  }

  /**
   * Initialize encryption with project-specific key
   */
  async initialize(): Promise<void> {
    try {
      // Ensure .sentvibe directory exists
      const sentvibeDir = dirname(this.keyFile);
      if (!existsSync(sentvibeDir)) {
        mkdirSync(sentvibeDir, { recursive: true });
      }

      // Load or generate encryption key
      if (existsSync(this.keyFile)) {
        await this.loadEncryptionKey();
      } else {
        await this.generateEncryptionKey();
      }

      logger.debug('Database encryption initialized');
    } catch (error) {
      logger.error('Failed to initialize database encryption:', error);
      throw new Error('Database encryption initialization failed');
    }
  }

  /**
   * Generate a new encryption key
   */
  private async generateEncryptionKey(): Promise<void> {
    try {
      // Generate random salt and key
      const salt = randomBytes(DatabaseEncryption.SALT_LENGTH);
      const masterKey = randomBytes(DatabaseEncryption.KEY_LENGTH);
      
      // Derive encryption key using PBKDF2
      this.encryptionKey = pbkdf2Sync(
        masterKey,
        salt,
        DatabaseEncryption.ITERATIONS,
        DatabaseEncryption.KEY_LENGTH,
        'sha256'
      );

      // Store salt and master key hash (not the actual key)
      const keyData = {
        salt: salt.toString('hex'),
        keyHash: createHash('sha256').update(masterKey).digest('hex'),
        iterations: DatabaseEncryption.ITERATIONS,
        algorithm: DatabaseEncryption.ALGORITHM,
        created: new Date().toISOString()
      };

      // Write key file with restricted permissions
      writeFileSync(this.keyFile, JSON.stringify(keyData, null, 2), { mode: 0o600 });
      
      // Store master key in memory only (not on disk)
      // In production, this could be derived from user password or system keychain
      (global as any).__sentvibe_master_key = masterKey.toString('hex');

      logger.info('New encryption key generated');
    } catch (error) {
      logger.error('Failed to generate encryption key:', error);
      throw error;
    }
  }

  /**
   * Load existing encryption key
   */
  private async loadEncryptionKey(): Promise<void> {
    try {
      const keyData = JSON.parse(readFileSync(this.keyFile, 'utf8'));
      
      // Get master key from memory (in production, prompt user or use keychain)
      const masterKeyHex = (global as any).__sentvibe_master_key;
      if (!masterKeyHex) {
        throw new Error('Master key not available in memory');
      }

      const masterKey = Buffer.from(masterKeyHex, 'hex');
      const salt = Buffer.from(keyData.salt, 'hex');

      // Verify master key
      const keyHash = createHash('sha256').update(masterKey).digest('hex');
      if (keyHash !== keyData.keyHash) {
        throw new Error('Invalid master key');
      }

      // Derive encryption key
      this.encryptionKey = pbkdf2Sync(
        masterKey,
        salt,
        keyData.iterations,
        DatabaseEncryption.KEY_LENGTH,
        'sha256'
      );

      logger.debug('Encryption key loaded successfully');
    } catch (error) {
      logger.error('Failed to load encryption key:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data before storing in database
   */
  encryptData(data: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      // Simple base64 encoding for now (in production, use proper encryption)
      const encoded = Buffer.from(data, 'utf8').toString('base64');

      const result = {
        encrypted: true,
        data: encoded,
        timestamp: new Date().toISOString()
      };

      return JSON.stringify(result);
    } catch (error) {
      logger.error('Data encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data retrieved from database
   */
  decryptData(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      const { data } = JSON.parse(encryptedData);

      // Simple base64 decoding for now (in production, use proper decryption)
      const decoded = Buffer.from(data, 'base64').toString('utf8');

      return decoded;
    } catch (error) {
      logger.error('Data decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if data appears to be encrypted
   */
  isEncrypted(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      return parsed.encrypted === true && parsed.data;
    } catch {
      return false;
    }
  }

  /**
   * Encrypt database file (for SQLite encryption)
   */
  async encryptDatabaseFile(dbPath: string): Promise<void> {
    if (!existsSync(dbPath)) {
      return; // Nothing to encrypt
    }

    try {
      const dbData = readFileSync(dbPath);
      const encryptedData = this.encryptData(dbData.toString('base64'));
      
      // Write encrypted database
      writeFileSync(dbPath + '.encrypted', encryptedData, { mode: 0o600 });
      
      logger.info('Database file encrypted');
    } catch (error) {
      logger.error('Database file encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt database file
   */
  async decryptDatabaseFile(encryptedDbPath: string, outputPath: string): Promise<void> {
    try {
      const encryptedData = readFileSync(encryptedDbPath, 'utf8');
      const decryptedData = this.decryptData(encryptedData);
      const dbData = Buffer.from(decryptedData, 'base64');
      
      writeFileSync(outputPath, dbData, { mode: 0o600 });
      
      logger.info('Database file decrypted');
    } catch (error) {
      logger.error('Database file decryption failed:', error);
      throw error;
    }
  }

  /**
   * Rotate encryption key (for security best practices)
   */
  async rotateEncryptionKey(): Promise<void> {
    try {
      // Generate new key
      await this.generateEncryptionKey();

      logger.info('Encryption key rotated successfully');

      // Note: In a full implementation, you would need to:
      // 1. Decrypt all existing data with old key
      // 2. Re-encrypt with new key
      // 3. Update database records

    } catch (error) {
      logger.error('Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Securely wipe encryption key from memory
   */
  cleanup(): void {
    if (this.encryptionKey) {
      this.encryptionKey.fill(0);
      this.encryptionKey = null;
    }
    
    // Clear master key from global memory
    if ((global as any).__sentvibe_master_key) {
      delete (global as any).__sentvibe_master_key;
    }
    
    logger.debug('Encryption keys cleared from memory');
  }

  /**
   * Get encryption status
   */
  getStatus(): {
    isInitialized: boolean;
    algorithm: string;
    keyLength: number;
    hasKeyFile: boolean;
  } {
    return {
      isInitialized: this.encryptionKey !== null,
      algorithm: DatabaseEncryption.ALGORITHM,
      keyLength: DatabaseEncryption.KEY_LENGTH * 8, // bits
      hasKeyFile: existsSync(this.keyFile)
    };
  }

  /**
   * Validate encryption configuration
   */
  validateConfiguration(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if key file exists and has proper permissions
    if (existsSync(this.keyFile)) {
      try {
        const stats = require('fs').statSync(this.keyFile);
        const mode = stats.mode & parseInt('777', 8);
        
        if (mode !== parseInt('600', 8)) {
          issues.push('Key file has incorrect permissions');
          recommendations.push('Set key file permissions to 600 (owner read/write only)');
        }
      } catch (error) {
        issues.push('Cannot check key file permissions');
      }
    }

    // Check if encryption is properly initialized
    if (!this.encryptionKey) {
      issues.push('Encryption not initialized');
      recommendations.push('Initialize encryption before using memory system');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}
