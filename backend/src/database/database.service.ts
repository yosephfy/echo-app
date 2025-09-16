import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeDatabase();
    } catch (error) {
      this.logger.error('Failed to initialize database', error);
    }
  }

  private async initializeDatabase() {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Enable pg_trgm extension for better text search
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
      this.logger.log('pg_trgm extension enabled');

      // Create GIN index on secret text for full-text search using pg_trgm
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_secret_text_gin_trgm 
        ON secret USING gin (text gin_trgm_ops);
      `);
      this.logger.log('GIN trigram index created on secret.text');

      // Create index on secret_tags for tag filtering
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_secret_tags_secret_id 
        ON secret_tags ("secretId");
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_secret_tags_tag_id 
        ON secret_tags ("tagId");
      `);
      this.logger.log('Indexes created on secret_tags join table');

      // Create index on secret_moods for mood filtering
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_secret_moods_secret_id 
        ON secret_moods ("secretId");
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_secret_moods_mood_id 
        ON secret_moods ("moodId");
      `);
      this.logger.log('Indexes created on secret_moods join table');

      // Create composite indexes for common search patterns
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_secret_status_created_at 
        ON secret (status, "createdAt" DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_secret_user_status 
        ON secret ("userId", status);
      `);
      this.logger.log('Composite indexes created for common search patterns');
    } catch (error) {
      this.logger.error('Error during database initialization:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Enhanced search with pg_trgm similarity and relevance scoring
   */
  async performEnhancedSearch(
    searchText: string,
    moods?: string[],
    tags?: string[],
    limit = 20,
    offset = 0,
  ): Promise<{ items: any[]; total: number }> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      let whereClause = `s.status IN ('published', 'under_review')`;
      let joinClause = '';
      const params: any[] = [];
      let paramIndex = 1;

      // Add similarity filter for text search
      if (searchText?.trim()) {
        whereClause += ` AND similarity(s.text, $${paramIndex}) > 0.1`;
        params.push(searchText);
        paramIndex++;
      }

      // Add mood filtering
      if (moods && moods.length > 0) {
        joinClause += ` JOIN secret_moods sm ON s.id = sm."secretId" JOIN mood m ON sm."moodId" = m.id`;
        whereClause += ` AND m.code = ANY($${paramIndex})`;
        params.push(moods);
        paramIndex++;
      }

      // Add tag filtering
      if (tags && tags.length > 0) {
        joinClause += ` JOIN secret_tags st ON s.id = st."secretId" JOIN tag t ON st."tagId" = t.id`;
        whereClause += ` AND t.slug = ANY($${paramIndex})`;
        params.push(tags);
        paramIndex++;
      }

      // Count query
      const countQuery = `
        SELECT COUNT(DISTINCT s.id) as total
        FROM secret s
        ${joinClause}
        WHERE ${whereClause}
      `;

      const countResult = await queryRunner.query(countQuery, params);
      const total = parseInt(countResult[0].total, 10);

      // Main search query with similarity scoring
      const searchQuery = `
        SELECT DISTINCT s.*, 
               ${searchText?.trim() ? `similarity(s.text, $1) as similarity,` : '0 as similarity,'}
               CASE 
                 WHEN s.text ILIKE '%' || $1 || '%' THEN 2
                 ELSE 1
               END as exact_match_boost
        FROM secret s
        ${joinClause}
        WHERE ${whereClause}
        ORDER BY ${searchText?.trim() ? '(similarity + exact_match_boost) DESC,' : ''} s."createdAt" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const items = await queryRunner.query(searchQuery, params);

      return { items, total };
    } finally {
      await queryRunner.release();
    }
  }
}
