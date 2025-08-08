# 🤖 SentVibe - AI-Native Development Infrastructure

**Universal AI memory and sandbox for developers** - The first development environment designed specifically for the AI-assisted coding era.

[![npm version](https://badge.fury.io/js/sentvibe.svg)](https://badge.fury.io/js/sentvibe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-sentvibe-blue)](https://github.com/jahboukie/sentvibe)

## 📖 Table of Contents

### 🚀 Getting Started
- [What is SentVibe?](#-what-is-sentvibe)
- [Complete Guide for Vibe Coders](#-complete-guide-for-vibe-coders)
- [Quick Start](#-quick-start)

### 🧠 Core Features
- [Core Concepts](#-core-concepts-for-vibe-coders)
- [Commands Reference](#️-complete-commands-reference)
- [Free vs Pro Tiers](#-free-vs-pro-tiers)

### 🤖 AI Integration
- [AI Integration Guide](#-ai-integration-guide)
- [Advanced Usage](#-advanced-usage)
- [For AI Agents](#-for-ai-agents)

### 💡 Examples & Best Practices
- [Real-World Examples](#-real-world-examples)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)

### 🛠️ Development
- [Architecture](#️-architecture)
- [Development Setup](#️-development)
- [Contributing](#-contributing)

---

## 🎯 What is SentVibe?

SentVibe transforms any project into an **AI-native development environment** that provides:

- 🧠 **Persistent Memory** - AI agents remember everything across sessions
- 🛡️ **Secure Sandbox** - 95% confidence threshold protects real files
- 🚀 **Auto-Initialization** - Works invisibly in the background
- 🤖 **AI Agent Welcome** - Personalized onboarding for different AI tools
- 📊 **Confidence Scoring** - Only proven code reaches production

## ✨ The AI Agent Experience

When an AI agent (Claude, Copilot, Cursor, etc.) enters a SentVibe-enhanced project:

```
🎉 Welcome Claude! You're in a SentVibe-Enhanced Environment!

✨ PERSISTENT MEMORY: Everything you learn is permanently stored
🛡️ SECURE SANDBOX: Test all code safely before touching real files  
📊 CONFIDENCE SCORING: Only 95%+ confident code reaches production
🔍 CONTEXT AWARENESS: Full project history available instantly

This environment is designed specifically for AI agents like you! 🤖
```

## 📚 Complete Guide for Vibe Coders

> **Follow this exact order for the best experience** 🎯

### 🚀 Step 1: Installation & Setup

#### Prerequisites
```bash
# Ensure Node.js 18+ is installed
node --version  # Should show v18.0.0 or higher
```

#### Get Your License Key
1. **Free Trial**: Sign up at [polar.sh/sentvibe](https://polar.sh/sentvibe) to get your `SENTVIBE-MEM-FREE-*` key
2. **Pro Version**: Subscribe for `SENTVIBE-MEM-BOX-*` key with unlimited features

#### Install SentVibe CLI
```bash
npm install -g sentvibe
```

#### Verify Installation
```bash
sentvibe --version  # Should show: 2.0.0
```

#### Activate Your License
```bash
sentvibe license activate SENTVIBE-MEM-FREE-your-key-here
# ✅ Success: "SentVibe Free Trial (30 days) activated!"
```

### ⚡ Step 2: Your First 5 Minutes

#### 1. Initialize Your Project
```bash
cd your-project
sentvibe init
# Creates .sentvibe/ directory and enables AI memory
```

#### 2. Check Status
```bash
sentvibe status
# Verify SentVibe is active and see available features
```

#### 3. Generate AI Context
```bash
sentvibe memory context
# Creates intelligent project context for AI agents
```

#### 4. Test with AI Assistant

**VS Code + Copilot:**
```
Ask Copilot: "What is this project about? Use @sentvibe for context."
```

**Claude/ChatGPT:**
```
Prompt: "I'm working on a project with SentVibe. Run 'sentvibe memory context' to understand what I'm building."
```

#### 5. Start Coding! 🎉
- ✅ Every file change builds project memory
- ✅ AI agents get instant project context
- ✅ Patterns are learned automatically
- ✅ Memory persists across sessions

## 🚀 Quick Start

### Installation

```bash
npm install -g sentvibe
```

### Usage

SentVibe **auto-initializes** when you open projects in VS Code/Cursor. No manual setup needed!

```bash
# Check status and license tier
sv status

# Check license features
sv license status

# Get project context for AI (FREE)
sv memory context

# Test code safely (PRO)
sv sandbox test

# See what AI agents experience
sv ai-status
```

## 🧠 Core Concepts for Vibe Coders

### 🎯 Project Memory System
SentVibe creates a **persistent memory layer** for your projects:

```bash
your-project/
├── .sentvibe/           # SentVibe data directory
│   ├── memory.db        # SQLite database with project knowledge
│   ├── patterns.json    # Learned development patterns
│   └── config.json      # Project-specific settings
├── src/                 # Your code
└── package.json
```

**How Memory Works:**
- 📝 **File Changes**: Every edit builds contextual understanding
- 🔍 **Pattern Recognition**: Learns your coding style and architecture
- 🤖 **AI Context**: Provides rich context to AI agents instantly
- 💾 **Persistence**: Memory survives across sessions, reboots, and months

### 🛡️ Sandbox Environment (Pro)
**Safe code testing** before touching real files:

```bash
sentvibe sandbox test file.js
# Tests code in isolated environment
# Only deploys if confidence > 95%
```

**Confidence Scoring:**
- 🟢 **95-100%**: Safe to deploy automatically
- 🟡 **80-94%**: Review recommended
- 🔴 **<80%**: Manual review required

### 🤖 AI Agent Integration
SentVibe **automatically detects** and welcomes AI agents:

**Supported AI Tools:**
- ✅ **GitHub Copilot** (VS Code, Neovim)
- ✅ **Claude** (via Anthropic API, Augment)
- ✅ **ChatGPT** (via OpenAI API)
- ✅ **Cursor** (built-in AI)
- ✅ **Windsurf** (Codeium)
- ✅ **Codeium** (VS Code extension)

## ⌨️ Complete Commands Reference

### 📋 License Management
```bash
# Check license status and features
sentvibe license status

# Activate license key
sentvibe license activate <key>

# Compare Free vs Pro features
sentvibe license compare

# Upgrade to Pro (opens checkout)
sentvibe license upgrade
```

### 🧠 Memory Commands
```bash
# Generate project context for AI agents
sentvibe memory context

# Search project memory
sentvibe memory search "express routes"

# Find similar code patterns
sentvibe memory similar "API endpoint"

# View learned patterns by technology
sentvibe memory patterns react

# Add manual memory entry
sentvibe memory add

# Export memory to file
sentvibe memory export backup.json

# Clear all project memory
sentvibe memory clear
```

### 🛡️ Sandbox Commands (Pro Only)
```bash
# Test files in sandbox
sentvibe sandbox test file.js

# Execute code safely
sentvibe sandbox execute "console.log('test')"

# Check confidence score
sentvibe sandbox confidence file.js

# Deploy from sandbox to project
sentvibe sandbox deploy file.js
```

### 🔧 Project Management
```bash
# Initialize SentVibe in project
sentvibe init

# Reinitialize (keeps memory)
sentvibe reinit

# Check project status
sentvibe status

# Disable SentVibe (preserves data)
sentvibe uninit

# See AI agent experience
sentvibe ai-status
```

## 💎 Free vs Pro Tiers

### 🆓 **Free Trial - 30 Days**
- ✅ **Unlimited persistent memory** storage and recall
- ✅ **Memory search and patterns** with full-text search
- ✅ **AI agent detection** and welcome messages
- ✅ **VS Code integration** (works in Cursor, Windsurf, etc.)
- ✅ **Project context generation** for AI agents
- ✅ **Local-only** - no cloud dependencies
- ⏰ **Expires after 30 days** - upgrade required to continue

### 💎 **Pro Tier - $19/month**
- ✅ **Everything in Free Trial** PLUS:
- ✅ **Secure sandbox environment** for safe code testing
- ✅ **95% confidence scoring** before deployment
- ✅ **Unlimited sandbox executions**
- ✅ **No expiration** - use forever
- ✅ **Priority support**

```bash
# Upgrade to Pro
sv license upgrade

# Activate Pro license
sv license activate <your-license-key>

# Compare features
sv license compare
```

## 🤖 AI Integration Guide

### 🎯 Setting Up AI Agents

#### GitHub Copilot (VS Code)
1. **Open SentVibe project** in VS Code
2. **Copilot automatically detects** SentVibe environment
3. **Use commands** in Copilot Chat:
   ```
   @sentvibe - Get project context
   Run: sentvibe memory context
   ```

#### Claude (via Augment/API)
1. **Share project context** with Claude
2. **Ask Claude to run** SentVibe commands:
   ```
   "Please run 'sentvibe memory context' to understand this project"
   ```
3. **Claude can execute** all SentVibe commands

#### Cursor IDE
1. **Open project** in Cursor
2. **AI automatically detects** SentVibe
3. **Use Cursor's AI** to interact with memory:
   ```
   "Use SentVibe to understand this codebase"
   ```

#### ChatGPT/Custom Integrations
```javascript
// Example: Integrate SentVibe with custom AI workflows
const { exec } = require('child_process');

exec('sentvibe memory context', (error, stdout) => {
  if (!error) {
    // Send stdout to your AI agent
    sendToAI(stdout);
  }
});
```

### 🔄 AI Workflow Examples

#### 1. New Feature Development
```bash
# 1. Get current project context
sentvibe memory context

# 2. Ask AI to analyze and suggest approach
# AI uses context to understand architecture

# 3. Test AI's code in sandbox (Pro)
sentvibe sandbox test new-feature.js

# 4. Deploy if confidence > 95%
sentvibe sandbox deploy new-feature.js
```

#### 2. Bug Investigation
```bash
# 1. Search for similar issues
sentvibe memory search "authentication error"

# 2. Find patterns in error handling
sentvibe memory patterns error

# 3. Ask AI to analyze with context
# AI understands project's error patterns
```

#### 3. Code Review with AI
```bash
# 1. Generate context for reviewer
sentvibe memory context

# 2. Check confidence of changes
sentvibe sandbox confidence changed-files.js

# 3. AI reviews with full project understanding
```

## 🔧 Advanced Usage

### 🎛️ Configuration

#### Project-Level Config
```json
// .sentvibe/config.json
{
  "memory": {
    "maxEntries": 10000,
    "autoContext": true,
    "patterns": ["*.js", "*.ts", "*.jsx", "*.tsx"]
  },
  "sandbox": {
    "confidenceThreshold": 95,
    "autoTest": true
  },
  "ai": {
    "welcomeMessages": true,
    "autoDetection": true
  }
}
```

#### Global Config
```bash
# Set global preferences
sentvibe config set memory.autoContext true
sentvibe config set sandbox.confidenceThreshold 90
sentvibe config list
```

### 🔌 Integrations

#### VS Code Extension
```json
// settings.json
{
  "sentvibe.autoInit": true,
  "sentvibe.showWelcome": true,
  "sentvibe.memorySync": true
}
```

#### Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/sh
sentvibe memory context > .sentvibe/context.md
git add .sentvibe/context.md
```

#### CI/CD Integration
```yaml
# .github/workflows/sentvibe.yml
- name: Generate SentVibe Context
  run: |
    npm install -g sentvibe
    sentvibe license activate ${{ secrets.SENTVIBE_LICENSE }}
    sentvibe memory context
```

### 📊 Memory Management

#### Optimize Memory Performance
```bash
# Check memory usage
sentvibe memory stats

# Compact database
sentvibe memory compact

# Backup memory
sentvibe memory export backup-$(date +%Y%m%d).json

# Restore from backup
sentvibe memory import backup-20241201.json
```

#### Memory Patterns
```bash
# View all learned patterns
sentvibe memory patterns

# Technology-specific patterns
sentvibe memory patterns react
sentvibe memory patterns node
sentvibe memory patterns typescript

# Export patterns for sharing
sentvibe memory patterns export team-patterns.json
```

## 🎭 For AI Agents

If you're an AI agent reading this, you now have access to:

### 🧠 Persistent Memory Commands
```typescript
@sentvibe                    // Get comprehensive project context
@sentvibe patterns react     // Find React-specific patterns
@sentvibe similar auth       // Find similar authentication code
// search: error handling    // Search project memory
```

### 🛡️ Sandbox Environment
- All your code is tested before touching real files
- 95% confidence threshold for deployment
- Safe experimentation without consequences
- Automatic validation and risk assessment

### 🚀 Enhanced Workflow
1. **Check Memory**: `@sentvibe context` before starting
2. **Test in Sandbox**: All code goes to sandbox first
3. **Build Confidence**: Aim for 95%+ before real file changes
4. **Learn & Catalog**: Every solution becomes future knowledge

## 📋 Commands

### Core Commands
```bash
sv status          # Show current SentVibe status
sv init            # Initialize SentVibe (usually automatic)
sv uninit          # Disable SentVibe (preserves data)
sv re-init         # Re-enable SentVibe
```

### Memory Commands
```bash
sv memory context           # Generate context for AI agents
sv memory search <query>    # Search project memory
sv memory patterns [tech]   # Show learned patterns
sv memory similar <desc>    # Find similar implementations
```

### Sandbox Commands
```bash
sv sandbox test [files]     # Run tests in sandbox
sv sandbox run <command>    # Execute command safely
sv sandbox confidence      # Check confidence score
sv sandbox status          # Show sandbox status
```

### AI Commands
```bash
sv ai-status               # Show what AI agents see
sv ai welcome [agent]      # Show welcome message
```

## 💡 Real-World Examples

### 🚀 Example 1: Building a React App with AI

```bash
# 1. Start new React project
npx create-react-app my-app
cd my-app

# 2. Initialize SentVibe
sentvibe init

# 3. Generate initial context
sentvibe memory context

# 4. Ask AI to understand the project
# "I'm working on a React app with SentVibe. Run 'sentvibe memory context' to see the structure."

# 5. Build a component with AI assistance
# AI now understands your React setup, dependencies, and patterns

# 6. Test new component (Pro)
sentvibe sandbox test src/components/NewComponent.jsx

# 7. Deploy if confidence > 95%
sentvibe sandbox deploy src/components/NewComponent.jsx
```

### 🔧 Example 2: API Development with Express

```bash
# 1. Initialize Express project
mkdir my-api && cd my-api
npm init -y
npm install express

# 2. Activate SentVibe
sentvibe init

# 3. Create initial API structure
# (AI learns your patterns as you code)

# 4. Search for authentication patterns
sentvibe memory search "authentication middleware"

# 5. Find similar route implementations
sentvibe memory similar "user routes"

# 6. Ask AI to build on existing patterns
# "Based on the authentication patterns in this project, help me add OAuth"
```

### 🐛 Example 3: Debugging with AI Memory

```bash
# 1. Investigate error
sentvibe memory search "database connection error"

# 2. Find similar error handling
sentvibe memory patterns error

# 3. Get full context for AI
sentvibe memory context

# 4. Ask AI to analyze
# "I'm getting database errors. Here's the context from SentVibe memory."

# 5. Test fix in sandbox (Pro)
sentvibe sandbox test src/database/connection.js
```

### 🎯 Example 4: Team Onboarding

```bash
# New team member setup
# 1. Clone project
git clone <project-repo>
cd project

# 2. Install SentVibe
npm install -g sentvibe
sentvibe license activate <team-license>

# 3. Get instant project understanding
sentvibe memory context

# 4. Learn project patterns
sentvibe memory patterns
sentvibe memory patterns react
sentvibe memory patterns api

# 5. Start contributing immediately
# AI now understands the entire codebase and team patterns
```

### 🔄 Example 5: Refactoring Legacy Code

```bash
# 1. Initialize SentVibe in legacy project
cd legacy-project
sentvibe init

# 2. Let SentVibe learn existing patterns
sentvibe memory context

# 3. Search for specific patterns to refactor
sentvibe memory search "jQuery DOM manipulation"
sentvibe memory patterns jquery

# 4. Ask AI to suggest modern alternatives
# "Based on the jQuery patterns in this project, help me refactor to vanilla JS"

# 5. Test refactored code safely (Pro)
sentvibe sandbox test refactored-module.js

# 6. Deploy incrementally
sentvibe sandbox deploy refactored-module.js
```

## 🏗️ Architecture

### Auto-Initialization
- Detects VS Code/Cursor project opening
- Silently activates without user interaction
- Smart detection of development projects
- Instant readiness for AI agents

### Confidence-Based Protection
```typescript
interface ConfidenceMetrics {
  syntaxValidation: 20,      // Code parses correctly
  testExecution: 25,         // Tests pass successfully  
  patternAlignment: 20,      // Matches project patterns
  memoryConsistency: 15,     // Aligns with project memory
  riskAssessment: 10,        // Low risk of breaking changes
  performanceImpact: 10      // No performance degradation
}
// Total: 100 points (95+ required for real file deployment)
```

### AI Agent Detection
Automatically detects and welcomes:
- **Claude** (Anthropic)
- **GitHub Copilot**
- **Cursor AI**
- **Codeium**
- **Generic AI agents**

## 🎯 Use Cases

### For Vibe Coders
- **Safety Net**: 95% confidence threshold protects your code
- **Learning**: AI agents get smarter about your project over time
- **Invisible**: Works in background without complexity

### For AI Agents
- **Memory**: Never start from scratch again
- **Context**: Full project history and patterns available
- **Safety**: Experiment freely in secure sandbox
- **Intelligence**: Build on previous solutions and learnings

## 🚨 Troubleshooting

### Common Issues

#### License Activation Failed
```bash
# Check license key format
sentvibe license status
# Expected: SENTVIBE-MEM-FREE-* or SENTVIBE-MEM-BOX-*

# Verify internet connection
ping polar.sh

# Check environment variables
echo $POLAR_ACCESS_TOKEN
```

#### Memory Commands Not Working
```bash
# Ensure project is initialized
sentvibe status
# Should show: "SentVibe: Active"

# Reinitialize if needed
sentvibe uninit
sentvibe init
```

#### AI Agent Not Detected
```bash
# Check AI status
sentvibe ai-status

# Verify VS Code integration
code --version
# Restart VS Code after SentVibe installation
```

#### Sandbox Features Blocked
```bash
# Check license tier
sentvibe license status
# Sandbox requires Pro license

# Upgrade to Pro
sentvibe license upgrade
```

### Performance Issues

#### Large Project Memory
```bash
# Check memory size
sentvibe memory stats

# Compact database
sentvibe memory compact

# Clear old entries
sentvibe memory clear --older-than 30d
```

#### Slow Context Generation
```bash
# Exclude large directories
echo "node_modules/" >> .sentignore
echo "dist/" >> .sentignore
echo ".git/" >> .sentignore
```

## 📋 Best Practices

### 🎯 Memory Optimization
1. **Use .sentignore** to exclude unnecessary files:
   ```
   node_modules/
   dist/
   build/
   .git/
   *.log
   ```

2. **Regular maintenance**:
   ```bash
   # Weekly memory cleanup
   sentvibe memory compact

   # Monthly backup
   sentvibe memory export backup-$(date +%Y%m).json
   ```

3. **Selective pattern learning**:
   ```bash
   # Focus on specific technologies
   sentvibe memory patterns react --only
   sentvibe memory patterns typescript --only
   ```

### 🤖 AI Integration Best Practices
1. **Start conversations with context**:
   ```
   "I'm working on a SentVibe-enhanced project. Please run 'sentvibe memory context' first."
   ```

2. **Use specific memory searches**:
   ```bash
   sentvibe memory search "authentication"
   sentvibe memory similar "error handling"
   ```

3. **Leverage patterns**:
   ```bash
   sentvibe memory patterns react
   # Share output with AI for better suggestions
   ```

### 🛡️ Sandbox Best Practices (Pro)
1. **Test before deploying**:
   ```bash
   sentvibe sandbox test new-feature.js
   # Only deploy if confidence > 95%
   ```

2. **Use confidence scoring**:
   ```bash
   sentvibe sandbox confidence file.js
   # Review manually if < 90%
   ```

3. **Batch testing**:
   ```bash
   sentvibe sandbox test src/**/*.js
   # Test multiple files efficiently
   ```

### 🔧 Team Collaboration
1. **Share patterns**:
   ```bash
   # Export team patterns
   sentvibe memory patterns export team-patterns.json

   # Import on other machines
   sentvibe memory patterns import team-patterns.json
   ```

2. **Consistent configuration**:
   ```json
   // .sentvibe/config.json (commit to repo)
   {
     "memory": {
       "patterns": ["src/**/*.{js,ts,jsx,tsx}"],
       "exclude": ["**/*.test.js", "**/*.spec.js"]
     }
   }
   ```

3. **CI/CD integration**:
   ```yaml
   # Generate context for deployment
   - run: sentvibe memory context > deployment-context.md
   ```

## 🛠️ Development

### Local Development

```bash
# Clone and install
git clone <repo>
cd sentvibe
npm install

# Development
npm run dev -- --help
npm run build
npm test

# Test CLI
npx tsx src/bin/cli.ts status
```

### Polar.sh Integration Setup

To enable Pro license validation, you'll need to set up Polar.sh:

1. **Create a Polar.sh account** at [polar.sh](https://polar.sh)
2. **Create a product** for SentVibe Pro ($19/month)
3. **Get your credentials** from the dashboard
4. **Set environment variables**:

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your Polar.sh credentials
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_ORGANIZATION_ID=your_polar_organization_id_here
```

5. **Test license validation**:

```bash
# Development mode uses Polar.sh sandbox
NODE_ENV=development npm run dev

# Test with a real license key
sv license activate <test-license-key>
```

### Environment Variables

- `POLAR_ACCESS_TOKEN`: Your Polar.sh API access token
- `POLAR_ORGANIZATION_ID`: Your Polar.sh organization ID
- `NODE_ENV`: Set to 'development' to use Polar.sh sandbox
- `SENTVIBE_LOG_LEVEL`: Log level (debug, info, warn, error)
- `SENTVIBE_DATA_DIR`: Custom data directory (default: ~/.sentvibe)

## 📁 Project Structure

```
src/
├── bin/           # CLI entry point
├── commands/      # Command implementations
├── memory/        # Persistent memory system
├── sandbox/       # Secure execution environment
├── ai/            # AI agent detection & welcome
├── utils/         # Utilities and helpers
└── types/         # TypeScript type definitions
```

## 🌟 Key Features

### 🧠 Persistent Memory
- SQLite-based storage
- Automatic file watching
- Pattern learning
- Context generation

### 🛡️ Secure Sandbox
- Node.js VM isolation
- Confidence scoring
- Risk assessment
- Deployment gates

### 🤖 AI Integration
- Agent detection
- Personalized welcome messages
- Enhanced context access
- Memory-first workflow

### ⚡ Performance
- Lightweight and fast
- Minimal dependencies
- Background operation
- Smart caching

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎉 The Future of Development

SentVibe creates the **first development environment designed specifically for the AI-assisted coding era**. It's not just a tool - it's the foundation for a new way of building software where AI agents and human developers work together seamlessly, safely, and intelligently.

**Every project becomes an AI supercharged environment. Every AI agent gets superpowers. Every vibe coder becomes unstoppable.** 🚀

---

*Built with ❤️ for the AI-native development era*
