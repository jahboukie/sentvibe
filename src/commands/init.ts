import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { colors, formatters } from '../utils/colors.js';
import { spinners } from '../utils/spinner.js';
import { 
  createInitialConfig, 
  saveConfig, 
  getProjectState, 
  getSentVibeDir,
  getDisabledDir 
} from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type { CLIOptions } from '../types/index.js';

export async function init(options: CLIOptions = {}): Promise<void> {
  const projectPath = process.cwd();
  const sentvibeDir = getSentVibeDir(projectPath);
  const state = getProjectState(projectPath);

  // Check if already initialized
  if (state === 'active' && !options.force) {
    if (!options.silent) {
      console.log(formatters.warning('SentVibe is already active in this project'));
      console.log(formatters.info('Use --force to reinitialize or "sv status" to see current state'));
    }
    return;
  }

  const spinner = options.silent ? null : spinners.init('Initializing SentVibe...').start();

  try {
    // Create SentVibe directory
    if (!existsSync(sentvibeDir)) {
      mkdirSync(sentvibeDir, { recursive: true });
    }

    // Create initial configuration
    const config = createInitialConfig(projectPath);
    saveConfig(config, projectPath);

    // Initialize memory database (placeholder for now)
    const memoryDbPath = join(sentvibeDir, 'memory.db');
    // TODO: Initialize actual SQLite database
    writeFileSync(memoryDbPath, ''); // Placeholder

    // Create sandbox directory
    const sandboxDir = join(sentvibeDir, 'sandbox');
    if (!existsSync(sandboxDir)) {
      mkdirSync(sandboxDir, { recursive: true });
    }

    // Setup VS Code integration (placeholder)
    await setupVSCodeIntegration(projectPath);

    // Add to .gitignore
    await addToGitignore(projectPath);

    if (spinner) {
      spinner.succeed('SentVibe initialized successfully!');
    }

    if (!options.silent) {
      console.log('');
      console.log(formatters.header('🎉 SentVibe is now active!'));
      console.log('');
      console.log(formatters.subheader('Next steps:'));
      console.log(formatters.listItem('AI agents will now see enhanced environment'));
      console.log(formatters.listItem('Use ' + formatters.command('sv status') + ' to see current state'));
      console.log(formatters.listItem('Use ' + formatters.command('sv memory context') + ' to get project context'));
      console.log(formatters.listItem('Use ' + formatters.command('sv sandbox test') + ' to test code safely'));
      console.log('');
      console.log(colors.dim('💡 SentVibe runs invisibly in the background - no manual management needed!'));
    }

  } catch (error) {
    if (spinner) {
      spinner.fail('Failed to initialize SentVibe');
    }
    logger.error('Initialization failed:', error);
    
    if (!options.silent) {
      console.error(formatters.error(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
    
    process.exit(1);
  }
}

export async function reInit(): Promise<void> {
  const projectPath = process.cwd();
  const disabledDir = getDisabledDir(projectPath);
  const sentvibeDir = getSentVibeDir(projectPath);
  const state = getProjectState(projectPath);

  if (state === 'active') {
    console.log(formatters.info('SentVibe is already active in this project'));
    return;
  }

  const spinner = spinners.init('Re-enabling SentVibe...').start();

  try {
    if (state === 'disabled') {
      // Restore from disabled state
      const fs = await import('fs/promises');
      
      if (existsSync(sentvibeDir)) {
        await fs.rm(sentvibeDir, { recursive: true });
      }
      
      await fs.rename(disabledDir, sentvibeDir);
      
      // Update configuration with reactivation timestamp
      const config = createInitialConfig(projectPath);
      config.reactivated = new Date().toISOString();
      saveConfig(config, projectPath);
      
      spinner.succeed('SentVibe re-enabled with all previous data restored!');
    } else {
      // Fresh initialization
      spinner.text = 'Initializing fresh SentVibe setup...';
      await init({ force: true, silent: true });
      spinner.succeed('SentVibe initialized successfully!');
    }

    console.log('');
    console.log(formatters.header('🎉 Welcome back to SentVibe!'));
    console.log(formatters.listItem('All previous memory and settings restored'));
    console.log(formatters.listItem('AI agents will now see enhanced environment'));
    console.log(formatters.listItem('Use ' + formatters.command('sv status') + ' to see current state'));

  } catch (error) {
    spinner.fail('Failed to re-enable SentVibe');
    logger.error('Re-initialization failed:', error);
    console.error(formatters.error(`Re-initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

export async function uninit(options: CLIOptions = {}): Promise<void> {
  const projectPath = process.cwd();
  const sentvibeDir = getSentVibeDir(projectPath);
  const disabledDir = getDisabledDir(projectPath);
  const state = getProjectState(projectPath);

  if (state !== 'active') {
    console.log(formatters.warning('SentVibe is not active in this project'));
    return;
  }

  if (!options.confirm) {
    const prompts = await import('prompts');
    const { confirm } = await prompts.default({
      type: 'confirm',
      name: 'confirm',
      message: 'Disable SentVibe for this project? (Memory will be preserved)',
      initial: false
    });

    if (!confirm) {
      console.log('Cancelled');
      return;
    }
  }

  const spinner = spinners.init('Disabling SentVibe...').start();

  try {
    const fs = await import('fs/promises');
    
    // Move .sentvibe to .sentvibe.disabled
    if (existsSync(disabledDir)) {
      await fs.rm(disabledDir, { recursive: true });
    }
    
    await fs.rename(sentvibeDir, disabledDir);

    // TODO: Remove VS Code integration
    // await removeVSCodeIntegration(projectPath);

    spinner.succeed('SentVibe disabled for this project');

    console.log('');
    console.log(formatters.header('📝 SentVibe Disabled'));
    console.log(formatters.listItem('Memory and settings preserved in .sentvibe.disabled/'));
    console.log(formatters.listItem('Use ' + formatters.command('sv re-init') + ' to re-enable with all data intact'));
    console.log(formatters.listItem('AI agents will no longer see SentVibe features'));

  } catch (error) {
    spinner.fail('Failed to disable SentVibe');
    logger.error('Disable failed:', error);
    console.error(formatters.error(`Failed to disable: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

async function setupVSCodeIntegration(projectPath: string): Promise<void> {
  // TODO: Implement VS Code integration setup
  // This will create .vscode/settings.json, tasks.json, etc.
  logger.debug('VS Code integration setup - placeholder');
}

async function addToGitignore(projectPath: string): Promise<void> {
  const gitignorePath = join(projectPath, '.gitignore');
  const sentvibeEntry = '.sentvibe/';
  
  try {
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes(sentvibeEntry)) {
        appendFileSync(gitignorePath, `\n${sentvibeEntry}\n`);
      }
    } else {
      writeFileSync(gitignorePath, `${sentvibeEntry}\n`);
    }
  } catch (error) {
    logger.warn('Failed to update .gitignore:', error);
    // Non-fatal error
  }
}
