import {
  Injectable,
  Inject,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Secret, SecretStatus } from './secret.entity';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { User } from 'src/users/user.entity';
import { Mood } from 'src/moods/mood.entity';
import { Tag } from 'src/tags/tag.entity';

const COOLDOWN_SECONDS = 24 * 60 * 60; // 24h

@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);

  constructor(
    @InjectRepository(Secret)
    private secretsRepo: Repository<Secret>,
    @Inject('REDIS') private redis: Redis,
    @Inject('MOD_QUEUE') private modQueue: Queue,
    @Inject('NOTIF_QUEUE') private readonly notifQueue: Queue,
    @InjectRepository(Mood) private moodRepo: Repository<Mood>,
    @InjectRepository(Tag) private tagRepo: Repository<Tag>,
  ) {}

  /** Attempt to create a secret for a user, enforcing 24h cooldown */
  async createSecret(
    userId: string,
    text: string,
    moods?: string[],
    tags?: string[],
  ): Promise<Secret> {
    const cooldownKey = `cooldown:${userId}`;
    const ttl = await this.redis.ttl(cooldownKey);

    if (ttl > 0) {
      throw new ForbiddenException(
        `Cooldown active. Try again in ${ttl} seconds.`,
      );
    }

    // Normalize input arrays
    const normMoods = Array.isArray(moods)
      ? Array.from(
          new Set(moods.map((m) => m.trim().toLowerCase()).filter(Boolean)),
        )
      : [];
    // Build tag set from provided tags and auto-extracted hashtags from text
    const providedTags: string[] = Array.isArray(tags)
      ? tags
          .map((t) => this.normalizeTag(t))
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      : [];
    const extractedTags = this.extractTagsFromText(text);
    const normTags: string[] = Array.from(
      new Set([...providedTags, ...extractedTags]),
    ).slice(0, 5);

    // Fetch moods
    let moodEntities: Mood[] = [];
    if (normMoods.length) {
      moodEntities = await this.moodRepo.find({
        where: { code: In(normMoods), active: true },
      });
    }

    // Upsert tags
    const tagEntities: Tag[] = [];
    for (const slug of normTags) {
      let existing = await this.tagRepo.findOne({ where: { slug } });
      if (!existing) {
        existing = this.tagRepo.create({ slug, raw: slug });
        try {
          existing = await this.tagRepo.save(existing);
        } catch (e) {
          // race condition: try find again
          const again = await this.tagRepo.findOne({ where: { slug } });
          if (again) existing = again;
          else throw e;
        }
      }
      existing.usageCount += 1;
      await this.tagRepo.save(existing);
      tagEntities.push(existing);
    }

    // Save the secret (relations set after initial save if needed)
    const secret = this.secretsRepo.create({ userId, text });
    const saved = await this.secretsRepo.save(secret);

    if (moodEntities.length) {
      await this.secretsRepo
        .createQueryBuilder()
        .relation(Secret, 'moods')
        .of(saved.id)
        .add(moodEntities.map((m) => m.id));
    }
    if (tagEntities.length) {
      await this.secretsRepo
        .createQueryBuilder()
        .relation(Secret, 'tags')
        .of(saved.id)
        .add(tagEntities.map((t) => t.id));
    }

    // Set cooldown key
    await this.redis.set(cooldownKey, '1', 'EX', COOLDOWN_SECONDS);

    await this.modQueue.add('moderate', {
      secretId: saved.id,
      text: saved.text,
    });
    console.log(`🔔 [SecretsService] Enqueued moderation for ${saved.id}`);

    // 24-h cooldown complete notification
    await this.notifQueue.add(
      'cooldown',
      { userId, type: 'cooldown' },
      { delay: 24 * 60 * 60 * 1000 }, // 24 hours
    );

    // 3-h before cooldown ends reminder
    await this.notifQueue.add(
      'reminder',
      { userId, type: 'reminder' },
      { delay: 21 * 60 * 60 * 1000 }, // 21 hours
    );

    this.logger.log(`Scheduled cooldown and reminder for user ${userId}`);

    // now reload with author relation
    const full = await this.secretsRepo.findOne({
      where: { id: saved.id },
      relations: ['author', 'moods', 'tags'],
    });

    // full should never be null here
    return full!;
  }

  async getCooldownSeconds(userId: string): Promise<number> {
    const ttl = await this.redis.ttl(`cooldown:${userId}`);
    // redis.ttl returns -2 if key doesn’t exist, -1 if no expiry
    return ttl > 0 ? ttl : 0;
  }

  /** Returns the cooldown start, total duration, and seconds remaining */
  async getCooldownInfo(userId: string): Promise<{
    start: string;
    duration: number;
    remaining: number;
  }> {
    // how many seconds remain before the key expires
    const ttl = await this.redis.ttl(`cooldown:${userId}`);
    const remaining = ttl > 0 ? ttl : 0;
    const startTimestamp = Date.now() - (COOLDOWN_SECONDS - remaining) * 1000;
    return {
      start: new Date(startTimestamp).toISOString(),
      duration: COOLDOWN_SECONDS,
      remaining,
    };
  }

  // backend/src/secrets/secrets.service.ts

  async getFeed(
    userId: string,
    page: number,
    limit: number,
    moods?: string[],
    tags?: string[],
  ) {
    const q = this.secretsRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.author', 'author')
      .leftJoinAndSelect('s.moods', 'm')
      .leftJoinAndSelect('s.tags', 'tg')
      .where('s.status IN (:...statuses)', {
        statuses: [SecretStatus.PUBLISHED, SecretStatus.UNDER_REVIEW],
      })
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (moods && moods.length) {
      q.andWhere('m.code IN (:...moods)', { moods });
    }
    if (tags && tags.length) {
      q.andWhere('tg.slug IN (:...tags)', {
        tags: tags.map((t) => this.normalizeTag(t)),
      });
    }
    const total = await this.secretsRepo.count({
      where: {
        status: In([SecretStatus.PUBLISHED, SecretStatus.UNDER_REVIEW]),
      },
    });

    const items = await q.getMany();

    // OPTION A: Filter out secrets with no author
    const filtered = items.filter((s) => s.author !== null);

    return {
      items: filtered.map((s) => ({
        id: s.id,
        text: s.text,
        moods: s.moods?.map((m) => ({ code: m.code, label: m.label })) || [],
        tags: s.tags?.map((t) => t.slug) || [],
        status: s.status,
        createdAt: s.createdAt,
        author: {
          id: s.author.id,
          handle: s.author.handle,
          avatarUrl: s.author.avatarUrl,
        },
      })),
      total,
      page,
      limit,
    };
  }

  /** Fetch a paginated list of this user’s own secrets */
  async getSecrets(
    userId: string,
    page: number,
    limit: number,
    moods?: string[],
    tags?: string[],
  ) {
    const q = this.secretsRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.author', 'author')
      .leftJoinAndSelect('s.moods', 'm')
      .leftJoinAndSelect('s.tags', 'tg')
      .where('s.userId = :userId', { userId })
      .andWhere('s.status IN (:...statuses)', {
        statuses: [SecretStatus.PUBLISHED, SecretStatus.UNDER_REVIEW],
      })
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (moods && moods.length) {
      q.andWhere('m.code IN (:...moods)', { moods });
    }
    if (tags && tags.length) {
      q.andWhere('tg.slug IN (:...tags)', {
        tags: tags.map((t) => this.normalizeTag(t)),
      });
    }

    const [items, totalCount] = await q.getManyAndCount();

    return {
      items: items.map((s) => ({
        id: s.id,
        text: s.text,
        moods: s.moods?.map((m) => ({ code: m.code, label: m.label })) || [],
        tags: s.tags?.map((t) => t.slug) || [],
        status: s.status,
        createdAt: s.createdAt,
        author: {
          id: s.author.id,
          handle: s.author.handle,
          avatarUrl: s.author.avatarUrl,
        },
      })),
      total: totalCount,
      page,
      limit,
    };
  }

  async getSecretById(secretId: string): Promise<Secret | null> {
    return this.secretsRepo.findOne({
      where: { id: secretId },
      relations: ['author', 'moods', 'tags'],
    });
  }

  async updateStatus(secretId: string, status: SecretStatus): Promise<void> {
    await this.secretsRepo.update({ id: secretId }, { status });
  }

  /** Ensure the user owns the secret; throws if not */
  private async assertOwner(userId: string, secretId: string): Promise<Secret> {
    const entity = await this.secretsRepo.findOne({ where: { id: secretId } });
    if (!entity) throw new NotFoundException('Secret not found');
    if (entity.userId !== userId)
      throw new ForbiddenException('Not allowed to modify this secret');
    return entity;
  }

  /** Update text and relations on a secret (owner only) */
  async updateSecret(
    userId: string,
    secretId: string,
    patch: { text?: string; moods?: string[]; tags?: string[] },
  ) {
    const entity = await this.assertOwner(userId, secretId);
    const next = { ...entity } as any;
    if (typeof patch.text === 'string') next.text = patch.text;
    await this.secretsRepo.update({ id: secretId }, next);

    // Update relations if provided
    if (patch.moods) {
      const norm = Array.from(
        new Set(patch.moods.map((m) => m.trim().toLowerCase()).filter(Boolean)),
      );
      const moodEntities = norm.length
        ? await this.moodRepo.find({ where: { code: In(norm), active: true } })
        : [];
      await this.secretsRepo
        .createQueryBuilder()
        .relation(Secret, 'moods')
        .of(entity.id)
        .set(moodEntities.map((m) => m.id));
    }
    // Update tags: if provided, normalize; otherwise if text changed, extract from text
    if (patch.tags || typeof patch.text === 'string') {
      const provided = Array.isArray(patch.tags)
        ? patch.tags
            .map((t) => this.normalizeTag(t))
            .filter((v): v is string => typeof v === 'string' && v.length > 0)
        : [];
      const extracted =
        typeof patch.text === 'string'
          ? this.extractTagsFromText(patch.text)
          : [];
      const normTags: string[] = Array.from(
        new Set([...(provided.length ? provided : []), ...extracted]),
      ).slice(0, 5);
      const tagEntities: Tag[] = [];
      for (const slug of normTags) {
        let existing = await this.tagRepo.findOne({ where: { slug } });
        if (!existing) {
          existing = this.tagRepo.create({ slug, raw: slug });
          try {
            existing = await this.tagRepo.save(existing);
          } catch (e) {
            const again = await this.tagRepo.findOne({ where: { slug } });
            if (again) existing = again;
            else throw e;
          }
        }
        // Avoid increment on updates to prevent inflation
        tagEntities.push(existing);
      }
      await this.secretsRepo
        .createQueryBuilder()
        .relation(Secret, 'tags')
        .of(entity.id)
        .set(tagEntities.map((t) => t.id));
    }

    return this.getSecretById(secretId);
  }

  /** Soft-delete: mark as REMOVED and redact text (owner only) */
  async deleteSecret(userId: string, secretId: string) {
    const entity = await this.assertOwner(userId, secretId);
    await this.secretsRepo.update(
      { id: entity.id },
      { status: SecretStatus.REMOVED, text: '[deleted]' },
    );
  }

  private normalizeTag(input: string): string | null {
    if (!input) return null;
    let s = input.trim().toLowerCase();
    if (s.startsWith('#')) s = s.slice(1);
    s = s.replace(/[^a-z0-9_]/g, '');
    if (s.length < 2 || s.length > 32) return null;
    return s;
  }

  private extractTagsFromText(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/#[a-zA-Z0-9_]{2,32}/g) || [];
    const normalized = matches
      .map((m) => this.normalizeTag(m))
      .filter((v): v is string => typeof v === 'string');
    return Array.from(new Set(normalized));
  }
}
