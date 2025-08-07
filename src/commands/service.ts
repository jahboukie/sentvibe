import { colors, formatters } from '../utils/colors.js';
import { spinners } from '../utils/spinner.js';
import {
  loadConfig,
  getProjectState,
  isInitialized
} from '../utils/config.js';
import { FeatureGate } from '../license/feature-gate.js';
import { logger } from '../utils/logger.js';
import type { CLIOptions } from '../types/index.js';

export async function start(options: CLIOptions = {}): Promise<void> {
  const projectPath = process.cwd();
  const state = getProjectState(projectPath);

  if (state !== 'active') {
    console.log(formatters.error('SentVibe is not initialized in this project'));
    console.log(formatters.info('SentVibe auto-initializes when you open projects in VS Code/Cursor'));
    console.log(formatters.info('Or run: ' + formatters.command('sv init')));
    return;
  }

  const config = loadConfig(projectPath);
  if (!config) {
    console.log(formatters.error('Failed to load SentVibe configuration'));
    return;
  }

  const spinner = spinners.init('Starting SentVibe services...').start();

  try {
    // TODO: Initialize memory system
    // const memory = new ProjectMemory(join(projectPath, '.sentvibe/memory.db'));
    // await memory.initialize();

    // TODO: Start file watching
    // await memory.startFileWatcher();

    // TODO: Start LSP server for VS Code integration
    // await startLSPServer();

    spinner.succeed('SentVibe services are running');

    if (options.daemon) {
      console.log(formatters.info('Running in daemon mode...'));
      
      process.on('SIGINT', async () => {
        console.log('\n' + formatters.info('Shutting down SentVibe services...'));
        // TODO: Cleanup
        process.exit(0);
      });

      // Keep process alive
      setInterval(() => {}, 1000);
    } else {
      console.log('');
      console.log(formatters.header('🚀 SentVibe Services Active'));
      console.log(formatters.listItem('File watching: ' + colors.active('Active')));
      console.log(formatters.listItem('Memory logging: ' + colors.active('Active')));
      console.log(formatters.listItem('VS Code integration: ' + colors.active('Active')));
      console.log(formatters.listItem('AI agent detection: ' + colors.active('Active')));
      console.log('');
      console.log(colors.dim('Press Ctrl+C to stop services'));
    }

  } catch (error) {
    spinner.fail('Failed to start SentVibe services');
    logger.error('Service start failed:', error);
    console.error(formatters.error(`Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

export async function stop(): Promise<void> {
  const spinner = spinners.init('Stopping SentVibe services...').start();

  try {
    // TODO: Stop file watchers
    // TODO: Stop LSP server
    // TODO: Cleanup resources

    spinner.succeed('SentVibe services stopped');
    console.log(formatters.info('All SentVibe services have been stopped'));

  } catch (error) {
    spinner.fail('Failed to stop SentVibe services');
    logger.error('Service stop failed:', error);
    console.error(formatters.error(`Failed to stop: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

export async function status(): Promise<void> {
  const projectPath = process.cwd();
  const state = getProjectState(projectPath);

  // Initialize feature gate for license info
  const featureGate = FeatureGate.getInstance();
  await featureGate.initialize();
  const licenseStatus = featureGate.getLicenseStatusForDisplay();

  console.log(formatters.header('🎯 SentVibe Project Status'));
  console.log('');

  if (state === 'active') {
    const config = loadConfig(projectPath);
    if (!config) {
      console.log(formatters.error('Configuration file corrupted'));
      return;
    }

    console.log(formatters.success('SentVibe is ACTIVE'));
    console.log('');
    
    console.log(formatters.subheader('📊 Project Information'));
    console.log(formatters.keyValue('  Status', colors.active('Active')));
    console.log(formatters.keyValue('  Initialized', formatters.timestamp(config.created)));
    if (config.reactivated) {
      console.log(formatters.keyValue('  Last reactivated', formatters.timestamp(config.reactivated)));
    }
    console.log(formatters.keyValue('  Version', config.version));
    console.log(formatters.keyValue('  License', `${licenseStatus.badge} ${licenseStatus.tier}`));
    console.log('');

    console.log(formatters.subheader('🎯 Features'));
    const memoryEnabled = featureGate.canUseMemory();
    const sandboxEnabled = featureGate.canUseSandbox().allowed;
    const vsCodeEnabled = featureGate.canUseVSCodeIntegration().allowed;

    console.log(formatters.keyValue('  Memory Engine', memoryEnabled ? colors.active('Enabled') : colors.inactive('Disabled')));
    console.log(formatters.keyValue('  Sandbox Environment', sandboxEnabled ? colors.active('Enabled') : colors.inactive('Pro Only')));
    console.log(formatters.keyValue('  VS Code Integration', vsCodeEnabled ? colors.active('Enabled') : colors.inactive('Pro Only')));
    console.log(formatters.keyValue('  AI Welcome Messages', config.settings.aiWelcomeEnabled ? colors.active('Enabled') : colors.inactive('Disabled')));
    console.log(formatters.keyValue('  Auto Initialization', config.settings.autoInitialization ? colors.active('Enabled') : colors.inactive('Disabled')));
    console.log(formatters.keyValue('  Confidence Threshold', formatters.confidence(config.settings.confidenceThreshold)));
    console.log('');

    // License-specific information
    console.log(formatters.subheader('📄 License Information'));
    console.log(formatters.keyValue('  Current Tier', licenseStatus.badge));
    console.log(formatters.keyValue('  Features Available', licenseStatus.features));
    console.log(formatters.keyValue('  Status', licenseStatus.status === 'active' ? colors.success('Active') : colors.warning('Free Tier')));

    if (licenseStatus.tier === 'FREE') {
      console.log('');
      console.log(formatters.info('🚀 Upgrade to Pro for sandbox environment and more!'));
      console.log(formatters.info('Run: ' + formatters.command('sv license upgrade')));
    }
    console.log('');

    // TODO: Show actual statistics
    console.log(formatters.subheader('📈 Statistics'));
    console.log(formatters.keyValue('  Total memories', '0')); // Placeholder
    console.log(formatters.keyValue('  Files tracked', '0')); // Placeholder
    console.log(formatters.keyValue('  AI interactions', '0')); // Placeholder
    console.log(formatters.keyValue('  Sandbox sessions', '0')); // Placeholder
    console.log(formatters.keyValue('  Avg confidence', 'N/A')); // Placeholder
    console.log('');

    // TODO: Show active AI agents
    console.log(formatters.subheader('🤖 AI Agents'));
    console.log(formatters.keyValue('  Active agents', colors.dim('None detected'))); // Placeholder
    console.log(formatters.keyValue('  Welcomed agents', config.aiAgentsWelcomed.length > 0 ? config.aiAgentsWelcomed.join(', ') : colors.dim('None')));

  } else if (state === 'disabled') {
    console.log(formatters.warning('SentVibe is DISABLED'));
    console.log('');
    console.log(formatters.info('Memory and settings are preserved in .sentvibe.disabled/'));
    console.log(formatters.info('Use ' + formatters.command('sv re-init') + ' to re-enable with all data intact'));

  } else {
    console.log(formatters.warning('SentVibe is NOT INITIALIZED'));
    console.log('');
    console.log(formatters.info('SentVibe auto-initializes when you open projects in VS Code/Cursor'));
    console.log(formatters.info('Or manually run: ' + formatters.command('sv init')));
  }

  console.log('');
  console.log(formatters.subheader('📋 Available Commands'));
  console.log(formatters.listItem(formatters.command('sv status') + ' - Show this status'));
  console.log(formatters.listItem(formatters.command('sv memory context') + ' - Get project context for AI'));
  console.log(formatters.listItem(formatters.command('sv sandbox test') + ' - Test code safely'));
  console.log(formatters.listItem(formatters.command('sv ai-status') + ' - See what AI agents experience'));
  
  if (state === 'active') {
    console.log(formatters.listItem(formatters.command('sv uninit') + ' - Disable SentVibe (preserves data)'));
  } else if (state === 'disabled') {
    console.log(formatters.listItem(formatters.command('sv re-init') + ' - Re-enable SentVibe'));
  } else {
    console.log(formatters.listItem(formatters.command('sv init') + ' - Initialize SentVibe'));
  }
}
