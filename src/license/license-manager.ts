import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import machineIdPkg from 'node-machine-id';
const { machineId } = machineIdPkg;
import { Polar } from '@polar-sh/sdk';
import { logger } from '../utils/logger.js';
import { colors, formatters } from '../utils/colors.js';

// Polar.sh Price IDs and License Key Prefixes
const POLAR_PRICE_IDS = {
  FREE: '9c822594-748c-40b4-8d16-420e3917e363',
  PRO: 'd320713a-feaf-4f87-bd86-75a7f2d3a7ff'
} as const;

const LICENSE_KEY_PREFIXES = {
  FREE: 'SENTVIBE-MEM-FREE',
  PRO: 'SENTVIBE-MEM-BOX'
} as const;

export interface LicenseInfo {
  tier: 'free' | 'pro';
  licenseKey?: string;
  userId?: string;
  subscriptionId?: string;
  validUntil?: string;
  trialInfo?: {
    isTrialUser: boolean;
    trialStarted?: string;
    trialEnded?: string;
    hasUsedFreeTrial: boolean;
  };
  features: {
    memory: boolean;
    sandbox: boolean;
    aiDetection: boolean;
    vsCodeIntegration: boolean;
    cloudSync: boolean;
  };
  limits: {
    memoryEntries: number;
    sandboxExecutions: number;
    projectsPerMonth: number;
  };
}

export interface PolarSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_end: string;
  product: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    email: string;
  };
}

export class LicenseManager {
  private static instance: LicenseManager;
  private licenseCache?: LicenseInfo;
  private machineId?: string;

  private constructor() {}

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load environment variables from .env file if it exists
      await this.loadEnvironment();

      this.machineId = await machineId();
      await this.loadLicense();
    } catch (error) {
      logger.error('License manager initialization failed:', error);
      // Fallback to free tier
      this.licenseCache = this.getFreeTierLicense();
    }
  }

  private async loadEnvironment(): Promise<void> {
    try {
      // Try to load .env file if it exists
      const envPath = join(process.cwd(), '.env');
      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n');

        for (const line of envLines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=');
              if (!process.env[key]) {
                process.env[key] = value;
              }
            }
          }
        }

        logger.debug('Environment variables loaded from .env file');
      }
    } catch (error) {
      logger.debug('No .env file found or failed to load:', error);
    }
  }

  async loadLicense(): Promise<void> {
    const licensePath = this.getLicensePath();
    
    if (!existsSync(licensePath)) {
      this.licenseCache = this.getFreeTierLicense();
      await this.saveLicense(this.licenseCache);
      return;
    }

    try {
      const licenseData = readFileSync(licensePath, 'utf8');
      const license = JSON.parse(licenseData) as LicenseInfo;
      
      // Validate license if it's pro tier
      if (license.tier === 'pro' && license.licenseKey) {
        const isValid = await this.validateLicense(license.licenseKey);
        if (isValid) {
          this.licenseCache = license;
        } else {
          logger.warn('Invalid pro license, falling back to free tier');
          this.licenseCache = this.getFreeTierLicense();
          await this.saveLicense(this.licenseCache);
        }
      } else {
        this.licenseCache = license;
      }
    } catch (error) {
      logger.error('Failed to load license:', error);
      this.licenseCache = this.getFreeTierLicense();
    }
  }

  private async saveLicense(license: LicenseInfo): Promise<void> {
    try {
      const licensePath = this.getLicensePath();
      const licenseDir = dirname(licensePath);

      if (!existsSync(licenseDir)) {
        mkdirSync(licenseDir, { recursive: true });
      }

      writeFileSync(licensePath, JSON.stringify(license, null, 2), 'utf8');
    } catch (error) {
      logger.error('Failed to save license:', error);
    }
  }

  private getLicensePath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
    return join(homeDir, '.sentvibe', 'license.json');
  }

  private getFreeTierLicense(): LicenseInfo {
    // Free tier requires email signup and license key activation
    // No automatic trial - users must get SENTVIBE-MEM-FREE-* key from Polar.sh
    return {
      tier: 'free',
      trialInfo: {
        isTrialUser: false, // Not a trial - requires license key
        hasUsedFreeTrial: false,
      },
      features: {
        memory: false, // Requires license activation
        sandbox: false, // No sandbox in free tier
        aiDetection: false, // Requires license activation
        vsCodeIntegration: false, // Requires license activation
        cloudSync: false,
      },
      limits: {
        memoryEntries: 0, // No features without license
        sandboxExecutions: 0, // No sandbox
        projectsPerMonth: 0, // No features without license
      },
    };
  }

  private getLicenseFromKey(licenseKey: string, subscription: PolarSubscription): LicenseInfo {
    const isProTier = licenseKey.startsWith(LICENSE_KEY_PREFIXES.PRO);
    const isFreeTier = licenseKey.startsWith(LICENSE_KEY_PREFIXES.FREE);

    if (isFreeTier) {
      // Free tier: 30-day trial with memory features only
      const trialStartDate = subscription.current_period_start || new Date().toISOString();
      const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

      return {
        tier: 'free',
        licenseKey,
        userId: subscription.user.id,
        subscriptionId: subscription.id,
        validUntil: trialEndDate,
        trialInfo: {
          isTrialUser: true,
          trialStarted: trialStartDate,
          trialEnded: trialEndDate,
          hasUsedFreeTrial: true,
        },
        features: {
          memory: true,
          sandbox: false, // No sandbox in free tier
          aiDetection: true,
          vsCodeIntegration: true, // Essential for developer workflow
          cloudSync: false,
        },
        limits: {
          memoryEntries: -1, // Unlimited during trial
          sandboxExecutions: 0, // No sandbox
          projectsPerMonth: -1, // Unlimited during trial
        },
      };
    } else if (isProTier) {
      // Pro tier: Full features, no expiration
      return {
        tier: 'pro',
        licenseKey,
        userId: subscription.user.id,
        subscriptionId: subscription.id,
        validUntil: subscription.current_period_end,
        features: {
          memory: true,
          sandbox: true, // Full sandbox access
          aiDetection: true,
          vsCodeIntegration: true,
          cloudSync: false, // Future feature
        },
        limits: {
          memoryEntries: -1, // Unlimited
          sandboxExecutions: -1, // Unlimited
          projectsPerMonth: -1, // Unlimited
        },
      };
    } else {
      throw new Error('Invalid license key prefix');
    }
  }

  async activateLicense(licenseKey: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate license key format first
      if (!this.isValidLicenseKeyFormat(licenseKey)) {
        return {
          success: false,
          message: 'Invalid license key format. Expected SENTVIBE-MEM-BOX-* or SENTVIBE-MEM-FREE-*'
        };
      }

      const subscription = await this.validateLicenseWithPolar(licenseKey);

      if (!subscription) {
        return {
          success: false,
          message: 'Invalid license key or subscription not found'
        };
      }

      if (subscription.status !== 'active') {
        return {
          success: false,
          message: `Subscription is ${subscription.status}. Please update your payment method.`
        };
      }

      const license = this.getLicenseFromKey(licenseKey, subscription);
      await this.saveLicense(license);
      this.licenseCache = license;

      const tierName = license.tier === 'pro' ? 'SentVibe Pro' : 'SentVibe Free Trial';
      const trialInfo = license.tier === 'free' ? ' (30 days)' : '';
      return {
        success: true,
        message: `✅ ${tierName}${trialInfo} activated! Welcome ${subscription.user.email}`
      };
    } catch (error) {
      logger.error('License activation failed:', error);
      return {
        success: false,
        message: 'License activation failed. Please check your internet connection and try again.'
      };
    }
  }

  private isValidLicenseKeyFormat(licenseKey: string): boolean {
    return licenseKey.startsWith(LICENSE_KEY_PREFIXES.PRO) ||
           licenseKey.startsWith(LICENSE_KEY_PREFIXES.FREE);
  }

  // Free tier trial is automatically started when user first uses SentVibe
  // No separate trial command needed - the free tier IS the 30-day trial

  isTrialExpired(): boolean {
    const license = this.licenseCache || this.getFreeTierLicense();

    if (!license.trialInfo?.isTrialUser || !license.trialInfo?.trialEnded) {
      return false;
    }

    return new Date() > new Date(license.trialInfo.trialEnded);
  }

  async deactivateLicense(): Promise<void> {
    const freeLicense = this.getFreeTierLicense();
    await this.saveLicense(freeLicense);
    this.licenseCache = freeLicense;
  }

  private async validateLicense(licenseKey: string): Promise<boolean> {
    try {
      const subscription = await this.validateLicenseWithPolar(licenseKey);
      return subscription?.status === 'active';
    } catch (error) {
      logger.error('License validation failed:', error);
      return false;
    }
  }

  private async validateLicenseWithPolar(licenseKey: string): Promise<PolarSubscription | null> {
    try {
      const polar = new Polar({
        accessToken: process.env['POLAR_ACCESS_TOKEN'] ?? '',
        server: process.env.NODE_ENV === 'development' ? 'sandbox' : 'production'
      });

      // Validate license key using Polar's license key validation
      const validation = await polar.customerPortal.licenseKeys.validate({
        key: licenseKey,
        organizationId: process.env.POLAR_ORGANIZATION_ID || '',
      });

      if (!validation || validation.status !== 'granted') {
        logger.warn(`License key validation failed or not granted: ${validation?.status}`);
        return null;
      }

      // Determine tier based on license key prefix
      const isProTier = licenseKey.startsWith(LICENSE_KEY_PREFIXES.PRO);
      const isFreeTier = licenseKey.startsWith(LICENSE_KEY_PREFIXES.FREE);

      if (!isProTier && !isFreeTier) {
        logger.warn(`License key does not match expected prefixes: ${licenseKey.substring(0, 20)}...`);
        return null;
      }

      // For Pro tier, validate it's the correct benefit
      if (isProTier) {
        const expectedBenefitId = 'addcad94-f7d9-4cc2-a5c9-638da79809ef'; // SentVibe Pro benefit ID

        if (validation.benefitId !== expectedBenefitId) {
          logger.warn(`Pro license key is for benefit ID ${validation.benefitId}, expected Pro tier (${expectedBenefitId})`);
          return null;
        }
      }

      // Check if license is expired
      if (validation.expiresAt && new Date(validation.expiresAt) < new Date()) {
        logger.warn(`License key has expired: ${validation.expiresAt}`);
        return null;
      }

      return {
        id: validation.id,
        status: 'active' as const,
        current_period_end: validation.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        product: {
          name: isProTier ? 'SentVibe Pro' : 'SentVibe Free',
          id: isProTier ? 'sentvibe-pro' : 'sentvibe-free'
        },
        user: {
          id: validation.customer?.id || validation.customerId || 'unknown',
          email: validation.customer?.email || 'unknown@example.com'
        }
      };

    } catch (error) {
      logger.error('Polar.sh API validation failed:', error);

      // Fallback to mock validation for development/testing
      if (process.env.NODE_ENV === 'development' && licenseKey.startsWith('sv_pro_')) {
        logger.warn('Using mock validation in development mode');
        return {
          id: 'sub_mock_123',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          product: {
            name: 'SentVibe Pro',
            id: 'prod_sentvibe_pro'
          },
          user: {
            id: 'user_123',
            email: 'user@example.com'
          }
        };
      }

      return null;
    }
  }

  getLicense(): LicenseInfo {
    if (!this.licenseCache) {
      return this.getFreeTierLicense();
    }
    return this.licenseCache;
  }

  isFeatureEnabled(feature: keyof LicenseInfo['features']): boolean {
    const license = this.getLicense();
    return license.features[feature];
  }

  checkLimit(limit: keyof LicenseInfo['limits'], currentUsage: number): boolean {
    const license = this.getLicense();
    const limitValue = license.limits[limit];
    
    // -1 means unlimited
    if (limitValue === -1) return true;
    
    return currentUsage < limitValue;
  }

  getUpgradeMessage(feature: string): string {
    return formatters.warning(`🔒 ${feature} requires SentVibe Pro ($19/month)`) + '\n' +
           formatters.info('Upgrade: ' + formatters.command('sv license upgrade')) + '\n' +
           formatters.info('Learn more: https://polar.sh/sentvibe');
  }

  async refreshLicense(): Promise<boolean> {
    try {
      const license = this.getLicense();
      
      if (license.tier === 'pro' && license.licenseKey) {
        const isValid = await this.validateLicense(license.licenseKey);
        
        if (!isValid) {
          logger.warn('License validation failed, downgrading to free tier');
          await this.deactivateLicense();
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('License refresh failed:', error);
      return false;
    }
  }

  getLicenseStatus(): {
    tier: string;
    status: string;
    validUntil?: string;
    features: string[];
    limits: string[];
  } {
    const license = this.getLicense();
    
    const enabledFeatures = Object.entries(license.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);

    const limits = Object.entries(license.limits)
      .map(([limit, value]) => `${limit}: ${value === -1 ? 'unlimited' : value}`);

    return {
      tier: license.tier,
      status: license.tier === 'pro' ? 'active' : 'free',
      validUntil: license.validUntil,
      features: enabledFeatures,
      limits,
    };
  }
}
