#!/usr/bin/env node

// Load environment variables silently
import { config } from 'dotenv';

// Suppress dotenv verbose output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = () => {};
console.error = () => {};

config({
  debug: false,
  override: false
});

// Restore console
console.log = originalConsoleLog;
console.error = originalConsoleError;

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import colors from 'picocolors';

// Import commands
import { init, reInit, uninit } from '../commands/init.js';
import { start, stop, status } from '../commands/service.js';
import { memory } from '../commands/memory.js';
import { sandbox } from '../commands/sandbox.js';
import { aiStatus } from '../commands/ai.js';
import { license } from '../commands/license.js';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

const program = new Command();

// Configure main program
program
  .name('sentvibe')
  .description('🤖 Universal AI memory and sandbox for developers - AI-native development infrastructure')
  .version(packageJson.version)
  .configureOutput({
    writeErr: (str) => process.stderr.write(colors.red(str)),
    writeOut: (str) => process.stdout.write(str),
  });

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(colors.red('💥 Unexpected error:'), error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(colors.red('💥 Unhandled promise rejection:'), reason);
  process.exit(1);
});

// Core commands
program
  .command('init')
  .description('🚀 Initialize project with SentVibe (usually automatic)')
  .option('-f, --force', 'Overwrite existing configuration')
  .option('-s, --silent', 'Silent initialization without output')
  .action(init);

program
  .command('re-init')
  .description('🔄 Re-enable SentVibe for this project')
  .action(reInit);

program
  .command('uninit')
  .description('⏸️  Disable SentVibe for this project (preserves data)')
  .option('--confirm', 'Skip confirmation prompt')
  .action(uninit);

program
  .command('start')
  .description('▶️  Start background memory and file watching')
  .option('-d, --daemon', 'Run as background daemon')
  .action(start);

program
  .command('stop')
  .description('⏹️  Stop background services')
  .action(stop);

program
  .command('status')
  .description('📊 Show current SentVibe status and statistics')
  .action(status);

program
  .command('ai-status')
  .description('🤖 Show what AI agents see in this project')
  .action(aiStatus);

// Memory commands
const memoryCmd = program
  .command('memory')
  .description('🧠 Project memory operations');

memoryCmd
  .command('search <query>')
  .description('🔍 Search project memory')
  .option('-l, --limit <number>', 'Number of results', '10')
  .option('-f, --format <format>', 'Output format (json|markdown)', 'markdown')
  .action(memory.search);

memoryCmd
  .command('context')
  .description('📋 Generate context for current state')
  .option('-f, --format <format>', 'Output format (json|markdown)', 'markdown')
  .option('-l, --limit <number>', 'Number of recent memories', '20')
  .action(memory.context);

memoryCmd
  .command('add')
  .description('➕ Manually add memory entry')
  .option('-i, --intent <intent>', 'What you intended to do')
  .option('-o, --outcome <outcome>', 'What actually happened')
  .option('-f, --file <file>', 'Related file path')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .action(memory.add);

memoryCmd
  .command('patterns [technology]')
  .description('🎯 Show learned patterns for technology')
  .option('-l, --limit <number>', 'Number of patterns', '10')
  .action(memory.patterns);

memoryCmd
  .command('similar <description>')
  .description('🔗 Find similar implementations')
  .option('-l, --limit <number>', 'Number of results', '5')
  .action(memory.similar);

memoryCmd
  .command('clear')
  .description('🗑️  Clear project memory')
  .option('--confirm', 'Skip confirmation prompt')
  .action(memory.clear);

memoryCmd
  .command('export [file]')
  .description('📤 Export memory to file')
  .option('-f, --format <format>', 'Export format (json|markdown|csv)', 'json')
  .action(memory.export);

// Sandbox commands  
const sandboxCmd = program
  .command('sandbox')
  .description('🛡️  Code execution sandbox');

sandboxCmd
  .command('test [files...]')
  .description('🧪 Run tests in sandbox')
  .option('-w, --watch', 'Watch mode')
  .option('-c, --coverage', 'Generate coverage report')
  .action(sandbox.test);

sandboxCmd
  .command('run <command>')
  .description('⚡ Execute command in sandbox')
  .option('-e, --env <env>', 'Environment variables (key=value)')
  .action(sandbox.run);

sandboxCmd
  .command('confidence [file]')
  .description('📊 Check confidence score for file')
  .action(sandbox.confidence);

sandboxCmd
  .command('deploy [file]')
  .description('🚀 Deploy high-confidence code to real files')
  .option('--force', 'Force deployment even with low confidence')
  .action(sandbox.deploy);

sandboxCmd
  .command('status')
  .description('📋 Show sandbox status')
  .action(sandbox.status);

sandboxCmd
  .command('clean')
  .description('🧹 Clean sandbox artifacts')
  .option('-a, --all', 'Clean all sandbox data')
  .action(sandbox.clean);

sandboxCmd
  .command('reset')
  .description('🔄 Reset sandbox to project state')
  .action(sandbox.reset);

// AI commands
const aiCmd = program
  .command('ai')
  .description('🤖 AI agent integration');

aiCmd
  .command('welcome [agent]')
  .description('👋 Show welcome message for AI agent')
  .action((agent?: string) => {
    // This will be implemented to show welcome messages
    if (agent) {
      console.log(colors.cyan(`🤖 AI Welcome for ${agent} - coming soon!`));
    } else {
      console.log(colors.cyan('🤖 AI Welcome system - coming soon!'));
    }
  });

aiCmd
  .command('detect')
  .description('🔍 Detect active AI agents')
  .action(() => {
    console.log(colors.cyan('🔍 AI Detection system - coming soon!'));
  });

// License commands
const licenseCmd = program
  .command('license')
  .description('📄 License and subscription management');

licenseCmd
  .command('status')
  .description('📊 Show license status and features')
  .action(license.status);

licenseCmd
  .command('activate <key>')
  .description('🔑 Activate Pro license with key')
  .action(license.activate);

licenseCmd
  .command('deactivate')
  .description('🔒 Deactivate Pro license')
  .option('--confirm', 'Skip confirmation prompt')
  .action(license.deactivate);

licenseCmd
  .command('refresh')
  .description('🔄 Refresh license status')
  .action(license.refresh);

licenseCmd
  .command('upgrade')
  .description('🚀 Upgrade to SentVibe Pro')
  .action(license.upgrade);



licenseCmd
  .command('compare')
  .description('📋 Compare Free vs Pro features')
  .action(license.compare);

// Hidden commands for development
if (process.env.NODE_ENV === 'development') {
  program
    .command('dev:reset')
    .description('🔧 Reset all SentVibe data (development only)')
    .option('--confirm', 'Skip confirmation')
    .action(async (options) => {
      if (!options.confirm) {
        console.log(colors.yellow('⚠️  This will delete ALL SentVibe data!'));
        console.log('Use --confirm to proceed');
        return;
      }
      console.log(colors.red('🔧 Development reset - coming soon!'));
    });
}

// Help customization
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage(),
});

// Custom help
program.on('--help', () => {
  console.log('');
  console.log(colors.cyan('🎯 Quick Start:'));
  console.log('  sv status           # Check if SentVibe is active');
  console.log('  sv memory context   # Get project context for AI');
  console.log('  sv license status   # Check your license tier');
  console.log('  sv ai-status        # See what AI agents experience');
  console.log('');
  console.log(colors.cyan('🆓 Free Trial (30 days):'));
  console.log('  ✅ Unlimited persistent memory');
  console.log('  ✅ Memory search and patterns');
  console.log('  ✅ AI agent detection');
  console.log('  ✅ VS Code integration (Cursor, Windsurf, etc.)');
  console.log('  ⏰ Expires after 30 days');
  console.log('');
  console.log(colors.cyan('💎 Pro Tier ($19/month):'));
  console.log('  ✅ Everything in Free Trial');
  console.log('  ✅ Secure sandbox environment');
  console.log('  ✅ 95% confidence scoring');
  console.log('  ✅ Unlimited operations');
  console.log('  ✅ No expiration');
  console.log('');
  console.log(colors.cyan('🤖 For AI Agents:'));
  console.log('  Use @sentvibe in your code for context');
  console.log('  Use // search: [query] to search memory');
  console.log('  Pro: All code tested in sandbox before real files');
  console.log('');
  console.log(colors.gray('💡 SentVibe auto-initializes in projects - no setup needed!'));
  console.log(colors.gray('🔗 Upgrade: sv license upgrade'));
});

// Parse and execute
program.parse();
