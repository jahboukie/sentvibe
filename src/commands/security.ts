import { SecurityTestSuite } from '../security/security-test-suite.js';
import { SecurityManager } from '../security/security-manager.js';
import { ProjectMemory } from '../memory/project-memory.js';
import { colors, formatters } from '../utils/colors.js';
import { logger } from '../utils/logger.js';
import { join } from 'path';

/**
 * Security commands for SentVibe
 */
export class SecurityCommands {
  
  /**
   * Run comprehensive security test suite
   */
  async test(options: { verbose?: boolean } = {}): Promise<void> {
    console.log(formatters.header('🔒 SentVibe Security Test Suite'));
    console.log('');

    try {
      const testSuite = new SecurityTestSuite();
      const results = await testSuite.runAllTests();

      console.log('');
      console.log(formatters.subheader('📊 Test Results Summary'));
      
      if (results.passed) {
        console.log(formatters.success(`All ${results.totalTests} security tests passed!`));
        console.log(colors.success('✅ SentVibe memory system is secure'));
      } else {
        console.log(formatters.error(`${results.failedTests}/${results.totalTests} tests failed`));
        console.log(colors.error('❌ Security vulnerabilities detected'));
        
        if (results.securityIssues.length > 0) {
          console.log('');
          console.log(formatters.subheader('🚨 Security Issues:'));
          results.securityIssues.forEach(issue => {
            console.log(formatters.listItem(colors.error(issue)));
          });
        }

        if (results.recommendations.length > 0) {
          console.log('');
          console.log(formatters.subheader('💡 Recommendations:'));
          results.recommendations.forEach(rec => {
            console.log(formatters.listItem(colors.info(rec)));
          });
        }
      }

      if (options.verbose) {
        console.log('');
        console.log(formatters.subheader('📋 Detailed Test Results:'));
        results.testResults.forEach(test => {
          const status = test.passed ? colors.success('✅') : colors.error('❌');
          const error = test.error ? ` - ${colors.dim(test.error)}` : '';
          console.log(`  ${status} ${test.name}${error}`);
        });
      }

    } catch (error) {
      console.log(formatters.error('Security test suite failed to run'));
      logger.error('Security test error:', error);
      process.exit(1);
    }
  }

  /**
   * Check current security status
   */
  async status(): Promise<void> {
    console.log(formatters.header('🔒 SentVibe Security Status'));
    console.log('');

    try {
      const projectRoot = process.cwd();
      const memoryDbPath = join(projectRoot, '.sentvibe', 'memory.db');
      
      // Initialize memory system to get security status
      const memory = new ProjectMemory(memoryDbPath);
      await memory.initialize();

      const securityStatus = memory.getSecurityStatus();

      console.log(formatters.subheader('🛡️ Security Features'));
      console.log(formatters.listItem(`Encryption: ${securityStatus.encryptionEnabled ? colors.success('✅ Enabled') : colors.error('❌ Disabled')}`));
      console.log(formatters.listItem(`Content Sanitization: ${securityStatus.contentSanitizationEnabled ? colors.success('✅ Enabled') : colors.error('❌ Disabled')}`));
      console.log(formatters.listItem(`File Access Control: ${securityStatus.fileAccessControlEnabled ? colors.success('✅ Enabled') : colors.error('❌ Disabled')}`));
      console.log(formatters.listItem(`Strict Mode: ${securityStatus.strictModeEnabled ? colors.warning('⚠️ Enabled') : colors.info('ℹ️ Disabled')}`));

      console.log('');
      console.log(formatters.subheader('🔐 Encryption Status'));
      if (securityStatus.encryptionStatus.isInitialized) {
        console.log(formatters.listItem(`Algorithm: ${colors.info(securityStatus.encryptionStatus.algorithm)}`));
        console.log(formatters.listItem(`Key Length: ${colors.info(securityStatus.encryptionStatus.keyLength + ' bits')}`));
        console.log(formatters.listItem(`Key File: ${securityStatus.encryptionStatus.hasKeyFile ? colors.success('✅ Present') : colors.error('❌ Missing')}`));
      } else {
        console.log(formatters.listItem(colors.error('❌ Encryption not initialized')));
      }

      console.log('');
      console.log(formatters.subheader('📁 File Access Control'));
      console.log(formatters.listItem(`Allowed Extensions: ${colors.info(securityStatus.allowedExtensions.length + ' types')}`));
      console.log(formatters.listItem(`Blocked Paths: ${colors.info(securityStatus.blockedPaths.length + ' patterns')}`));
      console.log(formatters.listItem(`Max File Size: ${colors.info(Math.round(securityStatus.maxFileSize / 1024 / 1024) + ' MB')}`));

      console.log('');
      console.log(formatters.subheader('🔍 Overall Security'));
      if (securityStatus.isSecure) {
        console.log(formatters.success('✅ Memory system is secure'));
        console.log(colors.dim(`Security Version: ${securityStatus.securityVersion}`));
      } else {
        console.log(formatters.error('❌ Security issues detected'));
        console.log(formatters.info('Run: ' + formatters.command('sv security test') + ' for detailed analysis'));
      }

      await memory.cleanup();

    } catch (error) {
      console.log(formatters.error('Failed to check security status'));
      logger.error('Security status error:', error);
    }
  }

  /**
   * Run security self-test on current project
   */
  async selftest(): Promise<void> {
    console.log(formatters.header('🔍 Security Self-Test'));
    console.log('');

    try {
      const projectRoot = process.cwd();
      const memoryDbPath = join(projectRoot, '.sentvibe', 'memory.db');
      
      const memory = new ProjectMemory(memoryDbPath);
      await memory.initialize();

      console.log('Running security self-test...');
      const results = await memory.runSecuritySelfTest();

      console.log('');
      if (results.passed) {
        console.log(formatters.success('✅ All security self-tests passed'));
      } else {
        console.log(formatters.error('❌ Security self-test failed'));
        
        console.log('');
        console.log(formatters.subheader('📋 Test Results:'));
        results.tests.forEach(test => {
          const status = test.passed ? colors.success('✅') : colors.error('❌');
          const error = test.error ? ` - ${colors.dim(test.error)}` : '';
          console.log(`  ${status} ${test.name}${error}`);
        });

        if (results.issues.length > 0) {
          console.log('');
          console.log(formatters.subheader('🚨 Issues:'));
          results.issues.forEach(issue => {
            console.log(formatters.listItem(colors.error(issue)));
          });
        }

        if (results.recommendations.length > 0) {
          console.log('');
          console.log(formatters.subheader('💡 Recommendations:'));
          results.recommendations.forEach(rec => {
            console.log(formatters.listItem(colors.info(rec)));
          });
        }
      }

      await memory.cleanup();

    } catch (error) {
      console.log(formatters.error('Security self-test failed to run'));
      logger.error('Security self-test error:', error);
    }
  }

  /**
   * Show security configuration
   */
  async config(): Promise<void> {
    console.log(formatters.header('⚙️ Security Configuration'));
    console.log('');

    try {
      const projectRoot = process.cwd();
      const securityManager = new SecurityManager(projectRoot);
      await securityManager.initialize();

      const status = securityManager.getSecurityStatus();

      console.log(formatters.subheader('🔧 Current Configuration'));
      console.log(formatters.listItem(`Content Sanitization: ${status.contentSanitizationEnabled ? 'Enabled' : 'Disabled'}`));
      console.log(formatters.listItem(`File Access Control: ${status.fileAccessControlEnabled ? 'Enabled' : 'Disabled'}`));
      console.log(formatters.listItem(`Database Encryption: ${status.encryptionEnabled ? 'Enabled' : 'Disabled'}`));
      console.log(formatters.listItem(`Strict Mode: ${status.strictModeEnabled ? 'Enabled' : 'Disabled'}`));

      console.log('');
      console.log(formatters.subheader('📁 File Access Rules'));
      console.log(formatters.listItem(`Allowed Extensions: ${status.allowedExtensions.join(', ')}`));
      console.log(formatters.listItem(`Max File Size: ${Math.round(status.maxFileSize / 1024 / 1024)} MB`));
      
      console.log('');
      console.log(formatters.subheader('🚫 Blocked Paths'));
      status.blockedPaths.slice(0, 10).forEach(path => {
        console.log(formatters.listItem(colors.dim(path)));
      });
      if (status.blockedPaths.length > 10) {
        console.log(formatters.listItem(colors.dim(`... and ${status.blockedPaths.length - 10} more`)));
      }

      console.log('');
      console.log(formatters.info('💡 To modify security settings, edit .sentvibe/config.json'));

      await securityManager.cleanup();

    } catch (error) {
      console.log(formatters.error('Failed to load security configuration'));
      logger.error('Security config error:', error);
    }
  }

  /**
   * Show security help
   */
  help(): void {
    console.log(formatters.header('🔒 SentVibe Security Commands'));
    console.log('');
    console.log(formatters.subheader('Available Commands:'));
    console.log(formatters.listItem(formatters.command('sv security status') + ' - Show current security status'));
    console.log(formatters.listItem(formatters.command('sv security test') + ' - Run comprehensive security test suite'));
    console.log(formatters.listItem(formatters.command('sv security selftest') + ' - Run security self-test on current project'));
    console.log(formatters.listItem(formatters.command('sv security config') + ' - Show security configuration'));
    console.log('');
    console.log(formatters.subheader('Options:'));
    console.log(formatters.listItem('--verbose - Show detailed test results'));
    console.log('');
    console.log(colors.dim('💡 Security features protect your code and sensitive data from exposure'));
  }
}
