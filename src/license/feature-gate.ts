import { LicenseManager } from './license-manager.js';
import { logger } from '../utils/logger.js';
import { colors, formatters } from '../utils/colors.js';

export class FeatureGate {
  private static instance: FeatureGate;
  private licenseManager: LicenseManager;

  private constructor() {
    this.licenseManager = LicenseManager.getInstance();
  }

  static getInstance(): FeatureGate {
    if (!FeatureGate.instance) {
      FeatureGate.instance = new FeatureGate();
    }
    return FeatureGate.instance;
  }

  async initialize(): Promise<void> {
    await this.licenseManager.initialize();
  }

  // Memory features (FREE TIER - but only during 30-day trial)
  canUseMemory(): boolean {
    const license = this.licenseManager.getLicense();

    // Check if free trial has expired
    if (license.tier === 'free' && this.licenseManager.isTrialExpired()) {
      return false;
    }

    return this.licenseManager.isFeatureEnabled('memory');
  }

  canStoreMemory(): boolean {
    return this.canUseMemory();
  }

  canSearchMemory(): boolean {
    return this.canUseMemory();
  }

  canUsePatterns(): boolean {
    return this.canUseMemory();
  }

  // Sandbox features (PRO TIER ONLY)
  canUseSandbox(): { allowed: boolean; message?: string } {
    if (this.licenseManager.isFeatureEnabled('sandbox')) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: this.licenseManager.getUpgradeMessage('Secure Sandbox Environment')
    };
  }

  canExecuteInSandbox(): { allowed: boolean; message?: string } {
    return this.canUseSandbox();
  }

  canCalculateConfidence(): { allowed: boolean; message?: string } {
    return this.canUseSandbox();
  }

  canDeployFromSandbox(): { allowed: boolean; message?: string } {
    return this.canUseSandbox();
  }

  // AI Detection features (FREE TIER)
  canDetectAI(): boolean {
    return this.licenseManager.isFeatureEnabled('aiDetection');
  }

  canShowWelcomeMessages(): boolean {
    return this.licenseManager.isFeatureEnabled('aiDetection');
  }

  // VS Code Integration (FREE TIER - Essential for developer workflow)
  canUseVSCodeIntegration(): { allowed: boolean; message?: string } {
    if (this.licenseManager.isFeatureEnabled('vsCodeIntegration')) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: 'VS Code integration is not available'
    };
  }

  // Usage limits checking
  checkMemoryLimit(currentEntries: number): { allowed: boolean; message?: string } {
    if (this.licenseManager.checkLimit('memoryEntries', currentEntries)) {
      return { allowed: true };
    }

    const license = this.licenseManager.getLicense();
    return {
      allowed: false,
      message: `Memory limit reached (${license.limits.memoryEntries} entries). Upgrade to Pro for unlimited memory.`
    };
  }

  checkSandboxLimit(currentExecutions: number): { allowed: boolean; message?: string } {
    if (!this.canUseSandbox().allowed) {
      return this.canUseSandbox();
    }

    if (this.licenseManager.checkLimit('sandboxExecutions', currentExecutions)) {
      return { allowed: true };
    }

    const license = this.licenseManager.getLicense();
    return {
      allowed: false,
      message: `Sandbox execution limit reached (${license.limits.sandboxExecutions} executions). Upgrade to Pro for unlimited executions.`
    };
  }

  // Helper methods for CLI commands
  async enforceFeature(feature: 'memory' | 'sandbox' | 'vsCodeIntegration'): Promise<boolean> {
    let check: { allowed: boolean; message?: string };

    switch (feature) {
      case 'memory':
        check = { allowed: this.canUseMemory() };
        break;
      case 'sandbox':
        check = this.canUseSandbox();
        break;
      case 'vsCodeIntegration':
        check = this.canUseVSCodeIntegration();
        break;
      default:
        check = { allowed: false, message: 'Unknown feature' };
    }

    if (!check.allowed && check.message) {
      console.log(check.message);
      return false;
    }

    return check.allowed;
  }

  showFeatureComparison(): void {
    const license = this.licenseManager.getLicense();
    
    console.log(formatters.header('🎯 SentVibe Feature Comparison'));
    console.log('');
    
    // Current tier
    console.log(formatters.subheader(`Current Tier: ${license.tier.toUpperCase()}`));
    console.log('');

    // Feature table
    const features = [
      { name: 'Persistent Memory', free: '✅ (30 days)', pro: '✅' },
      { name: 'Memory Search & Patterns', free: '✅ (30 days)', pro: '✅' },
      { name: 'AI Agent Detection', free: '✅ (30 days)', pro: '✅' },
      { name: 'VS Code Integration', free: '✅ (30 days)', pro: '✅' },
      { name: 'Cursor/Windsurf Support', free: '✅ (30 days)', pro: '✅' },
      { name: 'No Expiration', free: '❌', pro: '✅' },
      { name: 'Secure Sandbox Environment', free: '❌', pro: '✅' },
      { name: 'Confidence Scoring', free: '❌', pro: '✅' },
      { name: 'Safe Code Execution', free: '❌', pro: '✅' },
      { name: 'Priority Support', free: '❌', pro: '✅' },
    ];

    console.log(formatters.keyValue('Feature', 'Free'.padEnd(8) + 'Pro ($19/mo)'));
    console.log('─'.repeat(50));
    
    features.forEach(feature => {
      const freeStatus = license.tier === 'free' && feature.free === '✅' 
        ? colors.success(feature.free) 
        : feature.free === '✅' 
          ? colors.success(feature.free)
          : colors.dim(feature.free);
          
      const proStatus = license.tier === 'pro' && feature.pro === '✅'
        ? colors.success(feature.pro)
        : feature.pro === '✅'
          ? colors.success(feature.pro)
          : colors.dim(feature.pro);

      console.log(`${feature.name.padEnd(25)} ${freeStatus.padEnd(15)} ${proStatus}`);
    });

    console.log('');
    
    if (license.tier === 'free') {
      console.log(formatters.info('🚀 Upgrade to Pro for the full AI-native development experience!'));
      console.log(formatters.info('Command: ' + formatters.command('sv license upgrade')));
      console.log(formatters.info('Learn more: https://polar.sh/sentvibe'));
    } else {
      console.log(formatters.success('🎉 You have SentVibe Pro! Enjoy all features.'));
      if (license.validUntil) {
        console.log(formatters.info(`Valid until: ${new Date(license.validUntil).toLocaleDateString()}`));
      }
    }
  }

  getTierBadge(): string {
    const license = this.licenseManager.getLicense();
    
    if (license.tier === 'pro') {
      return colors.badge(colors.success('PRO'));
    } else {
      return colors.badge(colors.dim('FREE'));
    }
  }

  getFeatureSummary(): string {
    const license = this.licenseManager.getLicense();
    const enabledCount = Object.values(license.features).filter(Boolean).length;
    const totalCount = Object.keys(license.features).length;
    
    return `${enabledCount}/${totalCount} features enabled`;
  }

  // Middleware for CLI commands
  static withFeatureCheck(feature: 'memory' | 'sandbox' | 'vsCodeIntegration') {
    return async (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const featureGate = FeatureGate.getInstance();
        await featureGate.initialize();
        
        const allowed = await featureGate.enforceFeature(feature);
        if (!allowed) {
          return;
        }
        
        return method.apply(this, args);
      };
    };
  }

  // Usage tracking (for limits)
  async trackMemoryUsage(): Promise<void> {
    // TODO: Implement usage tracking
    logger.debug('Memory usage tracked');
  }

  async trackSandboxUsage(): Promise<void> {
    // TODO: Implement usage tracking  
    logger.debug('Sandbox usage tracked');
  }

  // License status for status command
  getLicenseStatusForDisplay(): {
    tier: string;
    badge: string;
    features: string;
    status: string;
  } {
    const license = this.licenseManager.getLicense();
    const status = this.licenseManager.getLicenseStatus();
    
    return {
      tier: license.tier.toUpperCase(),
      badge: this.getTierBadge(),
      features: this.getFeatureSummary(),
      status: status.status
    };
  }
}
