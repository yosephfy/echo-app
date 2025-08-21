import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { UpdateDefinitionDto, UpsertDefinitionDto } from './dto/definition.dto';
import {
  SetUserSettingDto,
  BulkSetUserSettingsDto,
} from './dto/user-setting.dto';
import { SettingDefinition } from './setting-definition.entity';
import { UserSettingChange } from './user-setting-change.entity';
import { UserSetting } from './user-setting.entity';

type CoerceCtx = { type: SettingDefinition['type']; metadata?: any };

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingDefinition)
    private readonly defRepo: Repository<SettingDefinition>,
    @InjectRepository(UserSetting)
    private readonly userRepo: Repository<UserSetting>,
    @InjectRepository(UserSettingChange)
    private readonly auditRepo: Repository<UserSettingChange>,
  ) {}

  // ---------- Helpers ----------
  private coerceIn(value: string, ctx: CoerceCtx): string {
    const t = ctx.type;
    if (t === 'boolean') {
      if (!['true', 'false', '1', '0'].includes(value)) {
        throw new BadRequestException('Invalid boolean');
      }
      return value === 'true' || value === '1' ? 'true' : 'false';
    }
    if (t === 'integer') {
      const n = Number(value);
      if (!Number.isInteger(n))
        throw new BadRequestException('Invalid integer');
      if (ctx.metadata?.min !== undefined && n < ctx.metadata.min) {
        throw new BadRequestException(`Must be >= ${ctx.metadata.min}`);
      }
      if (ctx.metadata?.max !== undefined && n > ctx.metadata.max) {
        throw new BadRequestException(`Must be <= ${ctx.metadata.max}`);
      }
      return String(n);
    }
    if (t === 'enum') {
      const opts: any[] =
        ctx.metadata?.options?.map((o: any) => o?.value ?? o) ?? [];
      if (!opts.includes(value))
        throw new BadRequestException('Invalid enum option');
      return value;
    }
    if (t === 'json') {
      try {
        // ensure valid JSON
        JSON.parse(value);
      } catch {
        throw new BadRequestException('Invalid JSON');
      }
      return value;
    }
    // string fallback (+ optional regex)
    if (ctx.metadata?.regex) {
      const re = new RegExp(ctx.metadata.regex);
      if (!re.test(value))
        throw new BadRequestException('String does not match pattern');
    }
    return value;
  }

  private effectiveValue(
    def: SettingDefinition,
    override?: UserSetting | null,
  ) {
    const v = override?.value ?? def.defaultValue ?? null;
    if (v === null) return null;
    // For outbound responses, decode by type
    try {
      switch (def.type) {
        case 'boolean':
          return v === 'true' || v === '1';
        case 'integer':
          return Number(v);
        case 'json':
          return JSON.parse(v);
        default:
          return v;
      }
    } catch {
      return v;
    }
  }

  // ---------- Definitions ----------
  async listDefinitions(section?: string) {
    const where: FindOptionsWhere<SettingDefinition> = section
      ? ({ section } as any)
      : {};
    return this.defRepo.find({ where, order: { section: 'ASC', key: 'ASC' } });
  }

  async upsertDefinition(dto: UpsertDefinitionDto) {
    const existing = await this.defRepo.findOne({ where: { key: dto.key } });
    const entity = this.defRepo.create({ ...existing, ...dto });
    return this.defRepo.save(entity);
  }

  async updateDefinition(key: string, dto: UpdateDefinitionDto) {
    const def = await this.defRepo.findOne({ where: { key } });
    if (!def) throw new NotFoundException('Setting definition not found');
    Object.assign(def, dto);
    return this.defRepo.save(def);
  }

  // ---------- User settings ----------
  async getRawUserSettings(userId: string) {
    return this.userRepo.find({ where: { userId } });
  }

  async getEffectiveUserSettings(userId: string) {
    const [defs, overrides] = await Promise.all([
      this.defRepo.find(),
      this.userRepo.find({ where: { userId } }),
    ]);
    const map = new Map(overrides.map((o) => [o.key, o]));
    return defs
      .filter((d) => !d.isDeprecated)
      .map((d) => ({
        key: d.key,
        section: d.section,
        type: d.type,
        value: this.effectiveValue(d, map.get(d.key)),
        metadata: d.metadata ?? null,
      }));
  }

  async setUserSetting(
    actorId: string,
    userId: string,
    dto: SetUserSettingDto,
  ) {
    const def = await this.defRepo.findOne({ where: { key: dto.key } });
    if (!def || def.isDeprecated)
      throw new NotFoundException('Unknown or deprecated setting');

    const serialized = this.coerceIn(dto.value, {
      type: def.type,
      metadata: def.metadata,
    });

    const prev = await this.userRepo.findOne({
      where: { userId, key: dto.key },
    });
    const entity = this.userRepo.create({
      ...(prev ?? {}),
      userId,
      key: dto.key,
      value: serialized,
      updatedBy: actorId,
    });
    await this.userRepo.save(entity);

    await this.auditRepo.save(
      this.auditRepo.create({
        userId,
        key: dto.key,
        oldValue: prev?.value ?? null,
        newValue: serialized,
        changedBy: actorId,
        context: { source: 'api' },
      }),
    );

    return { key: dto.key, value: this.effectiveValue(def, entity) };
  }

  async bulkSetUserSettings(
    actorId: string,
    userId: string,
    body: BulkSetUserSettingsDto,
  ) {
    const defs = await this.defRepo.find();
    const byKey = new Map(defs.map((d) => [d.key, d]));
    const results: any[] = [];
    for (const item of body.items) {
      const def = byKey.get(item.key);
      if (!def || def.isDeprecated) {
        throw new NotFoundException(
          `Unknown or deprecated setting: ${item.key}`,
        );
      }
      const serialized = this.coerceIn(item.value, {
        type: def.type,
        metadata: def.metadata,
      });
      const prev = await this.userRepo.findOne({
        where: { userId, key: item.key },
      });

      const entity = this.userRepo.create({
        ...(prev ?? {}),
        userId,
        key: item.key,
        value: serialized,
        updatedBy: actorId,
      });
      await this.userRepo.save(entity);
      await this.auditRepo.save(
        this.auditRepo.create({
          userId,
          key: item.key,
          oldValue: prev?.value ?? null,
          newValue: serialized,
          changedBy: actorId,
          context: { source: 'api.bulk' },
        }),
      );
      results.push({ key: item.key, value: this.effectiveValue(def, entity) });
    }
    return results;
  }

  async listAudit(userId: string, key?: string, page = 1, limit = 20) {
    const where: any = { userId };
    if (key) where.key = key;
    const [items, total] = await this.auditRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (Math.max(page, 1) - 1) * limit,
      take: Math.min(Math.max(limit, 1), 100),
    });
    return { items, total, page, limit };
  }
}
