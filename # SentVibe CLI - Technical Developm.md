# SentVibe CLI - Technical Development Document
## Version 2.0 | Project Codename: Universal AI Memory

---

## Executive Summary

**SentVibe** is a lightweight command-line tool that provides invisible infrastructure for AI-assisted development. Rather than being an LLM provider, it serves as a universal memory and sandbox layer that any AI tool (GitHub Copilot, Cursor, Claude, etc.) can leverage through simple VS Code integration and CLI commands.

**Core Philosophy:** Universal AI memory layer + invisible safety sandbox that works with any LLM.

---

## 1. Product Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SENTVIBE CLI TOOL                       │
├─────────────────────────────────────────────────────────────┤
│              Global CLI Command (`sentvibe`)               │
├─────────────────────────────────────────────────────────────┤
│         VS Code Integration (LSP + File Watchers)          │
├─────────────────────────────────────────────────────────────┤
│           Persistent Memory Engine (Local SQLite)          │
├─────────────────────────────────────────────────────────────┤
│         Lightweight Execution Sandbox (Node.js)           │
├─────────────────────────────────────────────────────────────┤
│              Context Export API (JSON/Markdown)            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles
1. **LLM Agnostic:** Works with any AI tool through context sharing
2. **Universal Memory:** Project knowledge persists across all AI interactions
3. **Invisible Operation:** Runs in background, minimal user interaction
4. **Safe Execution:** Sandbox for testing AI-generated code
5. **Modern Dependencies:** Zero deprecated warnings, latest stable packages

---

## 2. Technical Specifications

### 2.1 CLI Tool Architecture

#### 2.1.1 Package Configuration
```json
{
  "name": "sentvibe",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "bin": {
    "sentvibe": "./dist/bin/cli.js",
    "sv": "./dist/bin/cli.js"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "chokidar": "^3.6.0",
    "commander": "^11.1.0",
    "picocolors": "^1.0.0",
    "ora": "^7.0.1",
    "prompts": "^2.4.2",
    "execa": "^8.0.1",
    "fast-glob": "^3.3.2",
    "ignore": "^5.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "tsup": "^8.0.1",
    "vitest": "^1.2.0"
  }
}
```

#### 2.1.2 CLI Command Structure
```typescript
// src/bin/cli.ts
import { Command } from 'commander';
import { init, start, stop, status, memory, sandbox } from '../commands/index.js';

const program = new Command();

program
  .name('sentvibe')
  .description('Universal AI memory and sandbox for developers')
  .version('1.0.0');

// Core commands
program
  .command('init')
  .description('Initialize project with SentVibe')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(init);

program
  .command('start')
  .description('Start background memory and file watching')
  .option('-d, --daemon', 'Run as background daemon')
  .action(start);

program
  .command('stop')
  .description('Stop background services')
  .action(stop);

program
  .command('status')
  .description('Show current status and statistics')
  .action(status);

// Memory commands
const memoryCmd = program
  .command('memory')
  .description('Project memory operations');

memoryCmd
  .command('search <query>')
  .description('Search project memory')
  .option('-l, --limit <number>', 'Number of results', '5')
  .action(memory.search);

memoryCmd
  .command('context')
  .description('Generate context for current state')
  .option('-f, --format <format>', 'Output format (json|markdown)', 'markdown')
  .action(memory.context);

memoryCmd
  .command('clear')
  .description('Clear project memory')
  .option('--confirm', 'Skip confirmation prompt')
  .action(memory.clear);

// Sandbox commands  
const sandboxCmd = program
  .command('sandbox')
  .description('Code execution sandbox');

sandboxCmd
  .command('test [files...]')
  .description('Run tests in sandbox')
  .action(sandbox.test);

sandboxCmd
  .command('run <command>')
  .description('Execute command in sandbox')
  .action(sandbox.run);

sandboxCmd
  .command('clean')
  .description('Clean sandbox artifacts')
  .action(sandbox.clean);

program.parse();
```

#### 2.1.3 Core CLI Implementation
```typescript
// src/commands/init.ts
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { ProjectMemory } from '../memory/index.js';
import { colors, spinner } from '../utils/index.js';
import { setupVSCodeIntegration } from '../vscode/setup.js';

export async function init(options: { force?: boolean }) {
  const cwd = process.cwd();
  const configDir = join(cwd, '.sentvibe');
  
  if (existsSync(configDir) && !options.force) {
    console.log(colors.yellow('Project already initialized. Use --force to overwrite.'));
    return;
  }
  
  const spin = spinner('Initializing SentVibe...').start();
  
  try {
    // Create configuration directory
    mkdirSync(configDir, { recursive: true });
    
    // Initialize memory database
    const memory = new ProjectMemory(join(configDir, 'memory.db'));
    await memory.initialize();
    
    // Create configuration file
    const config = {
      version: '1.0.0',
      created: new Date().toISOString(),
      settings: {
        watchPatterns: ['**/*.{js,ts,jsx,tsx,py,go,rs,java,md}'],
        ignorePatterns: ['node_modules/**', '.git/**', 'dist/**', '.sentvibe/**'],
        memoryEnabled: true,
        sandboxEnabled: true,
        vsCodeIntegration: true
      }
    };
    
    writeFileSync(
      join(configDir, 'config.json'), 
      JSON.stringify(config, null, 2)
    );
    
    // Setup VS Code integration
    await setupVSCodeIntegration(cwd);
    
    // Create .gitignore entry
    const gitignorePath = join(cwd, '.gitignore');
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('.sentvibe/')) {
        appendFileSync(gitignorePath, '\n.sentvibe/\n');
      }
    } else {
      writeFileSync(gitignorePath, '.sentvibe/\n');
    }
    
    spin.succeed('Project initialized successfully!');
    
    console.log('\nNext steps:');
    console.log('  • Run: sentvibe start');
    console.log('  • Use any AI tool in VS Code');
    console.log('  • Access context: sentvibe memory context');
    console.log('  • Search memory: sentvibe memory search "query"');
    
  } catch (error) {
    spin.fail('Initialization failed');
    console.error(colors.red(error.message));
    process.exit(1);
  }
}

// src/commands/start.ts
export async function start(options: { daemon?: boolean }) {
  const configPath = join(process.cwd(), '.sentvibe/config.json');
  
  if (!existsSync(configPath)) {
    console.log(colors.red('Project not initialized. Run: sentvibe init'));
    return;
  }
  
  const spin = spinner('Starting SentVibe services...').start();
  
  try {
    const memory = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    await memory.initialize();
    
    // Start file watching
    await memory.startFileWatcher();
    
    // Start LSP server for VS Code integration
    await startLSPServer();
    
    spin.succeed('SentVibe is running');
    
    if (options.daemon) {
      process.on('SIGINT', async () => {
        await memory.cleanup();
        process.exit(0);
      });
      
      // Keep process alive
      setInterval(() => {}, 1000);
    } else {
      console.log('Press Ctrl+C to stop');
      console.log('Services running:');
      console.log('  • File watching: Active');
      console.log('  • Memory logging: Active');
      console.log('  • VS Code integration: Active');
    }
    
  } catch (error) {
    spin.fail('Failed to start services');
    console.error(colors.red(error.message));
    process.exit(1);
  }
}

// src/commands/memory.ts
export const memory = {
  async search(query: string, options: { limit: string }) {
    const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    const results = await memoryDb.searchMemory(query, parseInt(options.limit));
    
    if (results.length === 0) {
      console.log(colors.yellow(`No memories found for: "${query}"`));
      return;
    }
    
    console.log(colors.blue(`Found ${results.length} memories for: "${query}"\n`));
    
    results.forEach((result, index) => {
      console.log(`${colors.cyan(`${index + 1}.`)} ${result.intent}`);
      console.log(`   ${colors.gray('Outcome:')} ${result.outcome}`);
      console.log(`   ${colors.gray('File:')} ${result.filePath || 'Multiple files'}`);
      console.log(`   ${colors.gray('When:')} ${new Date(result.timestamp).toLocaleDateString()}`);
      console.log('');
    });
  },
  
  async context(options: { format: 'json' | 'markdown' }) {
    const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    const context = await memoryDb.getContextForAI(options.format);
    
    console.log(context);
  },
  
  async clear(options: { confirm?: boolean }) {
    if (!options.confirm) {
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to clear all project memory?'
      });
      
      if (!confirm) {
        console.log('Cancelled');
        return;
      }
    }
    
    const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    await memoryDb.clearMemory();
    
    console.log(colors.green('Project memory cleared'));
  }
};
```

### 2.2 VS Code Integration (Without Extension)

#### 2.2.1 Language Server Protocol Integration
```typescript
// src/vscode/lsp-server.ts
import { 
  createConnection, 
  TextDocuments, 
  ProposedFeatures,
  TextDocumentSyncKind,
  CompletionItem,
  CompletionItemKind,
  InitializeParams,
  InitializeResult
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ProjectMemory } from '../memory/index.js';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
let memory: ProjectMemory;

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const workspaceFolder = params.workspaceFolders?.[0]?.uri;
  if (workspaceFolder) {
    const workspacePath = workspaceFolder.replace('file://', '');
    memory = new ProjectMemory(join(workspacePath, '.sentvibe/memory.db'));
  }
  
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['@', '#', '/']
      },
      hoverProvider: true,
      codeActionProvider: true
    }
  };
});

// Provide context completions with @sentvibe trigger
connection.onCompletion(async (params): Promise<CompletionItem[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !memory) return [];
  
  const text = document.getText();
  const position = params.position;
  const line = text.split('\n')[position.line];
  const lineText = line.substring(0, position.character);
  
  // Trigger on @sentvibe
  if (lineText.includes('@sentvibe') || lineText.includes('@sv')) {
    const recentContext = await memory.getRecentContext(10);
    return recentContext.map((item, index) => ({
      label: `${item.intent}`,
      kind: CompletionItemKind.Snippet,
      detail: `SentVibe Memory: ${item.outcome}`,
      documentation: `File: ${item.filePath || 'Multiple'}\nWhen: ${new Date(item.timestamp).toLocaleDateString()}`,
      insertText: `\n// Context: ${item.intent}\n// Result: ${item.outcome}\n// Reference: ${item.filePath || 'Multiple files'}\n`,
      sortText: `000${index}`,
      filterText: `sentvibe ${item.intent} ${item.outcome}`
    }));
  }
  
  // Trigger on // search: pattern
  if (lineText.includes('// search:') || lineText.includes('# search:')) {
    const searchQuery = lineText.split('search:')[1]?.trim();
    if (searchQuery && searchQuery.length > 2) {
      const searchResults = await memory.searchMemory(searchQuery, 5);
      return searchResults.map((result, index) => ({
        label: `Found: ${result.intent}`,
        kind: CompletionItemKind.Reference,
        detail: `SentVibe Search Result`,
        documentation: result.outcome,
        insertText: `\n// Found in memory: ${result.intent}\n// ${result.outcome}\n`,
        sortText: `100${index}`
      }));
    }
  }
  
  return [];
});

connection.onHover(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !memory) return null;
  
  const position = params.position;
  const text = document.getText();
  const lines = text.split('\n');
  const line = lines[position.line];
  
  // Check if hovering over @sentvibe or similar patterns
  if (line.includes('@sentvibe') || line.includes('@sv')) {
    const stats = await memory.getStats();
    return {
      contents: {
        kind: 'markdown',
        value: `**SentVibe Context Available**\n\n• Total memories: ${stats.totalEntries}\n• Last update: ${stats.lastUpdate}\n• Use \`sentvibe memory context\` for full context\n• Use \`@sentvibe\` trigger for completions`
      }
    };
  }
  
  // Check for memory references in comments
  const memoryKeywords = ['context', 'memory', 'sentvibe', 'previous', 'similar'];
  const hasKeyword = memoryKeywords.some(keyword => 
    line.toLowerCase().includes(keyword)
  );
  
  if (hasKeyword) {
    return {
      contents: {
        kind: 'markdown',
        value: `**SentVibe Tip**\n\nUse \`@sentvibe\` to get relevant project context and patterns from memory.`
      }
    };
  }
  
  return null;
});

// Provide code actions for memory integration
connection.onCodeAction(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !memory) return [];
  
  const actions = [];
  
  // Add action to insert project context
  actions.push({
    title: 'Insert SentVibe Context',
    kind: 'quickfix',
    edit: {
      changes: {
        [params.textDocument.uri]: [{
          range: params.range,
          newText: '\n// @sentvibe - Use tab to see project context\n'
        }]
      }
    }
  });
  
  return actions;
});

documents.listen(connection);
connection.listen();

export function startLSPServer(): Promise<void> {
  return new Promise((resolve) => {
    // LSP server starts listening
    resolve();
  });
}
```

#### 2.2.2 VS Code Integration Setup
```typescript
// src/vscode/setup.ts
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

export async function setupVSCodeIntegration(projectRoot: string): Promise<void> {
  const vscodeDir = join(projectRoot, '.vscode');
  const settingsPath = join(vscodeDir, 'settings.json');
  
  if (!existsSync(vscodeDir)) {
    mkdirSync(vscodeDir, { recursive: true });
  }
  
  // Read existing settings or create new
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    } catch (error) {
      console.warn('Could not parse existing VS Code settings');
    }
  }
  
  // Add SentVibe integration settings
  const sentvibeSettings = {
    // Enable file watching for memory updates
    "files.watcherExclude": {
      "**/.sentvibe/**": false
    },
    
    // Optimize for AI assistance
    "editor.inlineSuggest.enabled": true,
    "editor.suggest.snippetsPreventQuickSuggestions": false,
    
    // Better context for AI tools
    "editor.suggest.showWords": true,
    "editor.suggest.showSnippets": true,
    
    // SentVibe specific settings
    "sentvibe.enableContextSnippets": true,
    "sentvibe.autoMemoryLogging": true
  };
  
  // Merge settings without overwriting existing ones
  Object.keys(sentvibeSettings).forEach(key => {
    if (!(key in settings)) {
      settings[key] = sentvibeSettings[key];
    }
  });
  
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  
  // Create tasks.json for quick commands
  const tasksPath = join(vscodeDir, 'tasks.json');
  if (!existsSync(tasksPath)) {
    const tasks = {
      "version": "2.0.0",
      "tasks": [
        {
          "label": "SentVibe: Get Context",
          "type": "shell",
          "command": "sentvibe memory context",
          "group": "build",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "panel": "new"
          }
        },
        {
          "label": "SentVibe: Search Memory",
          "type": "shell",
          "command": "sentvibe memory search \"${input:searchQuery}\"",
          "group": "build",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "panel": "new"
          }
        },
        {
          "label": "SentVibe: Run Tests in Sandbox",
          "type": "shell",
          "command": "sentvibe sandbox test",
          "group": "test"
        }
      ],
      "inputs": [
        {
          "id": "searchQuery",
          "description": "Enter search query for SentVibe memory",
          "default": "",
          "type": "promptString"
        }
      ]
    };
    
    writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  }
  
  // Create keybindings suggestion file
  const keybindingsPath = join(vscodeDir, 'keybindings.json');
  if (!existsSync(keybindingsPath)) {
    const keybindings = [
      {
        "key": "ctrl+shift+v ctrl+c",
        "command": "workbench.action.tasks.runTask",
        "args": "SentVibe: Get Context"
      },
      {
        "key": "ctrl+shift+v ctrl+s",
        "command": "workbench.action.tasks.runTask",
        "args": "SentVibe: Search Memory"
      }
    ];
    
    writeFileSync(keybindingsPath, JSON.stringify(keybindings, null, 2));
  }
}
```

### 2.3 Memory Engine Implementation

#### 2.3.1 Enhanced Database Schema
```sql
-- Project memory with comprehensive tracking
CREATE TABLE IF NOT EXISTS project_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_path TEXT,
  intent TEXT NOT NULL,
  outcome TEXT NOT NULL,
  code_snippet TEXT,
  test_results TEXT,
  context_hash TEXT UNIQUE,
  tags TEXT, -- JSON array of tags
  language TEXT,
  framework TEXT,
  confidence_score REAL DEFAULT 1.0
);

CREATE INDEX idx_timestamp ON project_memory(timestamp);
CREATE INDEX idx_file_path ON project_memory(file_path);
CREATE INDEX idx_context_hash ON project_memory(context_hash);
CREATE INDEX idx_language ON project_memory(language);
CREATE INDEX idx_confidence ON project_memory(confidence_score);

-- Full-text search with enhanced tokenization
CREATE VIRTUAL TABLE memory_fts USING fts5(
  intent, outcome, code_snippet, file_path, tags,
  content='project_memory',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- File watching metadata
CREATE TABLE IF NOT EXISTS file_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT UNIQUE NOT NULL,
  last_modified DATETIME,
  size_bytes INTEGER,
  content_hash TEXT,
  language TEXT,
  framework TEXT,
  change_type TEXT -- 'created', 'modified', 'deleted'
);

-- Context sessions for AI interactions tracking
CREATE TABLE IF NOT EXISTS context_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  ai_tool TEXT, -- 'copilot', 'cursor', 'claude', etc.
  context_provided TEXT,
  outcome TEXT,
  files_affected TEXT -- JSON array
);

-- Project statistics and insights
CREATE TABLE IF NOT EXISTS project_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE UNIQUE NOT NULL,
  total_memories INTEGER,
  files_changed INTEGER,
  ai_interactions INTEGER,
  successful_tests INTEGER,
  failed_tests INTEGER
);
```

#### 2.3.2 Memory Management Implementation
```typescript
// src/memory/project-memory.ts
import Database from 'better-sqlite3';
import { watch } from 'chokidar';
import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import { extname, relative } from 'path';
import fg from 'fast-glob';

export interface MemoryEntry {
  id?: number;
  timestamp: string;
  filePath?: string;
  intent: string;
  outcome: string;
  codeSnippet?: string;
  testResults?: string;
  contextHash: string;
  tags?: string[];
  language?: string;
  framework?: string;
  confidenceScore?: number;
}

export class ProjectMemory {
  private db: Database.Database;
  private watcher?: import('chokidar').FSWatcher;
  private projectRoot: string;
  
  constructor(private dbPath: string) {
    this.projectRoot = dbPath.replace('/.sentvibe/memory.db', '');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('cache_size = -64000'); // 64MB cache
  }
  
  async initialize(): Promise<void> {
    // Run schema migrations
    this.db.exec(SCHEMA_SQL);
    
    // Start file watching if not already running
    if (!this.watcher) {
      await this.startFileWatcher();
    }
    
    // Update daily stats
    await this.updateDailyStats();
  }
  
  async startFileWatcher(): Promise<void> {
    const patterns = ['**/*.{js,ts,jsx,tsx,py,go,rs,java,md,json,yaml,yml}'];
    const ignored = ['node_modules/**', '.git/**', '.sentvibe/**', 'dist/**', 'build/**'];
    
    this.watcher = watch(patterns, {
      cwd: this.projectRoot,
      ignored,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false
    });
    
    this.watcher.on('change', (path) => this.onFileChanged(path));
    this.watcher.on('add', (path) => this.onFileAdded(path));
    this.watcher.on('unlink', (path) => this.onFileDeleted(path));
  }
  
  private async onFileChanged(filePath: string): Promise<void> {
    try {
      const fullPath = join(this.projectRoot, filePath);
      const stats = statSync(fullPath);
      const content = readFileSync(fullPath, 'utf8');
      const contentHash = createHash('md5').update(content).digest('hex');
      const language = this.detectLanguage(filePath);
      const framework = this.detectFramework(content, language);
      
      // Update file metadata
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO file_metadata 
        (file_path, last_modified, size_bytes, content_hash, language, framework, change_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        filePath,
        stats.mtime.toISOString(),
        stats.size,
        contentHash,
        language,
        framework,
        'modified'
      );
      
      // Auto-generate memory entry for significant changes
      await this.generateAutoMemory(filePath, content, language, framework);
      
    } catch (error) {
      console.warn(`Failed to process file change: ${filePath}`, error);
    }
  }
  
  private async generateAutoMemory(
    filePath: string,
    content: string,
    language: string,
    framework: string
  ): Promise<void> {
    // Simple heuristics for auto-memory generation
    const lines = content.split('\n');
    const significantChanges = [];
    
    // Detect new functions/classes
    const functionPatterns = {
      javascript: /(?:function|const|let|var)\s+(\w+)|class\s+(\w+)/g,
      python: /def\s+(\w+)|class\s+(\w+)/g,
      go: /func\s+(\w+)|type\s+(\w+)/g,
      rust: /fn\s+(\w+)|struct\s+(\w+)/g
    };
    
    const pattern = functionPatterns[language] || functionPatterns.javascript;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      significantChanges.push(match[1] || match[2]);
    }
    
    // Detect imports/dependencies
    const importPatterns = {
      javascript: /import\s+.*from\s+['"]([^'"]+)['"]/g,
      python: /(?:import|from)\s+(\w+)/g
    };
    
    const importPattern = importPatterns[language];
    if (importPattern) {
      let importMatch;
      while ((importMatch = importPattern.exec(content)) !== null) {
        significantChanges.push(`import: ${importMatch[1]}`);
      }
    }
    
    if (significantChanges.length > 0) {
      const intent = `Modified ${filePath}: Added/changed ${significantChanges.length} elements`;
      const outcome = `Updated ${significantChanges.slice(0, 3).join(', ')}${significantChanges.length > 3 ? '...' : ''}`;
      
      await this.addMemory({
        filePath,
        intent,
        outcome,
        codeSnippet: this.extractRelevantSnippet(content, significantChanges[0]),
        language,
        framework,
        confidenceScore: 0.7, // Auto-generated has lower confidence
        tags: ['auto-generated', language, framework].filter(Boolean),
        timestamp: new Date().toISOString(),
        contextHash: this.generateContextHash({ intent, outcome, filePath })
      });
    }
  }
  
  async addMemory(entry: MemoryEntry): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO project_memory 
      (file_path, intent, outcome, code_snippet, test_results, context_hash, tags, language, framework, confidence_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      entry.filePath,
      entry.intent,
      entry.outcome,
      entry.codeSnippet,
      entry.testResults,
      entry.contextHash,
      JSON.stringify(entry.tags || []),
      entry.language,
      entry.framework,
      entry.confidenceScore || 1.0
    );
    
    // Update FTS index
    this.db.exec('INSERT INTO memory_fts(memory_fts) VALUES("rebuild");');
  }
  
  async searchMemory(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    // Enhanced search with ranking
    const stmt = this.db.prepare(`
      SELECT m.*, 
             rank AS relevance_score,
             (confidence_score * 0.7 + (CASE WHEN timestamp > datetime('now', '-7 days') THEN 0.3 ELSE 0.1 END)) AS final_score
      FROM project_memory m
      JOIN (
        SELECT rowid, rank 
        FROM memory_fts 
        WHERE memory_fts MATCH ?

### 2.5 Context Export API

#### 2.5.1 AI Tool Integration
```typescript
// src/context/exporter.ts
import { ProjectMemory } from '../memory/project-memory.js';

export class ContextExporter {
  constructor(private memory: ProjectMemory) {}
  
  async exportForCopilot(): Promise<string> {
    const context = await this.memory.getContextForAI('markdown');
    # SentVibe CLI - Technical Development Document
## Version 2.0 | Project Codename: Universal AI Memory

---

## Executive Summary

**SentVibe** is a lightweight command-line tool that provides invisible infrastructure for AI-assisted development. Rather than being an LLM provider, it serves as a universal memory and sandbox layer that any AI tool (GitHub Copilot, Cursor, Claude, etc.) can leverage through simple VS Code integration and CLI commands.

**Core Philosophy:** Universal AI memory layer + invisible safety sandbox that works with any LLM.

---

## 1. Product Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SENTVIBE CLI TOOL                       │
├─────────────────────────────────────────────────────────────┤
│              Global CLI Command (`sentvibe`)               │
├─────────────────────────────────────────────────────────────┤
│         VS Code Integration (LSP + File Watchers)          │
├─────────────────────────────────────────────────────────────┤
│           Persistent Memory Engine (Local SQLite)          │
├─────────────────────────────────────────────────────────────┤
│         Lightweight Execution Sandbox (Node.js)           │
├─────────────────────────────────────────────────────────────┤
│              Context Export API (JSON/Markdown)            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles
1. **LLM Agnostic:** Works with any AI tool through context sharing
2. **Universal Memory:** Project knowledge persists across all AI interactions
3. **Invisible Operation:** Runs in background, minimal user interaction
4. **Safe Execution:** Sandbox for testing AI-generated code
5. **Modern Dependencies:** Zero deprecated warnings, latest stable packages

---

## 2. Technical Specifications

### 2.1 CLI Tool Architecture

#### 2.1.1 Package Configuration
```json
{
  "name": "sentvibe",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "bin": {
    "sentvibe": "./dist/bin/cli.js",
    "sv": "./dist/bin/cli.js"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "chokidar": "^3.6.0",
    "commander": "^11.1.0",
    "picocolors": "^1.0.0",
    "ora": "^7.0.1",
    "prompts": "^2.4.2",
    "execa": "^8.0.1",
    "fast-glob": "^3.3.2",
    "ignore": "^5.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "tsup": "^8.0.1",
    "vitest": "^1.2.0"
  }
}
```

#### 2.1.2 CLI Command Structure
```typescript
// src/bin/cli.ts
import { Command } from 'commander';
import { init, start, stop, status, memory, sandbox } from '../commands/index.js';

const program = new Command();

program
  .name('sentvibe')
  .description('Universal AI memory and sandbox for developers')
  .version('1.0.0');

// Core commands
program
  .command('init')
  .description('Initialize project with SentVibe')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(init);

program
  .command('start')
  .description('Start background memory and file watching')
  .option('-d, --daemon', 'Run as background daemon')
  .action(start);

program
  .command('stop')
  .description('Stop background services')
  .action(stop);

program
  .command('status')
  .description('Show current status and statistics')
  .action(status);

// Memory commands
const memoryCmd = program
  .command('memory')
  .description('Project memory operations');

memoryCmd
  .command('search <query>')
  .description('Search project memory')
  .option('-l, --limit <number>', 'Number of results', '5')
  .action(memory.search);

memoryCmd
  .command('context')
  .description('Generate context for current state')
  .option('-f, --format <format>', 'Output format (json|markdown)', 'markdown')
  .action(memory.context);

memoryCmd
  .command('clear')
  .description('Clear project memory')
  .option('--confirm', 'Skip confirmation prompt')
  .action(memory.clear);

// Sandbox commands  
const sandboxCmd = program
  .command('sandbox')
  .description('Code execution sandbox');

sandboxCmd
  .command('test [files...]')
  .description('Run tests in sandbox')
  .action(sandbox.test);

sandboxCmd
  .command('run <command>')
  .description('Execute command in sandbox')
  .action(sandbox.run);

sandboxCmd
  .command('clean')
  .description('Clean sandbox artifacts')
  .action(sandbox.clean);

program.parse();
```

#### 2.1.3 Core CLI Implementation
```typescript
// src/commands/init.ts
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { ProjectMemory } from '../memory/index.js';
import { colors, spinner } from '../utils/index.js';
import { setupVSCodeIntegration } from '../vscode/setup.js';

export async function init(options: { force?: boolean }) {
  const cwd = process.cwd();
  const configDir = join(cwd, '.sentvibe');
  
  if (existsSync(configDir) && !options.force) {
    console.log(colors.yellow('Project already initialized. Use --force to overwrite.'));
    return;
  }
  
  const spin = spinner('Initializing SentVibe...').start();
  
  try {
    // Create configuration directory
    mkdirSync(configDir, { recursive: true });
    
    // Initialize memory database
    const memory = new ProjectMemory(join(configDir, 'memory.db'));
    await memory.initialize();
    
    // Create configuration file
    const config = {
      version: '1.0.0',
      created: new Date().toISOString(),
      settings: {
        watchPatterns: ['**/*.{js,ts,jsx,tsx,py,go,rs,java,md}'],
        ignorePatterns: ['node_modules/**', '.git/**', 'dist/**', '.sentvibe/**'],
        memoryEnabled: true,
        sandboxEnabled: true,
        vsCodeIntegration: true
      }
    };
    
    writeFileSync(
      join(configDir, 'config.json'), 
      JSON.stringify(config, null, 2)
    );
    
    // Setup VS Code integration
    await setupVSCodeIntegration(cwd);
    
    // Create .gitignore entry
    const gitignorePath = join(cwd, '.gitignore');
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('.sentvibe/')) {
        appendFileSync(gitignorePath, '\n.sentvibe/\n');
      }
    } else {
      writeFileSync(gitignorePath, '.sentvibe/\n');
    }
    
    spin.succeed('Project initialized successfully!');
    
    console.log('\nNext steps:');
    console.log('  • Run: sentvibe start');
    console.log('  • Use any AI tool in VS Code');
    console.log('  • Access context: sentvibe memory context');
    console.log('  • Search memory: sentvibe memory search "query"');
    
  } catch (error) {
    spin.fail('Initialization failed');
    console.error(colors.red(error.message));
    process.exit(1);
  }
}

// src/commands/start.ts
export async function start(options: { daemon?: boolean }) {
  const configPath = join(process.cwd(), '.sentvibe/config.json');
  
  if (!existsSync(configPath)) {
    console.log(colors.red('Project not initialized. Run: sentvibe init'));
    return;
  }
  
  const spin = spinner('Starting SentVibe services...').start();
  
  try {
    const memory = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    await memory.initialize();
    
    // Start file watching
    await memory.startFileWatcher();
    
    // Start LSP server for VS Code integration
    await startLSPServer();
    
    spin.succeed('SentVibe is running');
    
    if (options.daemon) {
      process.on('SIGINT', async () => {
        await memory.cleanup();
        process.exit(0);
      });
      
      // Keep process alive
      setInterval(() => {}, 1000);
    } else {
      console.log('Press Ctrl+C to stop');
      console.log('Services running:');
      console.log('  • File watching: Active');
      console.log('  • Memory logging: Active');
      console.log('  • VS Code integration: Active');
    }
    
  } catch (error) {
    spin.fail('Failed to start services');
    console.error(colors.red(error.message));
    process.exit(1);
  }
}

// src/commands/memory.ts
export const memory = {
  async search(query: string, options: { limit: string }) {
    const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    const results = await memoryDb.searchMemory(query, parseInt(options.limit));
    
    if (results.length === 0) {
      console.log(colors.yellow(`No memories found for: "${query}"`));
      return;
    }
    
    console.log(colors.blue(`Found ${results.length} memories for: "${query}"\n`));
    
    results.forEach((result, index) => {
      console.log(`${colors.cyan(`${index + 1}.`)} ${result.intent}`);
      console.log(`   ${colors.gray('Outcome:')} ${result.outcome}`);
      console.log(`   ${colors.gray('File:')} ${result.filePath || 'Multiple files'}`);
      console.log(`   ${colors.gray('When:')} ${new Date(result.timestamp).toLocaleDateString()}`);
      console.log('');
    });
  },
  
  async context(options: { format: 'json' | 'markdown' }) {
    const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    const context = await memoryDb.getContextForAI(options.format);
    
    console.log(context);
  },
  
  async clear(options: { confirm?: boolean }) {
    if (!options.confirm) {
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to clear all project memory?'
      });
      
      if (!confirm) {
        console.log('Cancelled');
        return;
      }
    }
    
    const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    await memoryDb.clearMemory();
    
    console.log(colors.green('Project memory cleared'));
  }
};
```

### 2.2 VS Code Integration (Without Extension)

#### 2.2.1 Language Server Protocol Integration
```typescript
// src/vscode/lsp-server.ts
import { 
  createConnection, 
  TextDocuments, 
  ProposedFeatures,
  TextDocumentSyncKind,
  CompletionItem,
  CompletionItemKind,
  InitializeParams,
  InitializeResult
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ProjectMemory } from '../memory/index.js';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
let memory: ProjectMemory;

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const workspaceFolder = params.workspaceFolders?.[0]?.uri;
  if (workspaceFolder) {
    const workspacePath = workspaceFolder.replace('file://', '');
    memory = new ProjectMemory(join(workspacePath, '.sentvibe/memory.db'));
  }
  
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['@', '#', '/']
      },
      hoverProvider: true,
      codeActionProvider: true
    }
  };
});

// Provide context completions with @sentvibe trigger
connection.onCompletion(async (params): Promise<CompletionItem[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !memory) return [];
  
  const text = document.getText();
  const position = params.position;
  const line = text.split('\n')[position.line];
  const lineText = line.substring(0, position.character);
  
  // Trigger on @sentvibe
  if (lineText.includes('@sentvibe') || lineText.includes('@sv')) {
    const recentContext = await memory.getRecentContext(10);
    return recentContext.map((item, index) => ({
      label: `${item.intent}`,
      kind: CompletionItemKind.Snippet,
      detail: `SentVibe Memory: ${item.outcome}`,
      documentation: `File: ${item.filePath || 'Multiple'}\nWhen: ${new Date(item.timestamp).toLocaleDateString()}`,
      insertText: `\n// Context: ${item.intent}\n// Result: ${item.outcome}\n// Reference: ${item.filePath || 'Multiple files'}\n`,
      sortText: `000${index}`,
      filterText: `sentvibe ${item.intent} ${item.outcome}`
    }));
  }
  
  // Trigger on // search: pattern
  if (lineText.includes('// search:') || lineText.includes('# search:')) {
    const searchQuery = lineText.split('search:')[1]?.trim();
    if (searchQuery && searchQuery.length > 2) {
      const searchResults = await memory.searchMemory(searchQuery, 5);
      return searchResults.map((result, index) => ({
        label: `Found: ${result.intent}`,
        kind: CompletionItemKind.Reference,
        detail: `SentVibe Search Result`,
        documentation: result.outcome,
        insertText: `\n// Found in memory: ${result.intent}\n// ${result.outcome}\n`,
        sortText: `100${index}`
      }));
    }
  }
  
  return [];
});

connection.onHover(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !memory) return null;
  
  const position = params.position;
  const text = document.getText();
  const lines = text.split('\n');
  const line = lines[position.line];
  
  // Check if hovering over @sentvibe or similar patterns
  if (line.includes('@sentvibe') || line.includes('@sv')) {
    const stats = await memory.getStats();
    return {
      contents: {
        kind: 'markdown',
        value: `**SentVibe Context Available**\n\n• Total memories: ${stats.totalEntries}\n• Last update: ${stats.lastUpdate}\n• Use \`sentvibe memory context\` for full context\n• Use \`@sentvibe\` trigger for completions`
      }
    };
  }
  
  // Check for memory references in comments
  const memoryKeywords = ['context', 'memory', 'sentvibe', 'previous', 'similar'];
  const hasKeyword = memoryKeywords.some(keyword => 
    line.toLowerCase().includes(keyword)
  );
  
  if (hasKeyword) {
    return {
      contents: {
        kind: 'markdown',
        value: `**SentVibe Tip**\n\nUse \`@sentvibe\` to get relevant project context and patterns from memory.`
      }
    };
  }
  
  return null;
});

// Provide code actions for memory integration
connection.onCodeAction(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !memory) return [];
  
  const actions = [];
  
  // Add action to insert project context
  actions.push({
    title: 'Insert SentVibe Context',
    kind: 'quickfix',
    edit: {
      changes: {
        [params.textDocument.uri]: [{
          range: params.range,
          newText: '\n// @sentvibe - Use tab to see project context\n'
        }]
      }
    }
  });
  
  return actions;
});

documents.listen(connection);
connection.listen();

export function startLSPServer(): Promise<void> {
  return new Promise((resolve) => {
    // LSP server starts listening
    resolve();
  });
}
```

#### 2.2.2 VS Code Integration Setup
```typescript
// src/vscode/setup.ts
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

export async function setupVSCodeIntegration(projectRoot: string): Promise<void> {
  const vscodeDir = join(projectRoot, '.vscode');
  const settingsPath = join(vscodeDir, 'settings.json');
  
  if (!existsSync(vscodeDir)) {
    mkdirSync(vscodeDir, { recursive: true });
  }
  
  // Read existing settings or create new
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    } catch (error) {
      console.warn('Could not parse existing VS Code settings');
    }
  }
  
  // Add SentVibe integration settings
  const sentvibeSettings = {
    // Enable file watching for memory updates
    "files.watcherExclude": {
      "**/.sentvibe/**": false
    },
    
    // Optimize for AI assistance
    "editor.inlineSuggest.enabled": true,
    "editor.suggest.snippetsPreventQuickSuggestions": false,
    
    // Better context for AI tools
    "editor.suggest.showWords": true,
    "editor.suggest.showSnippets": true,
    
    // SentVibe specific settings
    "sentvibe.enableContextSnippets": true,
    "sentvibe.autoMemoryLogging": true
  };
  
  // Merge settings without overwriting existing ones
  Object.keys(sentvibeSettings).forEach(key => {
    if (!(key in settings)) {
      settings[key] = sentvibeSettings[key];
    }
  });
  
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  
  // Create tasks.json for quick commands
  const tasksPath = join(vscodeDir, 'tasks.json');
  if (!existsSync(tasksPath)) {
    const tasks = {
      "version": "2.0.0",
      "tasks": [
        {
          "label": "SentVibe: Get Context",
          "type": "shell",
          "command": "sentvibe memory context",
          "group": "build",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "panel": "new"
          }
        },
        {
          "label": "SentVibe: Search Memory",
          "type": "shell",
          "command": "sentvibe memory search \"${input:searchQuery}\"",
          "group": "build",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "panel": "new"
          }
        },
        {
          "label": "SentVibe: Run Tests in Sandbox",
          "type": "shell",
          "command": "sentvibe sandbox test",
          "group": "test"
        }
      ],
      "inputs": [
        {
          "id": "searchQuery",
          "description": "Enter search query for SentVibe memory",
          "default": "",
          "type": "promptString"
        }
      ]
    };
    
    writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  }
  
  // Create keybindings suggestion file
  const keybindingsPath = join(vscodeDir, 'keybindings.json');
  if (!existsSync(keybindingsPath)) {
    const keybindings = [
      {
        "key": "ctrl+shift+v ctrl+c",
        "command": "workbench.action.tasks.runTask",
        "args": "SentVibe: Get Context"
      },
      {
        "key": "ctrl+shift+v ctrl+s",
        "command": "workbench.action.tasks.runTask",
        "args": "SentVibe: Search Memory"
      }
    ];
    
    writeFileSync(keybindingsPath, JSON.stringify(keybindings, null, 2));
  }
}
```

### 2.3 Memory Engine Implementation

#### 2.3.1 Enhanced Database Schema
```sql
-- Project memory with comprehensive tracking
CREATE TABLE IF NOT EXISTS project_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_path TEXT,
  intent TEXT NOT NULL,
  outcome TEXT NOT NULL,
  code_snippet TEXT,
  test_results TEXT,
  context_hash TEXT UNIQUE,
  tags TEXT, -- JSON array of tags
  language TEXT,
  framework TEXT,
  confidence_score REAL DEFAULT 1.0
);

CREATE INDEX idx_timestamp ON project_memory(timestamp);
CREATE INDEX idx_file_path ON project_memory(file_path);
CREATE INDEX idx_context_hash ON project_memory(context_hash);
CREATE INDEX idx_language ON project_memory(language);
CREATE INDEX idx_confidence ON project_memory(confidence_score);

-- Full-text search with enhanced tokenization
CREATE VIRTUAL TABLE memory_fts USING fts5(
  intent, outcome, code_snippet, file_path, tags,
  content='project_memory',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- File watching metadata
CREATE TABLE IF NOT EXISTS file_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT UNIQUE NOT NULL,
  last_modified DATETIME,
  size_bytes INTEGER,
  content_hash TEXT,
  language TEXT,
  framework TEXT,
  change_type TEXT -- 'created', 'modified', 'deleted'
);

-- Context sessions for AI interactions tracking
CREATE TABLE IF NOT EXISTS context_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  ai_tool TEXT, -- 'copilot', 'cursor', 'claude', etc.
  context_provided TEXT,
  outcome TEXT,
  files_affected TEXT -- JSON array
);

-- Project statistics and insights
CREATE TABLE IF NOT EXISTS project_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE UNIQUE NOT NULL,
  total_memories INTEGER,
  files_changed INTEGER,
  ai_interactions INTEGER,
  successful_tests INTEGER,
  failed_tests INTEGER
);
```

#### 2.3.2 Memory Management Implementation
```typescript
// src/memory/project-memory.ts
import Database from 'better-sqlite3';
import { watch } from 'chokidar';
import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import { extname, relative } from 'path';
import fg from 'fast-glob';

export interface MemoryEntry {
  id?: number;
  timestamp: string;
  filePath?: string;
  intent: string;
  outcome: string;
  codeSnippet?: string;
  testResults?: string;
  contextHash: string;
  tags?: string[];
  language?: string;
  framework?: string;
  confidenceScore?: number;
}

export class ProjectMemory {
  private db: Database.Database;
  private watcher?: import('chokidar').FSWatcher;
  private projectRoot: string;
  
  constructor(private dbPath: string) {
    this.projectRoot = dbPath.replace('/.sentvibe/memory.db', '');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('cache_size = -64000'); // 64MB cache
  }
  
  async initialize(): Promise<void> {
    // Run schema migrations
    this.db.exec(SCHEMA_SQL);
    
    // Start file watching if not already running
    if (!this.watcher) {
      await this.startFileWatcher();
    }
    
    // Update daily stats
    await this.updateDailyStats();
  }
  
  async startFileWatcher(): Promise<void> {
    const patterns = ['**/*.{js,ts,jsx,tsx,py,go,rs,java,md,json,yaml,yml}'];
    const ignored = ['node_modules/**', '.git/**', '.sentvibe/**', 'dist/**', 'build/**'];
    
    this.watcher = watch(patterns, {
      cwd: this.projectRoot,
      ignored,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false
    });
    
    this.watcher.on('change', (path) => this.onFileChanged(path));
    this.watcher.on('add', (path) => this.onFileAdded(path));
    this.watcher.on('unlink', (path) => this.onFileDeleted(path));
  }
  
  private async onFileChanged(filePath: string): Promise<void> {
    try {
      const fullPath = join(this.projectRoot, filePath);
      const stats = statSync(fullPath);
      const content = readFileSync(fullPath, 'utf8');
      const contentHash = createHash('md5').update(content).digest('hex');
      const language = this.detectLanguage(filePath);
      const framework = this.detectFramework(content, language);
      
      // Update file metadata
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO file_metadata 
        (file_path, last_modified, size_bytes, content_hash, language, framework, change_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        filePath,
        stats.mtime.toISOString(),
        stats.size,
        contentHash,
        language,
        framework,
        'modified'
      );
      
      // Auto-generate memory entry for significant changes
      await this.generateAutoMemory(filePath, content, language, framework);
      
    } catch (error) {
      console.warn(`Failed to process file change: ${filePath}`, error);
    }
  }
  
  private async generateAutoMemory(
    filePath: string,
    content: string,
    language: string,
    framework: string
  ): Promise<void> {
    // Simple heuristics for auto-memory generation
    const lines = content.split('\n');
    const significantChanges = [];
    
    // Detect new functions/classes
    const functionPatterns = {
      javascript: /(?:function|const|let|var)\s+(\w+)|class\s+(\w+)/g,
      python: /def\s+(\w+)|class\s+(\w+)/g,
      go: /func\s+(\w+)|type\s+(\w+)/g,
      rust: /fn\s+(\w+)|struct\s+(\w+)/g
    };
    
    const pattern = functionPatterns[language] || functionPatterns.javascript;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      significantChanges.push(match[1] || match[2]);
    }
    
    // Detect imports/dependencies
    const importPatterns = {
      javascript: /import\s+.*from\s+['"]([^'"]+)['"]/g,
      python: /(?:import|from)\s+(\w+)/g
    };
    
    const importPattern = importPatterns[language];
    if (importPattern) {
      let importMatch;
      while ((importMatch = importPattern.exec(content)) !== null) {
        significantChanges.push(`import: ${importMatch[1]}`);
      }
    }
    
    if (significantChanges.length > 0) {
      const intent = `Modified ${filePath}: Added/changed ${significantChanges.length} elements`;
      const outcome = `Updated ${significantChanges.slice(0, 3).join(', ')}${significantChanges.length > 3 ? '...' : ''}`;
      
      await this.addMemory({
        filePath,
        intent,
        outcome,
        codeSnippet: this.extractRelevantSnippet(content, significantChanges[0]),
        language,
        framework,
        confidenceScore: 0.7, // Auto-generated has lower confidence
        tags: ['auto-generated', language, framework].filter(Boolean),
        timestamp: new Date().toISOString(),
        contextHash: this.generateContextHash({ intent, outcome, filePath })
      });
    }
  }
  
  async addMemory(entry: MemoryEntry): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO project_memory 
      (file_path, intent, outcome, code_snippet, test_results, context_hash, tags, language, framework, confidence_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      entry.filePath,
      entry.intent,
      entry.outcome,
      entry.codeSnippet,
      entry.testResults,
      entry.contextHash,
      JSON.stringify(entry.tags || []),
      entry.language,
      entry.framework,
      entry.confidenceScore || 1.0
    );
    
    // Update FTS index
    this.db.exec('INSERT INTO memory_fts(memory_fts) VALUES("rebuild");');
  }
  
  async searchMemory(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    // Enhanced search with ranking
    const stmt = this.db.prepare(`
      SELECT m.*, 
             rank AS relevance_score,
             (confidence_score * 0.7 + (CASE WHEN timestamp > datetime('now', '-7 days') THEN 0.3 ELSE 0.1 END)) AS final_score
      FROM project_memory m
      JOIN (
        SELECT rowid, rank 
        FROM memory_fts 
        WHERE memory_fts MATCH ? 
        ORDER BY rank
      ) fts ON m.id = fts.rowid
      ORDER BY final_score DESC, timestamp DESC
      LIMIT ?
    `);
    
    return stmt.all(query, limit).map(this.rowToMemoryEntry);
  }
  
  async getRecentContext(limit: number = 10): Promise<MemoryEntry[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM project_memory 
      WHERE confidence_score > 0.5
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    return stmt.all(limit).map(this.rowToMemoryEntry);
  }
  
  async getContextForAI(format: 'json' | 'markdown' = 'markdown'): Promise<string> {
    const recentMemories = await this.getRecentContext(15);
    const fileStructure = await this.getProjectStructure();
    const stats = await this.getStats();
    
    if (format === 'json') {
      return JSON.stringify({
        projectStructure: fileStructure,
        recentMemories,
        stats,
        lastUpdated: new Date().toISOString()
      }, null, 2);
    }
    
    // Markdown format optimized for AI consumption
    return `# SentVibe Project Context

## Project Overview
- **Total Memories:** ${stats.totalEntries}
- **Files Tracked:** ${stats.filesTracked}
- **Last Activity:** ${stats.lastUpdate}
- **Primary Languages:** ${stats.topLanguages.join(', ')}

## Recent Development History
${recentMemories.map(m => `
### ${m.intent}
- **Outcome:** ${m.outcome}
- **File:** ${m.filePath || 'Multiple files'}
- **Language:** ${m.language || 'Unknown'}
- **When:** ${new Date(m.timestamp).toLocaleDateString()}
${m.codeSnippet ? `- **Code Example:**\n\`\`\`${m.language}\n${m.codeSnippet.substring(0, 200)}${m.codeSnippet.length > 200 ? '...' : ''}\n\`\`\`` : ''}
`).join('')}

## Project Structure
\`\`\`
${fileStructure.slice(0, 50).join('\n')}${fileStructure.length > 50 ? '\n... and more files' : ''}
\`\`\`

## Usage Tips for AI
- Reference recent patterns and outcomes when suggesting similar features
- Consider the project's language and framework preferences
- Use established naming conventions from the codebase
- Build upon successful patterns from memory

---
*Context generated by SentVibe CLI at ${new Date().toISOString()}*
*Use 'sentvibe memory search <query>' to find specific context*
`;
  }
  
  async getProjectStructure(): Promise<string[]> {
    try {
      const files = await fg(['**/*'], {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**', '.sentvibe/**', 'dist/**', 'build/**'],
        onlyFiles: true,
        markDirectories: false
      });
      
      return files.sort();
    } catch (error) {
      return ['Error reading project structure'];
    }
  }
  
  async getStats(): Promise<ProjectStats> {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM project_memory');
    const filesStmt = this.db.prepare('SELECT COUNT(*) as count FROM file_metadata');
    const languagesStmt = this.db.prepare(`
      SELECT language, COUNT(*) as count 
      FROM project_memory 
      WHERE language IS NOT NULL 
      GROUP BY language 
      ORDER BY count DESC 
      LIMIT 5
    `);
    const lastUpdateStmt = this.db.prepare('SELECT MAX(timestamp) as last_update FROM project_memory');
    
    const total = totalStmt.get() as { count: number };
    const files = filesStmt.get() as { count: number };
    const languages = languagesStmt.all() as { language: string; count: number }[];
    const lastUpdate = lastUpdateStmt.get() as { last_update: string };
    
    return {
      totalEntries: total.count,
      filesTracked: files.count,
      topLanguages: languages.map(l => l.language),
      lastUpdate: lastUpdate.last_update ? new Date(lastUpdate.last_update).toLocaleDateString() : 'Never'
    };
  }
  
  async clearMemory(): Promise<void> {
    this.db.exec('DELETE FROM project_memory');
    this.db.exec('DELETE FROM memory_fts');
    this.db.exec('DELETE FROM context_sessions');
    this.db.exec('DELETE FROM project_stats');
  }
  
  private detectLanguage(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.md': 'markdown',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml'
    };
    
    return languageMap[ext] || 'unknown';
  }
  
  private detectFramework(content: string, language: string): string {
    const frameworks = {
      javascript: [
        { pattern: /import.*react/i, name: 'react' },
        { pattern: /import.*vue/i, name: 'vue' },
        { pattern: /import.*angular/i, name: 'angular' },
        { pattern: /import.*express/i, name: 'express' },
        { pattern: /import.*next/i, name: 'nextjs' }
      ],
      python: [
        { pattern: /import django/i, name: 'django' },
        { pattern: /from flask/i, name: 'flask' },
        { pattern: /import fastapi/i, name: 'fastapi' },
        { pattern: /import pandas/i, name: 'data-science' }
      ]
    };
    
    const langFrameworks = frameworks[language] || [];
    for (const fw of langFrameworks) {
      if (fw.pattern.test(content)) {
        return fw.name;
      }
    }
    
    return null;
  }
  
  private extractRelevantSnippet(content: string, target: string): string {
    const lines = content.split('\n');
    const targetIndex = lines.findIndex(line => line.includes(target));
    
    if (targetIndex === -1) return null;
    
    const start = Math.max(0, targetIndex - 2);
    const end = Math.min(lines.length, targetIndex + 5);
    
    return lines.slice(start, end).join('\n');
  }
  
  private generateContextHash(entry: Partial<MemoryEntry>): string {
    const data = `${entry.intent}-${entry.outcome}-${entry.filePath}`;
    return createHash('md5').update(data).digest('hex');
  }
  
  private rowToMemoryEntry(row: any): MemoryEntry {
    return {
      id: row.id,
      timestamp: row.timestamp,
      filePath: row.file_path,
      intent: row.intent,
      outcome: row.outcome,
      codeSnippet: row.code_snippet,
      testResults: row.test_results,
      contextHash: row.context_hash,
      tags: row.tags ? JSON.parse(row.tags) : [],
      language: row.language,
      framework: row.framework,
      confidenceScore: row.confidence_score
    };
  }
  
  async cleanup(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
    }
    this.db.close();
  }
}

interface ProjectStats {
  totalEntries: number;
  filesTracked: number;
  topLanguages: string[];
  lastUpdate: string;
}

### 2.5 Context Export API

#### 2.5.1 AI Tool Integration
```typescript
// src/context/exporter.ts
import { ProjectMemory } from '../memory/project-memory.js';

export class ContextExporter {
  constructor(private memory: ProjectMemory) {}
  
  async exportForCopilot(): Promise<string> {
    const context = await this.memory.getContextForAI('markdown');
    
    // Format optimized for GitHub Copilot
    return `// SentVibe Context - Use this information to understand the project
/*
${context}
*/

// To use this context:
// 1. Reference recent patterns from the memory above
// 2. Consider the project structure when suggesting code
// 3. Follow established conventions shown in recent outcomes
// 4. Use @sentvibe in comments to trigger more specific context
`;
  }
  
  async exportForCursor(): Promise<string> {
    const memories = await this.memory.getRecentContext(8);
    const stats = await this.memory.getStats();
    
    // Cursor-optimized format with explicit instructions
    return `# Context for AI Assistant

## Project Overview
- **Languages:** ${stats.topLanguages.join(', ')}
- **Total Memories:** ${stats.totalEntries}
- **Last Activity:** ${stats.lastUpdate}

## Recent Development Patterns
${memories.map(m => `- **${m.intent}**: ${m.outcome}`).join('\n')}

## Instructions for AI
- Use patterns from recent memory when suggesting similar features
- Maintain consistency with existing code style shown in memories
- Consider test results and outcomes when proposing changes
- Reference file paths from memory for related functionality

## Quick Commands
- \`sentvibe memory search <query>\` - Find specific context
- \`sentvibe memory context\` - Get full project context  
- \`sentvibe sandbox test\` - Test code safely

---
*Use '@sentvibe' in your code comments to trigger context completions*
`;
  }
  
  async exportAsCompletionContext(query: string): Promise<string> {
    const relevant = await this.memory.searchMemory(query, 5);
    
    if (relevant.length === 0) {
      return `// No relevant context found in project memory for: "${query}"
// Try: sentvibe memory search "${query}"`;
    }
    
    return `// Relevant SentVibe context for: ${query}
${relevant.map(r => `
// Previous: ${r.intent}
// Result: ${r.outcome}
// File: ${r.filePath || 'Multiple files'}
// Language: ${r.language || 'Unknown'}
${r.codeSnippet ? `// Example:\n${r.codeSnippet.split('\n').map(line => `// ${line}`).join('\n')}` : ''}
`).join('\n')}

// Use these patterns as reference for similar implementations
`;
  }
  
  async exportForTerminalAI(): Promise<string> {
    const context = await this.memory.getContextForAI('json');
    return context;
  }
  
  async generatePromptEnhancement(userPrompt: string): Promise<string> {
    const relevantMemories = await this.memory.searchMemory(userPrompt, 3);
    
    if (relevantMemories.length === 0) {
      return userPrompt;
    }
    
    const enhancement = `
Context from project memory:
${relevantMemories.map(m => `- Previously: ${m.intent} → ${m.outcome}`).join('\n')}

Original request: ${userPrompt}

Please consider the above context when responding.`;
    
    return enhancement;
  }
}
```

#### 2.5.2 Integration Utilities
```typescript
// src/utils/index.ts
import pc from 'picocolors';
import ora from 'ora';

export const colors = {
  red: pc.red,
  green: pc.green,
  yellow: pc.yellow,
  blue: pc.blue,
  cyan: pc.cyan,
  gray: pc.gray,
  bold: pc.bold
};

export function spinner(text: string) {
  return ora({
    text,
    color: 'cyan',
    spinner: 'dots'
  });
}

export function formatMemoryEntry(entry: any): string {
  return `${colors.cyan(entry.intent)}
  ${colors.gray('→')} ${entry.outcome}
  ${colors.gray('File:')} ${entry.filePath || 'Multiple'}
  ${colors.gray('When:')} ${new Date(entry.timestamp).toLocaleDateString()}`;
}

export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}

export function validateProjectRoot(path: string): boolean {
  const fs = require('fs');
  return fs.existsSync(path) && fs.statSync(path).isDirectory();
}

// Helper for detecting if we're in a git repository
export function isGitRepository(path: string): boolean {
  const fs = require('fs');
  return fs.existsSync(join(path, '.git'));
}

// Generate project metadata for better context
export async function getProjectMetadata(projectRoot: string): Promise<ProjectMetadata> {
  const fs = require('fs').promises;
  const path = require('path');
  
  const metadata: ProjectMetadata = {
    name: path.basename(projectRoot),
    root: projectRoot,
    isGitRepo: isGitRepository(projectRoot),
    packageManagers: [],
    languages: [],
    frameworks: []
  };
  
  // Detect package managers
  const packageFiles = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml'];
  for (const file of packageFiles) {
    try {
      await fs.access(path.join(projectRoot, file));
      metadata.packageManagers.push(file);
    } catch {}
  }
  
  // Read package.json if available
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8')
    );
    metadata.name = packageJson.name || metadata.name;
    
    // Detect frameworks from dependencies
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const frameworks = [];
    
    if (deps.react) frameworks.push('React');
    if (deps.vue) frameworks.push('Vue');
    if (deps.angular) frameworks.push('Angular');
    if (deps.next) frameworks.push('Next.js');
    if (deps.express) frameworks.push('Express');
    if (deps.nestjs) frameworks.push('NestJS');
    
    metadata.frameworks = frameworks;
  } catch {}
  
  return metadata;
}

interface ProjectMetadata {
  name: string;
  root: string;
  isGitRepo: boolean;
  packageManagers: string[];
  languages: string[];
  frameworks: string[];
}
```

---

## 3. Implementation Roadmap

### Phase 1: Core CLI Framework (Weeks 1-2)
- [ ] Set up modern TypeScript project with ESM modules
- [ ] Implement basic CLI commands (`sentvibe init`, `start`, `stop`, `status`)
- [ ] Create SQLite-based memory engine with FTS5 search
- [ ] Build file watching system with intelligent change detection
- [ ] Add basic context export functionality in JSON/Markdown formats

### Phase 2: VS Code Integration (Weeks 3-4)
- [ ] Implement LSP server for seamless VS Code integration
- [ ] Create automatic `.vscode/settings.json` configuration
- [ ] Build context injection system with `@sentvibe` triggers
- [ ] Add hover providers and completion suggestions
- [ ] Test integration with GitHub Copilot and Cursor

### Phase 3: Sandbox Implementation (Weeks 5-6)
- [ ] Build lightweight execution sandbox using Node.js child processes
- [ ] Implement multi-language test framework detection (Jest, pytest, Go test, etc.)
- [ ] Add comprehensive safety validation and command filtering
- [ ] Create automatic cleanup and resource management
- [ ] Test across different project types and operating systems

### Phase 4: Advanced Features (Weeks 7-8)
- [ ] Implement intelligent auto-memory generation from file changes
- [ ] Add project structure analysis and framework detection
- [ ] Build context search with relevance scoring and recency weighting
- [ ] Create integration helpers for popular AI tools
- [ ] Add comprehensive error handling and recovery mechanisms

### Phase 5: Polish & Distribution (Weeks 9-10)
- [ ] Performance optimization for large projects (10,000+ files)
- [ ] Comprehensive CLI help system and documentation
- [ ] NPM package preparation with zero-warning dependencies
- [ ] Integration testing with multiple AI development environments
- [ ] Beta testing with selected developer community

---

## 4. Usage Examples

### 4.1 Basic Workflow
```bash
# Global installation
npm install -g sentvibe

# Initialize any project  
cd my-awesome-project
sentvibe init

# Start background services
sentvibe start

# Work with AI tools in VS Code
# - Type @sentvibe for context completions
# - All AI tools automatically benefit from project memory
# - File changes are logged automatically

# Manual context access
sentvibe memory context                    # Get full context
sentvibe memory search "authentication"    # Find specific patterns
sentvibe memory search "database setup"    # Search for database work

# Safe testing
sentvibe sandbox test                      # Run all tests safely
sentvibe sandbox run "npm run build"      # Test build process

# Cleanup
sentvibe stop                              # Stop background services
```

### 4.2 VS Code AI Integration Examples
```typescript
// In any file, type @sentvibe and press Tab to get:

function authenticateUser(credentials) {
  // Context: Added user login functionality  
  // Result: Created login system with JWT authentication
  // Reference: src/auth/login.js
  
  // Use similar patterns for user authentication
}

// Search for specific context with comments:
// search: database connection
// → Triggers completion with relevant database setup memories

// Manual context insertion:
/* 
Recent project context:
- Added user authentication with JWT
- Set up PostgreSQL database connection  
- Implemented password hashing with bcrypt
- Created user registration endpoint
*/
```

### 4.3 Terminal AI Integration
```bash
# Get context for terminal-based AI tools
sentvibe memory context --format json | ai-tool-cli

# Search and pipe specific context
sentvibe memory search "error handling" | claude-cli "How can I improve this?"

# Generate enhanced prompts
echo "Add user registration" | sentvibe enhance-prompt | copilot-cli
```

---

## 5. Technical Requirements

### 5.1 Modern Dependencies (Zero Warnings)
```json
{
  "better-sqlite3": "^9.4.3",      // Latest SQLite with FTS5, no deprecations
  "chokidar": "^3.6.0",            // Mature file watching, actively maintained  
  "commander": "^11.1.0",          // Latest CLI framework, stable API
  "execa": "^8.0.1",               // Modern process execution, replaces child_process
  "picocolors": "^1.0.0",          // Lightweight colors, replaces chalk
  "ora": "^7.0.1",                 // Latest spinner library
  "fast-glob": "^3.3.2",           // High-performance file globbing
  "ignore": "^5.3.1",              // .gitignore parsing, stable
  "prompts": "^2.4.2"              // Interactive prompts, maintained
}
```

### 5.2 Runtime Requirements
- **Node.js:** 18.0.0+ (for native ESM support and latest features)
- **Memory:** 50MB baseline, 200MB during active file watching and sandbox usage
- **Storage:** ~30MB for CLI tool + variable project memory database size
- **Platform:** Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Optional:** Git for enhanced project detection and branch integration

### 5.3 Performance Targets
- **CLI Response:** < 50ms for status commands, < 200ms for memory operations
- **Memory Search:** < 300ms for full-text search across 1000+ memories
- **Context Export:** < 500ms for full project context generation
- **Sandbox Creation:** < 3 seconds for most projects
- **File Change Detection:** < 100ms delay from file save to memory logging
- **VS Code Integration:** < 200ms for context completions and hover information

---

## 6. Success Metrics

### 6.1 Technical KPIs
- **Zero Deprecation Warnings:** Clean `npm install -g sentvibe` on all platforms
- **Memory Efficiency:** < 200MB memory usage during typical development sessions
- **Response Time:** 95% of operations complete within target performance times
- **Compatibility:** Seamless integration with VS Code, Cursor, and terminal AI tools
- **Reliability:** 99.5% uptime for background services, robust error recovery

### 6.2 Adoption KPIs  
- **NPM Downloads:** 2,000+ weekly downloads within 3 months of launch
- **GitHub Repository:** 1,000+ stars within 6 months
- **Community Integration:** Examples and tutorials for major AI development tools
- **User Retention:** 75% of users continue using SentVibe after 2 weeks
- **Developer Satisfaction:** 4.5+ star rating on NPM and positive community feedback

### 6.3 Business KPIs
- **Market Position:** Recognized as essential AI development infrastructure
- **Integration Ecosystem:** Partnerships or integrations with major AI tool providers
- **Developer Advocacy:** Speaking opportunities and conference presentations
- **Revenue Potential:** Clear path to monetization through premium cloud features

---

## 7. Risk Assessment & Mitigation

### 7.1 Technical Risks
**Sandbox Security Concerns**
- *Risk:* Command injection or unsafe code execution
- *Mitigation:* Strict command allowlisting, process isolation, resource limits

**Performance Degradation** 
- *Risk:* File watching and memory operations slow down development
- *Mitigation:* Intelligent file filtering, configurable watch patterns, lazy loading

**AI Tool Compatibility**
- *Risk:* Integration breaks with AI tool updates
- *Mitigation:* Standard LSP protocol usage, minimal VS Code dependencies

**SQLite Database Corruption**
- *Risk:* Memory database becomes corrupted or inaccessible
- *Mitigation:* WAL mode, automatic backups, recovery procedures

### 7.2 Market Risks
**AI Tool Market Fragmentation**
- *Risk:* Too many AI tools to support effectively
- *Mitigation:* Universal approach through standard protocols (LSP, file watching)

**Competition from Major Players**
- *Risk:* GitHub, Microsoft, or other major players build similar functionality
- *Mitigation:* Focus on being best-in-class infrastructure, open source approach

**Developer Adoption Barriers**
- *Risk:* Developers reluctant to add another CLI tool
- *Mitigation:* Invisible operation, immediate value demonstration, minimal setup

---

## 8. Future Roadmap

### 8.1 Short-term Enhancements (3-6 months)
- **Cloud Sync:** Optional cloud backup and sync of project memories
- **Team Collaboration:** Shared memory pools for development teams  
- **Advanced Analytics:** Insights into development patterns and productivity
- **More AI Integrations:** Direct support for Claude, OpenAI API, local models

### 8.2 Medium-term Vision (6-12 months)
- **Premium Cloud Sandbox:** High-performance cloud execution environment
- **Enterprise Features:** Team management, audit logs, compliance features
- **IDE Expansion:** Support for JetBrains IDEs, Vim/Neovim, Emacs
- **Advanced Context:** Vector embeddings, semantic search, pattern recognition

### 8.3 Long-term Strategy (1-2 years)
- **AI Development Platform:** Complete ecosystem for AI-assisted development
- **Marketplace:** Community-contributed memory patterns and templates
- **Enterprise SaaS:** Hosted solution for large development organizations
- **Developer Tools Integration:** Native support in major development platforms

---

## Conclusion

SentVibe CLI represents a fundamental shift in AI development tooling—from being just another AI assistant to becoming the universal memory and safety infrastructure that makes ALL AI assistants smarter and safer.

By focusing on being LLM-agnostic, invisible, and universally compatible, SentVibe positions itself as essential infrastructure that developers install once and benefit from across their entire AI-powered development workflow.

The technical approach emphasizes modern, maintainable code with zero deprecated dependencies, ensuring the tool will remain stable and relevant as the AI development landscape continues to evolve rapidly.

**Key Success Factors:**
1. **Flawless VS Code Integration** - Must feel native and invisible
2. **Universal AI Compatibility** - Works with any current or future AI tool  
3. **Zero-Friction Setup** - Single command installation and initialization
4. **Robust Memory System** - Intelligent, searchable, and persistent project context
5. **Safe Execution Environment** - Trustworthy sandbox for AI-generated code

The roadmap provides clear milestones toward becoming the de facto standard for AI development infrastructure, with built-in opportunities for community growth and eventual monetization through premium cloud features.

---

*Document Version: 2.0*  
*Last Updated: August 7, 2025*  
*Command Structure: sentvibe [command]*  
*Classification: Technical Specification*
    # SentVibe CLI - Technical Development Document
## Version 2.0 | Project Codename: Universal AI Memory

---

## Executive Summary

**SentVibe** is a lightweight command-line tool that provides invisible infrastructure for AI-assisted development. Rather than being an LLM provider, it serves as a universal memory and sandbox layer that any AI tool (GitHub Copilot, Cursor, Claude, etc.) can leverage through simple VS Code integration and CLI commands.

**Core Philosophy:** Universal AI memory layer + invisible safety sandbox that works with any LLM.

---

## 1. Product Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SENTVIBE CLI TOOL                       │
├─────────────────────────────────────────────────────────────┤
│              Global CLI Command (`sentvibe`)               │
├─────────────────────────────────────────────────────────────┤
│         VS Code Integration (LSP + File Watchers)          │
├─────────────────────────────────────────────────────────────┤
│           Persistent Memory Engine (Local SQLite)          │
├─────────────────────────────────────────────────────────────┤
│         Lightweight Execution Sandbox (Node.js)           │
├─────────────────────────────────────────────────────────────┤
│              Context Export API (JSON/Markdown)            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles
1. **LLM Agnostic:** Works with any AI tool through context sharing
2. **Universal Memory:** Project knowledge persists across all AI interactions
3. **Invisible Operation:** Runs in background, minimal user interaction
4. **Safe Execution:** Sandbox for testing AI-generated code
5. **Modern Dependencies:** Zero deprecated warnings, latest stable packages

---

## 2. Technical Specifications

### 2.1 CLI Tool Architecture

#### 2.1.1 Package Configuration
```json
{
  "name": "sentvibe",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "bin": {
    "sentvibe": "./dist/bin/cli.js",
    "sv": "./dist/bin/cli.js"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "chokidar": "^3.6.0",
    "commander": "^11.1.0",
    "picocolors": "^1.0.0",
    "ora": "^7.0.1",
    "prompts": "^2.4.2",
    "execa": "^8.0.1",
    "fast-glob": "^3.3.2",
    "ignore": "^5.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "tsup": "^8.0.1",
    "vitest": "^1.2.0"
  }
}
```

#### 2.1.2 CLI Command Structure
```typescript
// src/bin/cli.ts
import { Command } from 'commander';
import { init, start, stop, status, memory, sandbox } from '../commands/index.js';

const program = new Command();

program
  .name('sentvibe')
  .description('Universal AI memory and sandbox for developers')
  .version('1.0.0');

// Core commands
program
  .command('init')
  .description('Initialize project with SentVibe')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(init);

program
  .command('start')
  .description('Start background memory and file watching')
  .option('-d, --daemon', 'Run as background daemon')
  .action(start);

program
  .command('stop')
  .description('Stop background services')
  .action(stop);

program
  .command('status')
  .description('Show current status and statistics')
  .action(status);

// Memory commands
const memoryCmd = program
  .command('memory')
  .description('Project memory operations');

memoryCmd
  .command('search <query>')
  .description('Search project memory')
  .option('-l, --limit <number>', 'Number of results', '5')
  .action(memory.search);

memoryCmd
  .command('context')
  .description('Generate context for current state')
  .option('-f, --format <format>', 'Output format (json|markdown)', 'markdown')
  .action(memory.context);

memoryCmd
  .command('clear')
  .description('Clear project memory')
  .option('--confirm', 'Skip confirmation prompt')
  .action(memory.clear);

// Sandbox commands  
const sandboxCmd = program
  .command('sandbox')
  .description('Code execution sandbox');

sandboxCmd
  .command('test [files...]')
  .description('Run tests in sandbox')
  .action(sandbox.test);

sandboxCmd
  .command('run <command>')
  .description('Execute command in sandbox')
  .action(sandbox.run);

sandboxCmd
  .command('clean')
  .description('Clean sandbox artifacts')
  .action(sandbox.clean);

program.parse();
```

#### 2.1.3 Core CLI Implementation
```typescript
// src/commands/init.ts
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { ProjectMemory } from '../memory/index.js';
import { colors, spinner } from '../utils/index.js';
import { setupVSCodeIntegration } from '../vscode/setup.js';

export async function init(options: { force?: boolean }) {
  const cwd = process.cwd();
  const configDir = join(cwd, '.sentvibe');
  
  if (existsSync(configDir) && !options.force) {
    console.log(colors.yellow('Project already initialized. Use --force to overwrite.'));
    return;
  }
  
  const spin = spinner('Initializing SentVibe...').start();
  
  try {
    // Create configuration directory
    mkdirSync(configDir, { recursive: true });
    
    // Initialize memory database
    const memory = new ProjectMemory(join(configDir, 'memory.db'));
    await memory.initialize();
    
    // Create configuration file
    const config = {
      version: '1.0.0',
      created: new Date().toISOString(),
      settings: {
        watchPatterns: ['**/*.{js,ts,jsx,tsx,py,go,rs,java,md}'],
        ignorePatterns: ['node_modules/**', '.git/**', 'dist/**', '.sentvibe/**'],
        memoryEnabled: true,
        sandboxEnabled: true,
        vsCodeIntegration: true
      }
    };
    
    writeFileSync(
      join(configDir, 'config.json'), 
      JSON.stringify(config, null, 2)
    );
    
    // Setup VS Code integration
    await setupVSCodeIntegration(cwd);
    
    // Create .gitignore entry
    const gitignorePath = join(cwd, '.gitignore');
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('.sentvibe/')) {
        appendFileSync(gitignorePath, '\n.sentvibe/\n');
      }
    } else {
      writeFileSync(gitignorePath, '.sentvibe/\n');
    }
    
    spin.succeed('Project initialized successfully!');
    
    console.log('\nNext steps:');
    console.log('  • Run: sentvibe start');
    console.log('  • Use any AI tool in VS Code');
    console.log('  • Access context: sentvibe memory context');
    console.log('  • Search memory: sentvibe memory search "query"');
    
  } catch (error) {
    spin.fail('Initialization failed');
    console.error(colors.red(error.message));
    process.exit(1);
  }
}

// src/commands/start.ts
export async function start(options: { daemon?: boolean }) {
  const configPath = join(process.cwd(), '.sentvibe/config.json');
  
  if (!existsSync(configPath)) {
    console.log(colors.red('Project not initialized. Run: sentvibe init'));
    return;
  }
  
  const spin = spinner('Starting SentVibe services...').start();
  
  try {
    const memory = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    await memory.initialize();
    
    // Start file watching
    await memory.startFileWatcher();
    
    // Start LSP server for VS Code integration
    await startLSPServer();
    
    spin.succeed('SentVibe is running');
    
    if (options.daemon) {
      process.on('SIGINT', async () => {
        await memory.cleanup();
        process.exit(0);
      });
      
      // Keep process alive
      setInterval(() => {}, 1000);
    } else {
      console.log('Press Ctrl+C to stop');
      console.log('Services running:');
      console.log('  • File watching: Active');
      console.log('  • Memory logging: Active');
      console.log('  • VS Code integration: Active');
    }
    
  } catch (error) {
    spin.fail('Failed to start services');
    console.error(colors.red(error.message));
    process.exit(1);
  }
}

// src/commands/memory.ts
export const memory = {
  async search(query: string, options: { limit: string }) {
    const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    const results = await memoryDb.searchMemory(query, parseInt(options.limit));
    
    if (results.length === 0) {
      console.log(colors.yellow(`No memories found for: "${query}"`));
      return;
    }
    
    console.log(colors.blue(`Found ${results.length} memories for: "${query}"\n`));
    
    results.forEach((result, index) => {
      console.log(`${colors.cyan(`${index + 1}.`)} ${result.intent}`);
      console.log(`   ${colors.gray('Outcome:')} ${result.outcome}`);
      console.log(`   ${colors.gray('File:')} ${result.filePath || 'Multiple files'}`);
      console.log(`   ${colors.gray('When:')} ${new Date(result.timestamp).toLocaleDateString()}`);
      console.log('');
    });
  },
  
  async context(options: { format: 'json' | 'markdown' }) {
    const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    const context = await memoryDb.getContextForAI(options.format);
    
    console.log(context);
  },
  
  async clear(options: { confirm?: boolean }) {
    if (!options.confirm) {
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to clear all project memory?'
      });
      
      if (!confirm) {
        console.log('Cancelled');
        return;
      }
    }
    
    const memoryDb = new ProjectMemory(join(process.cwd(), '.sentvibe/memory.db'));
    await memoryDb.clearMemory();
    
    console.log(colors.green('Project memory cleared'));
  }
};
```

### 2.2 VS Code Integration (Without Extension)

#### 2.2.1 Language Server Protocol Integration
```typescript
// src/vscode/lsp-server.ts
import { 
  createConnection, 
  TextDocuments, 
  ProposedFeatures,
  TextDocumentSyncKind,
  CompletionItem,
  CompletionItemKind,
  InitializeParams,
  InitializeResult
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ProjectMemory } from '../memory/index.js';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
let memory: ProjectMemory;

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const workspaceFolder = params.workspaceFolders?.[0]?.uri;
  if (workspaceFolder) {
    const workspacePath = workspaceFolder.replace('file://', '');
    memory = new ProjectMemory(join(workspacePath, '.sentvibe/memory.db'));
  }
  
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['@', '#', '/']
      },
      hoverProvider: true,
      codeActionProvider: true
    }
  };
});

// Provide context completions with @sentvibe trigger
connection.onCompletion(async (params): Promise<CompletionItem[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !memory) return [];
  
  const text = document.getText();
  const position = params.position;
  const line = text.split('\n')[position.line];
  const lineText = line.substring(0, position.character);
  
  // Trigger on @sentvibe
  if (lineText.includes('@sentvibe') || lineText.includes('@sv')) {
    const recentContext = await memory.getRecentContext(10);
    return recentContext.map((item, index) => ({
      label: `${item.intent}`,
      kind: CompletionItemKind.Snippet,
      detail: `SentVibe Memory: ${item.outcome}`,
      documentation: `File: ${item.filePath || 'Multiple'}\nWhen: ${new Date(item.timestamp).toLocaleDateString()}`,
      insertText: `\n// Context: ${item.intent}\n// Result: ${item.outcome}\n// Reference: ${item.filePath || 'Multiple files'}\n`,
      sortText: `000${index}`,
      filterText: `sentvibe ${item.intent} ${item.outcome}`
    }));
  }
  
  // Trigger on // search: pattern
  if (lineText.includes('// search:') || lineText.includes('# search:')) {
    const searchQuery = lineText.split('search:')[1]?.trim();
    if (searchQuery && searchQuery.length > 2) {
      const searchResults = await memory.searchMemory(searchQuery, 5);
      return searchResults.map((result, index) => ({
        label: `Found: ${result.intent}`,
        kind: CompletionItemKind.Reference,
        detail: `SentVibe Search Result`,
        documentation: result.outcome,
        insertText: `\n// Found in memory: ${result.intent}\n// ${result.outcome}\n`,
        sortText: `100${index}`
      }));
    }
  }
  
  return [];
});

connection.onHover(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !memory) return null;
  
  const position = params.position;
  const text = document.getText();
  const lines = text.split('\n');
  const line = lines[position.line];
  
  // Check if hovering over @sentvibe or similar patterns
  if (line.includes('@sentvibe') || line.includes('@sv')) {
    const stats = await memory.getStats();
    return {
      contents: {
        kind: 'markdown',
        value: `**SentVibe Context Available**\n\n• Total memories: ${stats.totalEntries}\n• Last update: ${stats.lastUpdate}\n• Use \`sentvibe memory context\` for full context\n• Use \`@sentvibe\` trigger for completions`
      }
    };
  }
  
  // Check for memory references in comments
  const memoryKeywords = ['context', 'memory', 'sentvibe', 'previous', 'similar'];
  const hasKeyword = memoryKeywords.some(keyword => 
    line.toLowerCase().includes(keyword)
  );
  
  if (hasKeyword) {
    return {
      contents: {
        kind: 'markdown',
        value: `**SentVibe Tip**\n\nUse \`@sentvibe\` to get relevant project context and patterns from memory.`
      }
    };
  }
  
  return null;
});

// Provide code actions for memory integration
connection.onCodeAction(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !memory) return [];
  
  const actions = [];
  
  // Add action to insert project context
  actions.push({
    title: 'Insert SentVibe Context',
    kind: 'quickfix',
    edit: {
      changes: {
        [params.textDocument.uri]: [{
          range: params.range,
          newText: '\n// @sentvibe - Use tab to see project context\n'
        }]
      }
    }
  });
  
  return actions;
});

documents.listen(connection);
connection.listen();

export function startLSPServer(): Promise<void> {
  return new Promise((resolve) => {
    // LSP server starts listening
    resolve();
  });
}
```

#### 2.2.2 VS Code Integration Setup
```typescript
// src/vscode/setup.ts
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

export async function setupVSCodeIntegration(projectRoot: string): Promise<void> {
  const vscodeDir = join(projectRoot, '.vscode');
  const settingsPath = join(vscodeDir, 'settings.json');
  
  if (!existsSync(vscodeDir)) {
    mkdirSync(vscodeDir, { recursive: true });
  }
  
  // Read existing settings or create new
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    } catch (error) {
      console.warn('Could not parse existing VS Code settings');
    }
  }
  
  // Add SentVibe integration settings
  const sentvibeSettings = {
    // Enable file watching for memory updates
    "files.watcherExclude": {
      "**/.sentvibe/**": false
    },
    
    // Optimize for AI assistance
    "editor.inlineSuggest.enabled": true,
    "editor.suggest.snippetsPreventQuickSuggestions": false,
    
    // Better context for AI tools
    "editor.suggest.showWords": true,
    "editor.suggest.showSnippets": true,
    
    // SentVibe specific settings
    "sentvibe.enableContextSnippets": true,
    "sentvibe.autoMemoryLogging": true
  };
  
  // Merge settings without overwriting existing ones
  Object.keys(sentvibeSettings).forEach(key => {
    if (!(key in settings)) {
      settings[key] = sentvibeSettings[key];
    }
  });
  
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  
  // Create tasks.json for quick commands
  const tasksPath = join(vscodeDir, 'tasks.json');
  if (!existsSync(tasksPath)) {
    const tasks = {
      "version": "2.0.0",
      "tasks": [
        {
          "label": "SentVibe: Get Context",
          "type": "shell",
          "command": "sentvibe memory context",
          "group": "build",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "panel": "new"
          }
        },
        {
          "label": "SentVibe: Search Memory",
          "type": "shell",
          "command": "sentvibe memory search \"${input:searchQuery}\"",
          "group": "build",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "panel": "new"
          }
        },
        {
          "label": "SentVibe: Run Tests in Sandbox",
          "type": "shell",
          "command": "sentvibe sandbox test",
          "group": "test"
        }
      ],
      "inputs": [
        {
          "id": "searchQuery",
          "description": "Enter search query for SentVibe memory",
          "default": "",
          "type": "promptString"
        }
      ]
    };
    
    writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  }
  
  // Create keybindings suggestion file
  const keybindingsPath = join(vscodeDir, 'keybindings.json');
  if (!existsSync(keybindingsPath)) {
    const keybindings = [
      {
        "key": "ctrl+shift+v ctrl+c",
        "command": "workbench.action.tasks.runTask",
        "args": "SentVibe: Get Context"
      },
      {
        "key": "ctrl+shift+v ctrl+s",
        "command": "workbench.action.tasks.runTask",
        "args": "SentVibe: Search Memory"
      }
    ];
    
    writeFileSync(keybindingsPath, JSON.stringify(keybindings, null, 2));
  }
}
```

### 2.3 Memory Engine Implementation

#### 2.3.1 Enhanced Database Schema
```sql
-- Project memory with comprehensive tracking
CREATE TABLE IF NOT EXISTS project_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_path TEXT,
  intent TEXT NOT NULL,
  outcome TEXT NOT NULL,
  code_snippet TEXT,
  test_results TEXT,
  context_hash TEXT UNIQUE,
  tags TEXT, -- JSON array of tags
  language TEXT,
  framework TEXT,
  confidence_score REAL DEFAULT 1.0
);

CREATE INDEX idx_timestamp ON project_memory(timestamp);
CREATE INDEX idx_file_path ON project_memory(file_path);
CREATE INDEX idx_context_hash ON project_memory(context_hash);
CREATE INDEX idx_language ON project_memory(language);
CREATE INDEX idx_confidence ON project_memory(confidence_score);

-- Full-text search with enhanced tokenization
CREATE VIRTUAL TABLE memory_fts USING fts5(
  intent, outcome, code_snippet, file_path, tags,
  content='project_memory',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- File watching metadata
CREATE TABLE IF NOT EXISTS file_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT UNIQUE NOT NULL,
  last_modified DATETIME,
  size_bytes INTEGER,
  content_hash TEXT,
  language TEXT,
  framework TEXT,
  change_type TEXT -- 'created', 'modified', 'deleted'
);

-- Context sessions for AI interactions tracking
CREATE TABLE IF NOT EXISTS context_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  ai_tool TEXT, -- 'copilot', 'cursor', 'claude', etc.
  context_provided TEXT,
  outcome TEXT,
  files_affected TEXT -- JSON array
);

-- Project statistics and insights
CREATE TABLE IF NOT EXISTS project_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE UNIQUE NOT NULL,
  total_memories INTEGER,
  files_changed INTEGER,
  ai_interactions INTEGER,
  successful_tests INTEGER,
  failed_tests INTEGER
);
```

#### 2.3.2 Memory Management Implementation
```typescript
// src/memory/project-memory.ts
import Database from 'better-sqlite3';
import { watch } from 'chokidar';
import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import { extname, relative } from 'path';
import fg from 'fast-glob';

export interface MemoryEntry {
  id?: number;
  timestamp: string;
  filePath?: string;
  intent: string;
  outcome: string;
  codeSnippet?: string;
  testResults?: string;
  contextHash: string;
  tags?: string[];
  language?: string;
  framework?: string;
  confidenceScore?: number;
}

export class ProjectMemory {
  private db: Database.Database;
  private watcher?: import('chokidar').FSWatcher;
  private projectRoot: string;
  
  constructor(private dbPath: string) {
    this.projectRoot = dbPath.replace('/.sentvibe/memory.db', '');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('cache_size = -64000'); // 64MB cache
  }
  
  async initialize(): Promise<void> {
    // Run schema migrations
    this.db.exec(SCHEMA_SQL);
    
    // Start file watching if not already running
    if (!this.watcher) {
      await this.startFileWatcher();
    }
    
    // Update daily stats
    await this.updateDailyStats();
  }
  
  async startFileWatcher(): Promise<void> {
    const patterns = ['**/*.{js,ts,jsx,tsx,py,go,rs,java,md,json,yaml,yml}'];
    const ignored = ['node_modules/**', '.git/**', '.sentvibe/**', 'dist/**', 'build/**'];
    
    this.watcher = watch(patterns, {
      cwd: this.projectRoot,
      ignored,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false
    });
    
    this.watcher.on('change', (path) => this.onFileChanged(path));
    this.watcher.on('add', (path) => this.onFileAdded(path));
    this.watcher.on('unlink', (path) => this.onFileDeleted(path));
  }
  
  private async onFileChanged(filePath: string): Promise<void> {
    try {
      const fullPath = join(this.projectRoot, filePath);
      const stats = statSync(fullPath);
      const content = readFileSync(fullPath, 'utf8');
      const contentHash = createHash('md5').update(content).digest('hex');
      const language = this.detectLanguage(filePath);
      const framework = this.detectFramework(content, language);
      
      // Update file metadata
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO file_metadata 
        (file_path, last_modified, size_bytes, content_hash, language, framework, change_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        filePath,
        stats.mtime.toISOString(),
        stats.size,
        contentHash,
        language,
        framework,
        'modified'
      );
      
      // Auto-generate memory entry for significant changes
      await this.generateAutoMemory(filePath, content, language, framework);
      
    } catch (error) {
      console.warn(`Failed to process file change: ${filePath}`, error);
    }
  }
  
  private async generateAutoMemory(
    filePath: string,
    content: string,
    language: string,
    framework: string
  ): Promise<void> {
    // Simple heuristics for auto-memory generation
    const lines = content.split('\n');
    const significantChanges = [];
    
    // Detect new functions/classes
    const functionPatterns = {
      javascript: /(?:function|const|let|var)\s+(\w+)|class\s+(\w+)/g,
      python: /def\s+(\w+)|class\s+(\w+)/g,
      go: /func\s+(\w+)|type\s+(\w+)/g,
      rust: /fn\s+(\w+)|struct\s+(\w+)/g
    };
    
    const pattern = functionPatterns[language] || functionPatterns.javascript;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      significantChanges.push(match[1] || match[2]);
    }
    
    // Detect imports/dependencies
    const importPatterns = {
      javascript: /import\s+.*from\s+['"]([^'"]+)['"]/g,
      python: /(?:import|from)\s+(\w+)/g
    };
    
    const importPattern = importPatterns[language];
    if (importPattern) {
      let importMatch;
      while ((importMatch = importPattern.exec(content)) !== null) {
        significantChanges.push(`import: ${importMatch[1]}`);
      }
    }
    
    if (significantChanges.length > 0) {
      const intent = `Modified ${filePath}: Added/changed ${significantChanges.length} elements`;
      const outcome = `Updated ${significantChanges.slice(0, 3).join(', ')}${significantChanges.length > 3 ? '...' : ''}`;
      
      await this.addMemory({
        filePath,
        intent,
        outcome,
        codeSnippet: this.extractRelevantSnippet(content, significantChanges[0]),
        language,
        framework,
        confidenceScore: 0.7, // Auto-generated has lower confidence
        tags: ['auto-generated', language, framework].filter(Boolean),
        timestamp: new Date().toISOString(),
        contextHash: this.generateContextHash({ intent, outcome, filePath })
      });
    }
  }
  
  async addMemory(entry: MemoryEntry): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO project_memory 
      (file_path, intent, outcome, code_snippet, test_results, context_hash, tags, language, framework, confidence_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      entry.filePath,
      entry.intent,
      entry.outcome,
      entry.codeSnippet,
      entry.testResults,
      entry.contextHash,
      JSON.stringify(entry.tags || []),
      entry.language,
      entry.framework,
      entry.confidenceScore || 1.0
    );
    
    // Update FTS index
    this.db.exec('INSERT INTO memory_fts(memory_fts) VALUES("rebuild");');
  }
  
  async searchMemory(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    // Enhanced search with ranking
    const stmt = this.db.prepare(`
      SELECT m.*, 
             rank AS relevance_score,
             (confidence_score * 0.7 + (CASE WHEN timestamp > datetime('now', '-7 days') THEN 0.3 ELSE 0.1 END)) AS final_score
      FROM project_memory m
      JOIN (
        SELECT rowid, rank 
        FROM memory_fts 
        WHERE memory_fts MATCH ? 
        ORDER BY rank
      ) fts ON m.id = fts.rowid
      ORDER BY final_score DESC, timestamp DESC
      LIMIT ?
    `);
    
    return stmt.all(query, limit).map(this.rowToMemoryEntry);
  }
  
  async getRecentContext(limit: number = 10): Promise<MemoryEntry[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM project_memory 
      WHERE confidence_score > 0.5
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    return stmt.all(limit).map(this.rowToMemoryEntry);
  }
  
  async getContextForAI(format: 'json' | 'markdown' = 'markdown'): Promise<string> {
    const recentMemories = await this.getRecentContext(15);
    const fileStructure = await this.getProjectStructure();
    const stats = await this.getStats();
    
    if (format === 'json') {
      return JSON.stringify({
        projectStructure: fileStructure,
        recentMemories,
        stats,
        lastUpdated: new Date().toISOString()
      }, null, 2);
    }
    
    // Markdown format optimized for AI consumption
    return `# SentVibe Project Context

## Project Overview
- **Total Memories:** ${stats.totalEntries}
- **Files Tracked:** ${stats.filesTracked}
- **Last Activity:** ${stats.lastUpdate}
- **Primary Languages:** ${stats.topLanguages.join(', ')}

## Recent Development History
${recentMemories.map(m => `
### ${m.intent}
- **Outcome:** ${m.outcome}
- **File:** ${m.filePath || 'Multiple files'}
- **Language:** ${m.language || 'Unknown'}
- **When:** ${new Date(m.timestamp).toLocaleDateString()}
${m.codeSnippet ? `- **Code Example:**\n\`\`\`${m.language}\n${m.codeSnippet.substring(0, 200)}${m.codeSnippet.length > 200 ? '...' : ''}\n\`\`\`` : ''}
`).join('')}

## Project Structure
\`\`\`
${fileStructure.slice(0, 50).join('\n')}${fileStructure.length > 50 ? '\n... and more files' : ''}
\`\`\`

## Usage Tips for AI
- Reference recent patterns and outcomes when suggesting similar features
- Consider the project's language and framework preferences
- Use established naming conventions from the codebase
- Build upon successful patterns from memory

---
*Context generated by SentVibe CLI at ${new Date().toISOString()}*
*Use 'sentvibe memory search <query>' to find specific context*
`;
  }
  
  async getProjectStructure(): Promise<string[]> {
    try {
      const files = await fg(['**/*'], {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**', '.sentvibe/**', 'dist/**', 'build/**'],
        onlyFiles: true,
        markDirectories: false
      });
      
      return files.sort();
    } catch (error) {
      return ['Error reading project structure'];
    }
  }
  
  async getStats(): Promise<ProjectStats> {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM project_memory');
    const filesStmt = this.db.prepare('SELECT COUNT(*) as count FROM file_metadata');
    const languagesStmt = this.db.prepare(`
      SELECT language, COUNT(*) as count 
      FROM project_memory 
      WHERE language IS NOT NULL 
      GROUP BY language 
      ORDER BY count DESC 
      LIMIT 5
    `);
    const lastUpdateStmt = this.db.prepare('SELECT MAX(timestamp) as last_update FROM project_memory');
    
    const total = totalStmt.get() as { count: number };
    const files = filesStmt.get() as { count: number };
    const languages = languagesStmt.all() as { language: string; count: number }[];
    const lastUpdate = lastUpdateStmt.get() as { last_update: string };
    
    return {
      totalEntries: total.count,
      filesTracked: files.count,
      topLanguages: languages.map(l => l.language),
      lastUpdate: lastUpdate.last_update ? new Date(lastUpdate.last_update).toLocaleDateString() : 'Never'
    };
  }
  
  async clearMemory(): Promise<void> {
    this.db.exec('DELETE FROM project_memory');
    this.db.exec('DELETE FROM memory_fts');
    this.db.exec('DELETE FROM context_sessions');
    this.db.exec('DELETE FROM project_stats');
  }
  
  private detectLanguage(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.md': 'markdown',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml'
    };
    
    return languageMap[ext] || 'unknown';
  }
  
  private detectFramework(content: string, language: string): string {
    const frameworks = {
      javascript: [
        { pattern: /import.*react/i, name: 'react' },
        { pattern: /import.*vue/i, name: 'vue' },
        { pattern: /import.*angular/i, name: 'angular' },
        { pattern: /import.*express/i, name: 'express' },
        { pattern: /import.*next/i, name: 'nextjs' }
      ],
      python: [
        { pattern: /import django/i, name: 'django' },
        { pattern: /from flask/i, name: 'flask' },
        { pattern: /import fastapi/i, name: 'fastapi' },
        { pattern: /import pandas/i, name: 'data-science' }
      ]
    };
    
    const langFrameworks = frameworks[language] || [];
    for (const fw of langFrameworks) {
      if (fw.pattern.test(content)) {
        return fw.name;
      }
    }
    
    return null;
  }
  
  private extractRelevantSnippet(content: string, target: string): string {
    const lines = content.split('\n');
    const targetIndex = lines.findIndex(line => line.includes(target));
    
    if (targetIndex === -1) return null;
    
    const start = Math.max(0, targetIndex - 2);
    const end = Math.min(lines.length, targetIndex + 5);
    
    return lines.slice(start, end).join('\n');
  }
  
  private generateContextHash(entry: Partial<MemoryEntry>): string {
    const data = `${entry.intent}-${entry.outcome}-${entry.filePath}`;
    return createHash('md5').update(data).digest('hex');
  }
  
  private rowToMemoryEntry(row: any): MemoryEntry {
    return {
      id: row.id,
      timestamp: row.timestamp,
      filePath: row.file_path,
      intent: row.intent,
      outcome: row.outcome,
      codeSnippet: row.code_snippet,
      testResults: row.test_results,
      contextHash: row.context_hash,
      tags: row.tags ? JSON.parse(row.tags) : [],
      language: row.language,
      framework: row.framework,
      confidenceScore: row.confidence_score
    };
  }
  
  async cleanup(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
    }
    this.db.close();
  }
}

interface ProjectStats {
  totalEntries: number;
  filesTracked: number;
  topLanguages: string[];
  lastUpdate: string;
}