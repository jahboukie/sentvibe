import { LicenseManager } from '../license/license-manager.js';
import { FeatureGate } from '../license/feature-gate.js';
import { colors, formatters } from '../utils/colors.js';
import { spinners } from '../utils/spinner.js';
import { logger } from '../utils/logger.js';
import type { CLIOptions } from '../types/index.js';
import ora from 'ora';

export const license = {
  async status(): Promise<void> {
    const licenseManager = LicenseManager.getInstance();
    const featureGate = FeatureGate.getInstance();
    
    await licenseManager.initialize();
    
    const status = licenseManager.getLicenseStatus();
    const license = licenseManager.getLicense();

    console.log(formatters.header('📄 SentVibe License Status'));
    console.log('');
    
    // License tier and status
    console.log(formatters.subheader('License Information'));
    console.log(formatters.keyValue('  Tier', featureGate.getTierBadge() + ` ${status.tier.toUpperCase()}`));
    console.log(formatters.keyValue('  Status', status.status === 'active' ? colors.success('Active') : colors.warning('Free')));
    
    if (status.validUntil) {
      const validDate = new Date(status.validUntil);
      const isExpiringSoon = validDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days
      
      console.log(formatters.keyValue('  Valid Until', 
        isExpiringSoon 
          ? colors.warning(validDate.toLocaleDateString())
          : colors.success(validDate.toLocaleDateString())
      ));
    }
    
    console.log(formatters.keyValue('  Features', featureGate.getFeatureSummary()));

    // Show trial information for free tier
    if (license.tier === 'free' && license.trialInfo?.isTrialUser) {
      const licenseManager = LicenseManager.getInstance();
      const isExpired = licenseManager.isTrialExpired();

      if (isExpired) {
        console.log(formatters.keyValue('  Trial Status', colors.red('EXPIRED - UPGRADE REQUIRED')));
        console.log(formatters.keyValue('  Trial Ended', new Date(license.trialInfo.trialEnded!).toLocaleDateString()));
      } else {
        console.log(formatters.keyValue('  Trial Status', colors.yellow('ACTIVE')));
        console.log(formatters.keyValue('  Trial Ends', new Date(license.trialInfo.trialEnded!).toLocaleDateString()));

        // Calculate days remaining
        const daysRemaining = Math.ceil((new Date(license.trialInfo.trialEnded!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(formatters.keyValue('  Days Remaining', `${daysRemaining} days`));
      }
    }

    console.log('');

    // Feature breakdown
    console.log(formatters.subheader('Available Features'));
    const featureStatus = [
      { name: 'Persistent Memory', enabled: license.features.memory, tier: 'Free' },
      { name: 'Memory Search & Patterns', enabled: license.features.memory, tier: 'Free' },
      { name: 'AI Agent Detection', enabled: license.features.aiDetection, tier: 'Free' },
      { name: 'VS Code Integration', enabled: license.features.vsCodeIntegration, tier: 'Free' },
      { name: 'Cursor/Windsurf Support', enabled: license.features.vsCodeIntegration, tier: 'Free' },
      { name: 'Secure Sandbox Environment', enabled: license.features.sandbox, tier: 'Pro' },
      { name: 'Confidence Scoring', enabled: license.features.sandbox, tier: 'Pro' },
    ];

    featureStatus.forEach(feature => {
      const status = feature.enabled ? colors.success('✅') : colors.dim('❌');
      const tierBadge = feature.tier === 'Pro' ? colors.badge(colors.warning('PRO')) : colors.badge(colors.dim('FREE'));
      console.log(`  ${status} ${feature.name} ${tierBadge}`);
    });

    console.log('');

    // Usage limits
    console.log(formatters.subheader('Usage Limits'));
    status.limits.forEach(limit => {
      console.log(formatters.keyValue(`  ${limit.split(':')[0]}`, limit.split(':')[1].trim()));
    });

    console.log('');

    // Actions
    if (license.tier === 'free') {
      const licenseManager = LicenseManager.getInstance();
      const isExpired = licenseManager.isTrialExpired();

      if (isExpired) {
        console.log(formatters.subheader('⚠️  Trial Expired - Upgrade Required'));
        console.log(colors.red('Your 30-day free trial has ended. Upgrade to Pro to continue using SentVibe.'));
        console.log('');
        console.log(formatters.info('🚀 Pro includes everything you used during your trial PLUS:'));
        console.log(formatters.listItem('Secure sandbox environment for safe code testing'));
        console.log(formatters.listItem('95% confidence scoring before deployment'));
        console.log(formatters.listItem('No expiration - use forever'));
        console.log(formatters.listItem('Priority support'));
      } else {
        console.log(formatters.subheader('Upgrade to Pro'));
        console.log(formatters.info('🚀 Extend your experience forever + get sandbox features!'));
        console.log(formatters.listItem('Keep all memory features (no expiration)'));
        console.log(formatters.listItem('Secure sandbox environment for safe code testing'));
        console.log(formatters.listItem('95% confidence scoring before deployment'));
        console.log(formatters.listItem('Priority support'));
      }

      console.log('');
      console.log(formatters.info('Commands:'));
      console.log(formatters.listItem(formatters.command('sv license upgrade') + ' - Start Pro subscription'));
      console.log(formatters.listItem(formatters.command('sv license activate <key>') + ' - Activate with license key'));
    } else {
      console.log(formatters.subheader('Manage Subscription'));
      console.log(formatters.info('Commands:'));
      console.log(formatters.listItem(formatters.command('sv license refresh') + ' - Refresh license status'));
      console.log(formatters.listItem(formatters.command('sv license deactivate') + ' - Deactivate Pro license'));
    }
  },

  async activate(licenseKey: string): Promise<void> {
    if (!licenseKey) {
      console.log(formatters.error('License key is required'));
      console.log(formatters.info('Usage: ' + formatters.command('sv license activate <license-key>')));
      return;
    }

    const spinner = spinners.loading('Activating SentVibe Pro license...').start();
    
    try {
      const licenseManager = LicenseManager.getInstance();
      await licenseManager.initialize();
      
      const result = await licenseManager.activateLicense(licenseKey);
      
      if (result.success) {
        spinner.succeed('SentVibe Pro activated successfully!');
        console.log('');
        console.log(formatters.success(result.message));
        console.log('');
        console.log(formatters.info('🎉 You now have access to:'));
        console.log(formatters.listItem('🛡️ Secure sandbox environment'));
        console.log(formatters.listItem('📊 95% confidence scoring'));
        console.log(formatters.listItem('🔧 VS Code integration'));
        console.log(formatters.listItem('⚡ Unlimited operations'));
        console.log('');
        console.log(formatters.info('Run ' + formatters.command('sv status') + ' to see your enhanced environment!'));
      } else {
        spinner.fail('License activation failed');
        console.log('');
        console.log(formatters.error(result.message));
        console.log('');
        console.log(formatters.info('Need help?'));
        console.log(formatters.listItem('Check your license key for typos'));
        console.log(formatters.listItem('Ensure your subscription is active'));
        console.log(formatters.listItem('Contact support: https://polar.sh/sentvibe'));
      }
    } catch (error) {
      spinner.fail('License activation failed');
      logger.error('License activation error:', error);
      console.log(formatters.error('An unexpected error occurred. Please try again.'));
    }
  },

  async deactivate(options: CLIOptions = {}): Promise<void> {
    const licenseManager = LicenseManager.getInstance();
    await licenseManager.initialize();
    
    const license = licenseManager.getLicense();
    
    if (license.tier === 'free') {
      console.log(formatters.warning('No Pro license to deactivate'));
      return;
    }

    if (!options.confirm) {
      const prompts = await import('prompts');
      const { confirm } = await prompts.default({
        type: 'confirm',
        name: 'confirm',
        message: 'Deactivate SentVibe Pro license? You will lose access to Pro features.',
        initial: false
      });

      if (!confirm) {
        console.log('Cancelled');
        return;
      }
    }

    const spinner = spinners.loading('Deactivating Pro license...').start();
    
    try {
      await licenseManager.deactivateLicense();
      
      spinner.succeed('Pro license deactivated');
      console.log('');
      console.log(formatters.warning('🔒 Pro features are now disabled'));
      console.log(formatters.info('You still have access to:'));
      console.log(formatters.listItem('🧠 Unlimited persistent memory'));
      console.log(formatters.listItem('🔍 Memory search and patterns'));
      console.log(formatters.listItem('🤖 AI agent detection'));
      console.log('');
      console.log(formatters.info('Reactivate anytime: ' + formatters.command('sv license activate <key>')));
    } catch (error) {
      spinner.fail('Deactivation failed');
      logger.error('License deactivation error:', error);
      console.log(formatters.error('Failed to deactivate license. Please try again.'));
    }
  },

  async refresh(): Promise<void> {
    const spinner = spinners.loading('Refreshing license status...').start();
    
    try {
      const licenseManager = LicenseManager.getInstance();
      await licenseManager.initialize();
      
      const isValid = await licenseManager.refreshLicense();
      
      if (isValid) {
        spinner.succeed('License status refreshed');
        console.log(formatters.success('License is valid and up to date'));
      } else {
        spinner.warn('License validation failed');
        console.log(formatters.warning('License may have expired or been cancelled'));
        console.log(formatters.info('Run ' + formatters.command('sv license status') + ' for details'));
      }
    } catch (error) {
      spinner.fail('License refresh failed');
      logger.error('License refresh error:', error);
      console.log(formatters.error('Failed to refresh license. Please check your internet connection.'));
    }
  },

  async upgrade(): Promise<void> {
    console.log(formatters.header('🚀 Upgrade to SentVibe Pro'));
    console.log('');
    console.log(formatters.info('SentVibe Pro unlocks the full AI-native development experience:'));
    console.log('');
    
    const features = [
      '🛡️ Secure sandbox environment for safe code testing',
      '📊 95% confidence scoring before deployment',
      '⚡ Unlimited sandbox executions',
      '🎯 Priority support and early access',
      '🚀 Future cloud features (coming soon)'
    ];

    features.forEach(feature => console.log(formatters.listItem(feature)));
    
    console.log('');
    console.log(formatters.subheader('💰 Pricing: $19/month'));
    console.log('');
    console.log(formatters.info('🔗 Subscribe at: ' + colors.underline('https://polar.sh/sentvibe')));
    console.log('');
    console.log(formatters.info('After subscribing, activate with:'));
    console.log(formatters.command('sv license activate <your-license-key>'));
    console.log('');
    console.log(colors.dim('💡 Your license key will be provided after successful payment'));
  },



  async compare(): Promise<void> {
    const featureGate = FeatureGate.getInstance();
    await featureGate.initialize();
    
    featureGate.showFeatureComparison();
  }
};
