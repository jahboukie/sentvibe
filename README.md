# 🤖 SentVibe - AI-Native Development Infrastructure

**Universal AI memory and sandbox for developers** - The first development environment designed specifically for the AI-assisted coding era.

[![npm version](https://badge.fury.io/js/sentvibe.svg)](https://badge.fury.io/js/sentvibe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-sentvibe-blue)](https://github.com/jahboukie/sentvibe)

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
