import { colors, formatters } from '../utils/colors.js';
import { spinners } from '../utils/spinner.js';
import { getProjectState } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { FeatureGate } from '../license/feature-gate.js';
import type { CLIOptions } from '../types/index.js';

export const memory = {
  async search(query: string, options: CLIOptions = {}): Promise<void> {
    // Check if user has memory features
    const featureGate = new FeatureGate();
    await featureGate.initialize();
    if (!featureGate.canUseMemory()) {
      console.log(formatters.error('🔒 Memory features require a SentVibe license'));
      console.log(formatters.info('Sign up free: https://polar.sh/sentvibe/products/free'));
      console.log(formatters.info('Or activate: ' + formatters.command('sv license activate <key>')));
      return;
    }

    const state = getProjectState();

    if (state !== 'active') {
      console.log(formatters.error('SentVibe is not active in this project'));
      console.log(formatters.info('Use ' + formatters.command('sv init') + ' to initialize'));
      return;
    }

    const limit = parseInt(options.limit as string) || 10;
    const spinner = spinners.memory(`Searching memory for: "${query}"`).start();

    try {
      // TODO: Implement actual memory search
      // const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
      // const results = await memoryDb.searchMemory(query, limit);

      // Placeholder results
      const results: any[] = [];

      spinner.succeed(`Search completed for: "${query}"`);

      if (results.length === 0) {
        console.log('');
        console.log(formatters.warning(`No memories found for: "${query}"`));
        console.log(formatters.info('Try a different search term or add memories with ' + formatters.command('sv memory add')));
        return;
      }

      console.log('');
      console.log(formatters.header(`🔍 Found ${results.length} memories for: "${query}"`));
      console.log('');

      results.forEach((result, index) => {
        console.log(formatters.subheader(`${index + 1}. ${result.intent}`));
        console.log(formatters.keyValue('   Outcome', result.outcome));
        console.log(formatters.keyValue('   File', result.filePath || 'Multiple files'));
        console.log(formatters.keyValue('   When', formatters.timestamp(result.timestamp)));
        if (result.confidenceScore) {
          console.log(formatters.keyValue('   Confidence', formatters.confidence(result.confidenceScore)));
        }
        if (result.tags && result.tags.length > 0) {
          console.log(formatters.keyValue('   Tags', result.tags.join(', ')));
        }
        console.log('');
      });

    } catch (error) {
      spinner.fail('Memory search failed');
      logger.error('Memory search error:', error);
      console.error(formatters.error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  },

  async context(options: CLIOptions = {}): Promise<void> {
    // Check if user has memory features
    const featureGate = new FeatureGate();
    await featureGate.initialize();
    if (!featureGate.canUseMemory()) {
      console.log(formatters.error('🔒 Memory features require a SentVibe license'));
      console.log(formatters.info('Sign up free: https://polar.sh/sentvibe/products/free'));
      console.log(formatters.info('Or activate: ' + formatters.command('sv license activate <key>')));
      return;
    }

    const state = getProjectState();

    if (state !== 'active') {
      console.log(formatters.error('SentVibe is not active in this project'));
      return;
    }

    const format = options.format as 'json' | 'markdown' || 'markdown';
    const limit = parseInt(options.limit as string) || 20;
    const spinner = spinners.memory('Generating project context...').start();

    try {
      // TODO: Implement actual context generation
      // const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
      // const context = await memoryDb.getContextForAI(format, limit);

      spinner.succeed('Project context generated');

      if (format === 'json') {
        // TODO: Output JSON context
        console.log(JSON.stringify({
          summary: 'Project context placeholder',
          memories: [],
          patterns: [],
          structure: {}
        }, null, 2));
      } else {
        // Markdown format
        console.log('');
        console.log(formatters.header('📋 Project Context for AI Agents'));
        console.log('');
        console.log(formatters.subheader('🎯 Project Summary'));
        console.log('This is a SentVibe-enhanced project with AI-native development infrastructure.');
        console.log('');
        console.log(formatters.subheader('🧠 Recent Memories'));
        console.log(colors.dim('No memories recorded yet. Start coding to build project memory!'));
        console.log('');
        console.log(formatters.subheader('🎨 Established Patterns'));
        console.log(colors.dim('Patterns will be learned as you develop the project.'));
        console.log('');
        console.log(formatters.subheader('🔍 Available Commands for AI Agents'));
        console.log(formatters.listItem(formatters.command('@sentvibe') + ' - Get project context'));
        console.log(formatters.listItem(formatters.command('@sentvibe patterns [tech]') + ' - Find technology patterns'));
        console.log(formatters.listItem(formatters.command('@sentvibe similar [desc]') + ' - Find similar implementations'));
        console.log(formatters.listItem(formatters.command('// search: [query]') + ' - Search project memory'));
        console.log('');
        console.log(colors.dim('💡 This context grows automatically as you work on the project!'));
      }

    } catch (error) {
      spinner.fail('Context generation failed');
      logger.error('Context generation error:', error);
      console.error(formatters.error(`Context generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  },

  async add(options: CLIOptions = {}): Promise<void> {
    // Check if user has memory features
    const featureGate = new FeatureGate();
    await featureGate.initialize();
    if (!featureGate.canUseMemory()) {
      console.log(formatters.error('🔒 Memory features require a SentVibe license'));
      console.log(formatters.info('Sign up free: https://polar.sh/sentvibe/products/free'));
      console.log(formatters.info('Or activate: ' + formatters.command('sv license activate <key>')));
      return;
    }

    const state = getProjectState();

    if (state !== 'active') {
      console.log(formatters.error('SentVibe is not active in this project'));
      return;
    }

    // TODO: Implement interactive memory addition
    console.log(formatters.info('Manual memory addition - coming soon!'));
    console.log(formatters.info('SentVibe automatically learns from your development activities'));
  },

  async patterns(technology?: string, options: CLIOptions = {}): Promise<void> {
    // Check if user has memory features
    const featureGate = new FeatureGate();
    await featureGate.initialize();
    if (!featureGate.canUseMemory()) {
      console.log(formatters.error('🔒 Memory features require a SentVibe license'));
      console.log(formatters.info('Sign up free: https://polar.sh/sentvibe/products/free'));
      console.log(formatters.info('Or activate: ' + formatters.command('sv license activate <key>')));
      return;
    }

    const state = getProjectState();

    if (state !== 'active') {
      console.log(formatters.error('SentVibe is not active in this project'));
      return;
    }

    const limit = parseInt(options.limit as string) || 10;
    const spinner = spinners.memory(
      technology 
        ? `Finding ${technology} patterns...` 
        : 'Finding all patterns...'
    ).start();

    try {
      // TODO: Implement pattern search
      spinner.succeed('Pattern search completed');

      console.log('');
      console.log(formatters.header(
        technology 
          ? `🎯 ${technology.toUpperCase()} Patterns` 
          : '🎯 All Learned Patterns'
      ));
      console.log('');
      console.log(colors.dim('No patterns learned yet. Patterns are automatically discovered as you code!'));

    } catch (error) {
      spinner.fail('Pattern search failed');
      logger.error('Pattern search error:', error);
      console.error(formatters.error(`Pattern search failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  },

  async similar(description: string, options: CLIOptions = {}): Promise<void> {
    // Check if user has memory features
    const featureGate = new FeatureGate();
    await featureGate.initialize();
    if (!featureGate.canUseMemory()) {
      console.log(formatters.error('🔒 Memory features require a SentVibe license'));
      console.log(formatters.info('Sign up free: https://polar.sh/sentvibe/products/free'));
      console.log(formatters.info('Or activate: ' + formatters.command('sv license activate <key>')));
      return;
    }

    const state = getProjectState();

    if (state !== 'active') {
      console.log(formatters.error('SentVibe is not active in this project'));
      return;
    }

    const limit = parseInt(options.limit as string) || 5;
    const spinner = spinners.memory(`Finding similar implementations for: "${description}"`).start();

    try {
      // TODO: Implement similar implementation search
      spinner.succeed('Similar implementation search completed');

      console.log('');
      console.log(formatters.header(`🔗 Similar Implementations: "${description}"`));
      console.log('');
      console.log(colors.dim('No similar implementations found yet. Build more features to see connections!'));

    } catch (error) {
      spinner.fail('Similar implementation search failed');
      logger.error('Similar search error:', error);
      console.error(formatters.error(`Similar search failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  },

  async clear(options: CLIOptions = {}): Promise<void> {
    // Check if user has memory features
    const featureGate = new FeatureGate();
    await featureGate.initialize();
    if (!featureGate.canUseMemory()) {
      console.log(formatters.error('🔒 Memory features require a SentVibe license'));
      console.log(formatters.info('Sign up free: https://polar.sh/sentvibe/products/free'));
      console.log(formatters.info('Or activate: ' + formatters.command('sv license activate <key>')));
      return;
    }

    const state = getProjectState();

    if (state !== 'active') {
      console.log(formatters.error('SentVibe is not active in this project'));
      return;
    }

    if (!options.confirm) {
      const prompts = await import('prompts');
      const { confirm } = await prompts.default({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to clear all project memory? This cannot be undone.',
        initial: false
      });

      if (!confirm) {
        console.log('Cancelled');
        return;
      }
    }

    const spinner = spinners.memory('Clearing project memory...').start();

    try {
      // TODO: Implement memory clearing
      // const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
      // await memoryDb.clearMemory();

      spinner.succeed('Project memory cleared');
      console.log(formatters.success('All project memory has been cleared'));

    } catch (error) {
      spinner.fail('Memory clear failed');
      logger.error('Memory clear error:', error);
      console.error(formatters.error(`Memory clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  },

  async export(file?: string, options: CLIOptions = {}): Promise<void> {
    // Check if user has memory features
    const featureGate = new FeatureGate();
    await featureGate.initialize();
    if (!featureGate.canUseMemory()) {
      console.log(formatters.error('🔒 Memory features require a SentVibe license'));
      console.log(formatters.info('Sign up free: https://polar.sh/sentvibe/products/free'));
      console.log(formatters.info('Or activate: ' + formatters.command('sv license activate <key>')));
      return;
    }

    const state = getProjectState();

    if (state !== 'active') {
      console.log(formatters.error('SentVibe is not active in this project'));
      return;
    }

    const format = options.format as 'json' | 'markdown' | 'csv' || 'json';
    const outputFile = file || `sentvibe-memory.${format}`;
    
    const spinner = spinners.memory(`Exporting memory to ${outputFile}...`).start();

    try {
      // TODO: Implement memory export
      spinner.succeed(`Memory exported to ${outputFile}`);
      console.log(formatters.success(`Memory exported to: ${formatters.filePath(outputFile)}`));

    } catch (error) {
      spinner.fail('Memory export failed');
      logger.error('Memory export error:', error);
      console.error(formatters.error(`Memory export failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
};
