import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecretsService } from './secrets.service';
import { SecretStatus } from './secret.entity';

// Mock entities to avoid import resolution issues in tests
const mockSecret = { id: '1', text: 'test', status: SecretStatus.PUBLISHED };
const mockReaction = { id: '1' };
const mockMood = { id: '1', code: 'happy' };
const mockTag = { id: '1', slug: 'test' };

describe('SecretsService', () => {
  let service: SecretsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    relation: jest.fn().mockReturnThis(),
    of: jest.fn().mockReturnThis(),
    add: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretsService,
        {
          provide: getRepositoryToken('Secret'),
          useValue: {
            ...mockRepository,
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken('Reaction'),
          useValue: {
            ...mockRepository,
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken('Mood'),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken('Tag'),
          useValue: mockRepository,
        },
        {
          provide: 'REDIS',
          useValue: {
            ttl: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: 'MOD_QUEUE',
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: 'NOTIF_QUEUE',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SecretsService>(SecretsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchSecrets', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '0' });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
    });

    it('should search secrets with text query', async () => {
      const mockSecrets = [
        {
          id: '1',
          text: 'This is a test secret',
          status: SecretStatus.PUBLISHED,
          createdAt: new Date(),
          author: { id: 'user1', handle: 'testuser', avatarUrl: null },
          moods: [],
          tags: [],
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockSecrets);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '1' });

      const result = await service.searchSecrets(
        'user1',
        { q: 'test', sort: 'newest' },
        1,
        20,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        's.text ILIKE :searchText',
        { searchText: '%test%' },
      );
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should extract hashtags from query', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '0' });

      await service.searchSecrets(
        'user1',
        { q: 'hello #test #world', sort: 'newest' },
        1,
        20,
      );

      // Should filter by extracted tags
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'tg.slug IN (:...tags)',
        { tags: ['test', 'world'] },
      );

      // Should search text without hashtags
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        's.text ILIKE :searchText',
        { searchText: '%hello%' },
      );
    });

    it('should filter by moods', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '0' });

      await service.searchSecrets(
        'user1',
        { moods: ['happy', 'sad'], sort: 'newest' },
        1,
        20,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'm.code IN (:...moods)',
        { moods: ['happy', 'sad'] },
      );
    });

    it('should filter by explicit tags', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '0' });

      await service.searchSecrets(
        'user1',
        { tags: ['gaming', 'music'], sort: 'newest' },
        1,
        20,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'tg.slug IN (:...tags)',
        { tags: ['gaming', 'music'] },
      );
    });

    it('should sort by relevance when specified', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '0' });

      await service.searchSecrets(
        'user1',
        { q: 'important', sort: 'relevant' },
        1,
        20,
      );

      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'CASE WHEN s.text ILIKE :exactSearchText THEN 2 ELSE 1 END',
        'relevance_score',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'relevance_score',
        'DESC',
      );
    });

    it('should apply pagination correctly', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '0' });

      await service.searchSecrets('user1', { q: 'test' }, 2, 10);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('private helper methods', () => {
    it('should normalize tags correctly', () => {
      // These are private methods, so we test them indirectly through searchSecrets
      // The normalization logic is tested by verifying the parameters passed to andWhere
      const normalizeTag = (service as any).normalizeTag;

      expect(normalizeTag('#Test')).toBe('test');
      expect(normalizeTag('Test123_')).toBe('test123_');
      expect(normalizeTag('  #UPPERCASE  ')).toBe('uppercase');
      expect(normalizeTag('a')).toBeNull(); // too short
      expect(normalizeTag('#')).toBeNull(); // just hashtag
      expect(normalizeTag('')).toBeNull(); // empty
    });

    it('should extract hashtags from text', () => {
      const extractTags = (service as any).extractTagsFromText;

      expect(extractTags('Hello #world #test')).toEqual(['world', 'test']);
      expect(extractTags('No hashtags here')).toEqual([]);
      expect(extractTags('#a #toolongtagnamethatshouldnotbeaccepted')).toEqual(
        [],
      ); // too short and too long
      expect(extractTags('#valid #another_valid')).toEqual([
        'valid',
        'another_valid',
      ]);
    });
  });
});
