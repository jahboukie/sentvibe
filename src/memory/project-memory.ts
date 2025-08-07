import Database from 'better-sqlite3';
import { watch } from 'chokidar';
import { createHash } from 'crypto';
import { readFileSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import type {
  MemoryEntry,
  ProjectStats
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ProjectMemory {
  private db: Database.Database;
  private watcher?: import('chokidar').FSWatcher | undefined;
  private projectRoot: string;
  private isInitialized = false;

  constructor(dbPath: string) {
    this.projectRoot = dbPath.replace('/.sentvibe/memory.db', '').replace('\\.sentvibe\\memory.db', '');
    this.watcher = undefined;
    
    // Initialize database
    if (!existsSync(dbPath)) {
      // Create empty file for now
      require('fs').writeFileSync(dbPath, '');
    }
    
    try {
      this.db = new Database(dbPath);
      this.setupDatabase();
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private setupDatabase(): void {
    try {
      // Enable WAL mode for better performance and concurrent access
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('cache_size = -64000'); // 64MB cache
      this.db.pragma('synchronous = NORMAL'); // Better performance
      this.db.pragma('temp_store = MEMORY'); // Use memory for temp tables
      this.db.pragma('mmap_size = 268435456'); // 256MB memory map

      // Create tables and indexes
      this.createTables();
      this.createIndexes();
      this.setupFullTextSearch();

      logger.debug('Database setup completed with optimizations');
    } catch (error) {
      logger.error('Database setup failed:', error);
      throw error;
    }
  }

  private createTables(): void {
    // Enhanced project memory table with better schema
    this.db.exec(`
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
        confidence_score REAL DEFAULT 1.0,
        ai_agent TEXT,
        session_id TEXT,
        memory_type TEXT DEFAULT 'code', -- 'code', 'pattern', 'decision', 'bug_fix'
        importance_score REAL DEFAULT 1.0,
        related_memories TEXT, -- JSON array of related memory IDs
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enhanced file metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS file_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE NOT NULL,
        last_modified DATETIME,
        size_bytes INTEGER,
        content_hash TEXT,
        language TEXT,
        framework TEXT,
        change_type TEXT, -- 'created', 'modified', 'deleted'
        lines_of_code INTEGER,
        complexity_score REAL,
        test_coverage REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Code patterns table for learned patterns
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS code_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_type TEXT NOT NULL, -- 'architectural', 'naming', 'style', 'testing'
        pattern_name TEXT NOT NULL,
        pattern_description TEXT,
        pattern_code TEXT,
        language TEXT,
        framework TEXT,
        usage_count INTEGER DEFAULT 1,
        confidence_score REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pattern_type, pattern_name, language)
      )
    `);

    // AI interactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ai_agent TEXT NOT NULL,
        interaction_type TEXT, -- 'code_generation', 'question', 'refactor', 'debug'
        input_context TEXT,
        output_result TEXT,
        confidence_score REAL,
        success BOOLEAN DEFAULT TRUE,
        duration_ms INTEGER,
        memory_ids_used TEXT, -- JSON array of memory IDs referenced
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Project statistics table (enhanced)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE UNIQUE NOT NULL,
        total_memories INTEGER DEFAULT 0,
        files_changed INTEGER DEFAULT 0,
        ai_interactions INTEGER DEFAULT 0,
        successful_tests INTEGER DEFAULT 0,
        failed_tests INTEGER DEFAULT 0,
        patterns_learned INTEGER DEFAULT 0,
        avg_confidence REAL DEFAULT 0.0,
        lines_of_code INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private createIndexes(): void {
    // Project memory indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_memory_timestamp ON project_memory(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_memory_file_path ON project_memory(file_path);
      CREATE INDEX IF NOT EXISTS idx_memory_context_hash ON project_memory(context_hash);
      CREATE INDEX IF NOT EXISTS idx_memory_language ON project_memory(language);
      CREATE INDEX IF NOT EXISTS idx_memory_framework ON project_memory(framework);
      CREATE INDEX IF NOT EXISTS idx_memory_confidence ON project_memory(confidence_score DESC);
      CREATE INDEX IF NOT EXISTS idx_memory_type ON project_memory(memory_type);
      CREATE INDEX IF NOT EXISTS idx_memory_importance ON project_memory(importance_score DESC);
      CREATE INDEX IF NOT EXISTS idx_memory_ai_agent ON project_memory(ai_agent);
    `);

    // File metadata indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_file_path ON file_metadata(file_path);
      CREATE INDEX IF NOT EXISTS idx_file_language ON file_metadata(language);
      CREATE INDEX IF NOT EXISTS idx_file_modified ON file_metadata(last_modified DESC);
      CREATE INDEX IF NOT EXISTS idx_file_size ON file_metadata(size_bytes);
      CREATE INDEX IF NOT EXISTS idx_file_complexity ON file_metadata(complexity_score);
    `);

    // Code patterns indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pattern_type ON code_patterns(pattern_type);
      CREATE INDEX IF NOT EXISTS idx_pattern_language ON code_patterns(language);
      CREATE INDEX IF NOT EXISTS idx_pattern_usage ON code_patterns(usage_count DESC);
      CREATE INDEX IF NOT EXISTS idx_pattern_confidence ON code_patterns(confidence_score DESC);
    `);

    // AI interactions indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ai_agent ON ai_interactions(ai_agent);
      CREATE INDEX IF NOT EXISTS idx_ai_type ON ai_interactions(interaction_type);
      CREATE INDEX IF NOT EXISTS idx_ai_timestamp ON ai_interactions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_confidence ON ai_interactions(confidence_score DESC);
    `);
  }

  private setupFullTextSearch(): void {
    // Create FTS5 virtual table for full-text search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memory_search USING fts5(
        intent,
        outcome,
        code_snippet,
        tags,
        content='project_memory',
        content_rowid='id'
      );
    `);

    // Create triggers to keep FTS table in sync
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS memory_search_insert AFTER INSERT ON project_memory BEGIN
        INSERT INTO memory_search(rowid, intent, outcome, code_snippet, tags)
        VALUES (new.id, new.intent, new.outcome, new.code_snippet, new.tags);
      END;
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS memory_search_delete AFTER DELETE ON project_memory BEGIN
        INSERT INTO memory_search(memory_search, rowid, intent, outcome, code_snippet, tags)
        VALUES ('delete', old.id, old.intent, old.outcome, old.code_snippet, old.tags);
      END;
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS memory_search_update AFTER UPDATE ON project_memory BEGIN
        INSERT INTO memory_search(memory_search, rowid, intent, outcome, code_snippet, tags)
        VALUES ('delete', old.id, old.intent, old.outcome, old.code_snippet, old.tags);
        INSERT INTO memory_search(rowid, intent, outcome, code_snippet, tags)
        VALUES (new.id, new.intent, new.outcome, new.code_snippet, new.tags);
      END;
    `);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Start file watching if not already running
      if (!this.watcher) {
        await this.startFileWatcher();
      }

      // Update daily stats
      await this.updateDailyStats();

      this.isInitialized = true;
      logger.debug('ProjectMemory initialized successfully');
    } catch (error) {
      logger.error('ProjectMemory initialization failed:', error);
      throw error;
    }
  }

  async startFileWatcher(): Promise<void> {
    const patterns = ['**/*.{js,ts,jsx,tsx,py,go,rs,java,md,json,yaml,yml}'];
    const ignored = ['node_modules/**', '.git/**', '.sentvibe/**', 'dist/**', 'build/**'];

    try {
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

      logger.debug('File watcher started');
    } catch (error) {
      logger.error('Failed to start file watcher:', error);
      throw error;
    }
  }

  private async onFileChanged(filePath: string): Promise<void> {
    try {
      const fullPath = join(this.projectRoot, filePath);
      const stats = statSync(fullPath);
      const content = readFileSync(fullPath, 'utf8');
      const contentHash = createHash('md5').update(content).digest('hex');
      const language = this.detectLanguage(filePath);

      // Update file metadata
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO file_metadata 
        (file_path, last_modified, size_bytes, content_hash, language, change_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        filePath,
        stats.mtime.toISOString(),
        stats.size,
        contentHash,
        language,
        'modified'
      );

      logger.debug(`File changed: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to process file change: ${filePath}`, error);
    }
  }

  private async onFileAdded(filePath: string): Promise<void> {
    logger.debug(`File added: ${filePath}`);
    await this.onFileChanged(filePath); // Same processing as change
  }

  private async onFileDeleted(filePath: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE file_metadata 
        SET change_type = 'deleted' 
        WHERE file_path = ?
      `);
      stmt.run(filePath);

      logger.debug(`File deleted: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to process file deletion: ${filePath}`, error);
    }
  }

  private detectLanguage(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.md': 'markdown',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
    };
    return languageMap[ext] || 'unknown';
  }

  async addMemory(entry: MemoryEntry): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO project_memory 
        (file_path, intent, outcome, code_snippet, test_results, context_hash, tags, language, framework, confidence_score, ai_agent, session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        entry.confidenceScore || 1.0,
        entry.aiAgent,
        entry.sessionId
      );

      logger.debug('Memory entry added:', entry.intent);
    } catch (error) {
      logger.error('Failed to add memory:', error);
      throw error;
    }
  }

  async searchMemory(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    try {
      // Use FTS5 for intelligent full-text search
      const ftsStmt = this.db.prepare(`
        SELECT pm.*,
               ms.rank,
               snippet(memory_search, 0, '<mark>', '</mark>', '...', 32) as snippet
        FROM memory_search ms
        JOIN project_memory pm ON pm.id = ms.rowid
        WHERE memory_search MATCH ?
        ORDER BY ms.rank, pm.importance_score DESC, pm.timestamp DESC
        LIMIT ?
      `);

      let rows = ftsStmt.all(query, limit);

      // Fallback to LIKE search if FTS returns no results
      if (rows.length === 0) {
        const likeStmt = this.db.prepare(`
          SELECT *, 1.0 as rank, NULL as snippet FROM project_memory
          WHERE intent LIKE ? OR outcome LIKE ? OR code_snippet LIKE ? OR tags LIKE ?
          ORDER BY importance_score DESC, confidence_score DESC, timestamp DESC
          LIMIT ?
        `);

        const searchPattern = `%${query}%`;
        rows = likeStmt.all(searchPattern, searchPattern, searchPattern, searchPattern, limit);
      }

      return rows.map(this.mapRowToMemoryEntry);
    } catch (error) {
      logger.error('Memory search failed:', error);

      // Fallback to simple search
      try {
        const fallbackStmt = this.db.prepare(`
          SELECT * FROM project_memory
          WHERE intent LIKE ? OR outcome LIKE ?
          ORDER BY timestamp DESC
          LIMIT ?
        `);

        const searchPattern = `%${query}%`;
        const rows = fallbackStmt.all(searchPattern, searchPattern, limit);
        return rows.map(this.mapRowToMemoryEntry);
      } catch (fallbackError) {
        logger.error('Fallback search also failed:', fallbackError);
        return [];
      }
    }
  }

  async getStats(): Promise<ProjectStats> {
    try {
      const totalEntries = this.db.prepare('SELECT COUNT(*) as count FROM project_memory').get() as { count: number };
      const filesTracked = this.db.prepare('SELECT COUNT(DISTINCT file_path) as count FROM file_metadata').get() as { count: number };
      const lastUpdate = this.db.prepare('SELECT MAX(timestamp) as last FROM project_memory').get() as { last: string };

      return {
        totalEntries: totalEntries.count,
        filesTracked: filesTracked.count,
        aiInteractions: 0, // TODO: Implement
        sandboxSessions: 0, // TODO: Implement
        avgConfidence: 0, // TODO: Implement
        lastUpdate: lastUpdate.last || new Date().toISOString(),
        topLanguages: [], // TODO: Implement
        topFrameworks: [], // TODO: Implement
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return {
        totalEntries: 0,
        filesTracked: 0,
        aiInteractions: 0,
        sandboxSessions: 0,
        avgConfidence: 0,
        lastUpdate: new Date().toISOString(),
        topLanguages: [],
        topFrameworks: [],
      };
    }
  }

  async getContextForAI(format: 'json' | 'markdown' = 'markdown'): Promise<string> {
    try {
      const recentMemories = await this.getRecentMemories(10);
      const stats = await this.getStats();

      if (format === 'json') {
        return JSON.stringify({
          summary: 'SentVibe-enhanced project with AI-native development infrastructure',
          stats,
          recentMemories,
          patterns: [], // TODO: Implement pattern extraction
        }, null, 2);
      }

      // Markdown format
      return `# Project Context

## Summary
This is a SentVibe-enhanced project with AI-native development infrastructure.

## Statistics
- Total memories: ${stats.totalEntries}
- Files tracked: ${stats.filesTracked}
- Last update: ${stats.lastUpdate}

## Recent Memories
${recentMemories.length > 0 
  ? recentMemories.map(m => `- **${m.intent}**: ${m.outcome}`).join('\n')
  : 'No memories recorded yet. Start coding to build project memory!'
}

## Available Commands
- \`@sentvibe\` - Get project context
- \`@sentvibe patterns [tech]\` - Find technology patterns
- \`@sentvibe similar [desc]\` - Find similar implementations
- \`// search: [query]\` - Search project memory
`;
    } catch (error) {
      logger.error('Failed to generate context:', error);
      return 'Failed to generate context';
    }
  }

  private async getRecentMemories(limit: number): Promise<MemoryEntry[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM project_memory 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);

      const rows = stmt.all(limit);
      return rows.map(this.mapRowToMemoryEntry);
    } catch (error) {
      logger.error('Failed to get recent memories:', error);
      return [];
    }
  }

  private mapRowToMemoryEntry(row: any): MemoryEntry {
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
      confidenceScore: row.confidence_score,
      aiAgent: row.ai_agent,
      sessionId: row.session_id,
    };
  }

  async addCodePattern(pattern: {
    type: string;
    name: string;
    description: string;
    code: string;
    language: string;
    framework?: string;
  }): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO code_patterns
        (pattern_type, pattern_name, pattern_description, pattern_code, language, framework, usage_count, updated_at)
        VALUES (?, ?, ?, ?, ?, ?,
          COALESCE((SELECT usage_count + 1 FROM code_patterns WHERE pattern_type = ? AND pattern_name = ? AND language = ?), 1),
          CURRENT_TIMESTAMP)
      `);

      stmt.run(
        pattern.type,
        pattern.name,
        pattern.description,
        pattern.code,
        pattern.language,
        pattern.framework || null,
        pattern.type,
        pattern.name,
        pattern.language
      );

      logger.debug(`Code pattern added: ${pattern.type}/${pattern.name}`);
    } catch (error) {
      logger.error('Failed to add code pattern:', error);
    }
  }

  async getPatterns(language?: string, type?: string, limit: number = 20): Promise<any[]> {
    try {
      let query = `
        SELECT * FROM code_patterns
        WHERE 1=1
      `;
      const params: any[] = [];

      if (language) {
        query += ` AND language = ?`;
        params.push(language);
      }

      if (type) {
        query += ` AND pattern_type = ?`;
        params.push(type);
      }

      query += ` ORDER BY usage_count DESC, confidence_score DESC LIMIT ?`;
      params.push(limit);

      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      logger.error('Failed to get patterns:', error);
      return [];
    }
  }

  async trackAIInteraction(interaction: {
    aiAgent: string;
    type: string;
    inputContext: string;
    outputResult: string;
    confidenceScore?: number;
    success?: boolean;
    durationMs?: number;
    memoryIdsUsed?: number[];
  }): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO ai_interactions
        (ai_agent, interaction_type, input_context, output_result, confidence_score, success, duration_ms, memory_ids_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        interaction.aiAgent,
        interaction.type,
        interaction.inputContext,
        interaction.outputResult,
        interaction.confidenceScore || null,
        interaction.success !== false,
        interaction.durationMs || null,
        interaction.memoryIdsUsed ? JSON.stringify(interaction.memoryIdsUsed) : null
      );

      logger.debug(`AI interaction tracked: ${interaction.aiAgent}/${interaction.type}`);
    } catch (error) {
      logger.error('Failed to track AI interaction:', error);
    }
  }

  async findSimilarMemories(intent: string, limit: number = 5): Promise<MemoryEntry[]> {
    try {
      // Use semantic similarity based on intent and outcome
      const stmt = this.db.prepare(`
        SELECT *,
               (CASE
                 WHEN intent LIKE ? THEN 3
                 WHEN outcome LIKE ? THEN 2
                 WHEN code_snippet LIKE ? THEN 1
                 ELSE 0
               END) as similarity_score
        FROM project_memory
        WHERE similarity_score > 0
        ORDER BY similarity_score DESC, confidence_score DESC, timestamp DESC
        LIMIT ?
      `);

      const searchPattern = `%${intent}%`;
      const rows = stmt.all(searchPattern, searchPattern, searchPattern, limit);
      return rows.map(this.mapRowToMemoryEntry);
    } catch (error) {
      logger.error('Failed to find similar memories:', error);
      return [];
    }
  }

  private async updateDailyStats(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const stats = this.db.prepare(`
        SELECT
          COUNT(*) as total_memories,
          COUNT(DISTINCT file_path) as files_changed,
          AVG(confidence_score) as avg_confidence
        FROM project_memory
        WHERE DATE(timestamp) = ?
      `).get(today) as any;

      const aiInteractions = this.db.prepare(`
        SELECT COUNT(*) as count FROM ai_interactions WHERE DATE(created_at) = ?
      `).get(today) as any;

      const patterns = this.db.prepare(`
        SELECT COUNT(*) as count FROM code_patterns WHERE DATE(created_at) = ?
      `).get(today) as any;

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO project_stats
        (date, total_memories, files_changed, ai_interactions, patterns_learned, avg_confidence)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        today,
        stats.total_memories || 0,
        stats.files_changed || 0,
        aiInteractions.count || 0,
        patterns.count || 0,
        stats.avg_confidence || 0.0
      );

      logger.debug('Daily stats updated');
    } catch (error) {
      logger.error('Failed to update daily stats:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = undefined;
      }

      if (this.db) {
        this.db.close();
      }

      logger.debug('ProjectMemory cleanup completed');
    } catch (error) {
      logger.error('ProjectMemory cleanup failed:', error);
    }
  }
}
