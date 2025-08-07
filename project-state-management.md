# Project State Management System for SentVibe

## Overview: Seamless Enable/Disable Control

Vibe coders need simple commands to control SentVibe in their projects without complex configuration.

## 1. State Management Commands

### 1.1 Core Commands
```bash
sv status          # Show current SentVibe status for project
sv uninit          # Disable SentVibe for this project  
sv re-init         # Re-enable SentVibe for this project
sv ai-status       # Show what AI agents will see
sv reset           # Reset all SentVibe data and restart fresh
```

### 1.2 Command Implementations

#### sv status
```typescript
// src/commands/status.ts
export async function status(): Promise<void> {
  const projectPath = process.cwd();
  const configPath = join(projectPath, '.sentvibe/config.json');
  const isActive = existsSync(configPath);
  
  console.log(colors.cyan('🎯 SentVibe Project Status\n'));
  
  if (isActive) {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const memory = new ProjectMemory(join(projectPath, '.sentvibe/memory.db'));
    const stats = await memory.getStats();
    
    console.log(colors.green('✅ SentVibe is ACTIVE'));
    console.log(`   📅 Initialized: ${new Date(config.created).toLocaleDateString()}`);
    console.log(`   🧠 Memories: ${stats.totalEntries}`);
    console.log(`   📁 Files tracked: ${stats.filesTracked}`);
    console.log(`   🤖 AI interactions: ${stats.aiInteractions}`);
    console.log(`   🛡️ Sandbox sessions: ${stats.sandboxSessions}`);
    console.log(`   📊 Avg confidence: ${stats.avgConfidence}%`);
    
    // Show active AI agents
    const activeAIs = await detectActiveAIAgents();
    if (activeAIs.length > 0) {
      console.log(`   🤖 Active AI agents: ${activeAIs.join(', ')}`);
    }
  } else {
    console.log(colors.yellow('⚠️  SentVibe is INACTIVE'));
    console.log('   Run "sv re-init" to enable SentVibe for this project');
  }
  
  console.log('\nCommands:');
  console.log('  sv uninit    - Disable SentVibe');
  console.log('  sv re-init   - Enable SentVibe');
  console.log('  sv ai-status - Show AI agent view');
}
```

#### sv uninit
```typescript
// src/commands/uninit.ts
export async function uninit(options: { confirm?: boolean }): Promise<void> {
  const projectPath = process.cwd();
  const configPath = join(projectPath, '.sentvibe/config.json');
  
  if (!existsSync(configPath)) {
    console.log(colors.yellow('SentVibe is not active in this project'));
    return;
  }
  
  if (!options.confirm) {
    const { confirm } = await prompts({
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
  
  const spin = spinner('Disabling SentVibe...').start();
  
  try {
    // Stop any running services
    await stopServices(projectPath);
    
    // Move .sentvibe to .sentvibe.disabled
    const sentvibeDir = join(projectPath, '.sentvibe');
    const disabledDir = join(projectPath, '.sentvibe.disabled');
    
    if (existsSync(disabledDir)) {
      await fs.rm(disabledDir, { recursive: true });
    }
    
    await fs.rename(sentvibeDir, disabledDir);
    
    // Remove VS Code integration
    await removeVSCodeIntegration(projectPath);
    
    spin.succeed('SentVibe disabled for this project');
    
    console.log('\n📝 Note:');
    console.log('  • Memory and settings preserved in .sentvibe.disabled/');
    console.log('  • Run "sv re-init" to re-enable with all data intact');
    console.log('  • AI agents will no longer see SentVibe features');
    
  } catch (error) {
    spin.fail('Failed to disable SentVibe');
    console.error(colors.red(error.message));
  }
}
```

#### sv re-init
```typescript
// src/commands/re-init.ts
export async function reInit(): Promise<void> {
  const projectPath = process.cwd();
  const disabledDir = join(projectPath, '.sentvibe.disabled');
  const activeDir = join(projectPath, '.sentvibe');
  
  const spin = spinner('Re-enabling SentVibe...').start();
  
  try {
    if (existsSync(disabledDir)) {
      // Restore from disabled state
      if (existsSync(activeDir)) {
        await fs.rm(activeDir, { recursive: true });
      }
      
      await fs.rename(disabledDir, activeDir);
      
      // Update configuration timestamp
      const configPath = join(activeDir, 'config.json');
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      config.reactivated = new Date().toISOString();
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      spin.text = 'Restoring memory and settings...';
      
    } else {
      // Fresh initialization
      spin.text = 'Initializing fresh SentVibe setup...';
      await init({ force: false });
    }
    
    // Restart services
    await setupVSCodeIntegration(projectPath);
    
    // Initialize memory system
    const memory = new ProjectMemory(join(activeDir, 'memory.db'));
    await memory.initialize();
    
    // Show welcome message for any active AI agents
    await showAIWelcomeMessages();
    
    spin.succeed('SentVibe re-enabled successfully!');
    
    console.log('\n🎉 Welcome back to SentVibe!');
    console.log('  • All previous memory and settings restored');
    console.log('  • AI agents will now see enhanced environment');
    console.log('  • Run "sv status" to see current state');
    
  } catch (error) {
    spin.fail('Failed to re-enable SentVibe');
    console.error(colors.red(error.message));
  }
}
```

#### sv ai-status
```typescript
// src/commands/ai-status.ts
export async function aiStatus(): Promise<void> {
  const projectPath = process.cwd();
  const isActive = existsSync(join(projectPath, '.sentvibe/config.json'));
  
  console.log(colors.cyan('🤖 AI Agent View of This Project\n'));
  
  if (!isActive) {
    console.log(colors.gray('❌ SentVibe Inactive'));
    console.log('   AI agents see: Standard project (no enhancements)');
    console.log('   No persistent memory, no sandbox, no confidence scoring');
    return;
  }
  
  console.log(colors.green('✅ SentVibe Active - AI agents see:'));
  
  // Show what each AI agent type would see
  const activeAIs = await detectActiveAIAgents();
  
  if (activeAIs.length === 0) {
    console.log('   🔍 No active AI agents detected');
    console.log('   When an AI agent connects, they will see:');
  }
  
  console.log('\n🧠 Persistent Memory System:');
  const memory = new ProjectMemory(join(projectPath, '.sentvibe/memory.db'));
  const stats = await memory.getStats();
  console.log(`   • ${stats.totalEntries} memories available`);
  console.log(`   • Project patterns learned and accessible`);
  console.log(`   • Context available via @sentvibe triggers`);
  
  console.log('\n🛡️ Secure Sandbox Environment:');
  console.log('   • All code tested before touching real files');
  console.log('   • 95% confidence threshold for deployment');
  console.log('   • Safe experimentation environment');
  
  console.log('\n🔍 Enhanced Context Access:');
  console.log('   • @sentvibe - Get project context');
  console.log('   • @sentvibe patterns [tech] - Find patterns');
  console.log('   • @sentvibe similar [desc] - Find similar code');
  console.log('   • // search: [query] - Search memory');
  
  console.log('\n🚀 AI-Optimized Workflow:');
  console.log('   • Memory-first development approach');
  console.log('   • Confidence-based deployment gates');
  console.log('   • Automatic pattern learning');
  console.log('   • Risk-free experimentation');
  
  // Show AI-specific features
  for (const aiType of activeAIs) {
    console.log(`\n🎯 ${aiType.toUpperCase()}-Specific Features:`);
    const features = getAISpecificFeatures(aiType);
    features.forEach(feature => console.log(`   • ${feature}`));
  }
}
```

## 2. Auto-Initialization Logic

### 2.1 Workspace Detection
```typescript
// src/auto-init/detector.ts
class WorkspaceDetector {
  private initialized = new Set<string>();
  
  async detectWorkspaceChange(): Promise<void> {
    const currentPath = process.cwd();
    
    if (this.initialized.has(currentPath)) return;
    
    // Check if SentVibe should be active
    const shouldActivate = await this.shouldAutoActivate(currentPath);
    
    if (shouldActivate) {
      await this.silentActivation(currentPath);
      this.initialized.add(currentPath);
    }
  }
  
  private async shouldAutoActivate(projectPath: string): Promise<boolean> {
    // Check for disabled state
    if (existsSync(join(projectPath, '.sentvibe.disabled'))) {
      return false; // User explicitly disabled
    }
    
    // Check for existing active state
    if (existsSync(join(projectPath, '.sentvibe'))) {
      return true; // Already active
    }
    
    // Check for project indicators
    const projectIndicators = [
      'package.json',
      'requirements.txt', 
      'Cargo.toml',
      'go.mod',
      '.git'
    ];
    
    return projectIndicators.some(indicator => 
      existsSync(join(projectPath, indicator))
    );
  }
  
  private async silentActivation(projectPath: string): Promise<void> {
    // Initialize without user interaction
    await init({ force: false, silent: true });
    
    // Show AI welcome if agents are detected
    setTimeout(async () => {
      await showAIWelcomeMessages();
    }, 1000);
  }
}
```

## 3. State Persistence

### 3.1 Configuration States
```typescript
interface ProjectState {
  status: 'active' | 'disabled' | 'never-initialized';
  created?: string;
  disabled?: string;
  reactivated?: string;
  userPreference: 'auto' | 'manual' | 'disabled';
  aiAgentsWelcomed: string[];
}

class StateManager {
  async getProjectState(projectPath: string): Promise<ProjectState> {
    const activeConfig = join(projectPath, '.sentvibe/config.json');
    const disabledConfig = join(projectPath, '.sentvibe.disabled/config.json');
    
    if (existsSync(activeConfig)) {
      const config = JSON.parse(readFileSync(activeConfig, 'utf8'));
      return { ...config, status: 'active' };
    }
    
    if (existsSync(disabledConfig)) {
      const config = JSON.parse(readFileSync(disabledConfig, 'utf8'));
      return { ...config, status: 'disabled' };
    }
    
    return { 
      status: 'never-initialized',
      userPreference: 'auto',
      aiAgentsWelcomed: []
    };
  }
}
```

This system gives vibe coders complete control over SentVibe while maintaining the seamless AI experience when active!
