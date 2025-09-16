import { Test, TestingModule } from '@nestjs/testing';
import { SecretsController } from './secrets.controller';
import { SecretsService } from './secrets.service';
import { SecretsGateway } from './secrets.getaway';

describe('SecretsController', () => {
  let controller: SecretsController;
  let service: SecretsService;

  const mockSecretsService = {
    searchSecrets: jest.fn(),
    getFeed: jest.fn(),
    getTrending: jest.fn(),
    getSecrets: jest.fn(),
    getSecretById: jest.fn(),
    updateSecret: jest.fn(),
    deleteSecret: jest.fn(),
    createSecret: jest.fn(),
    getCooldownSeconds: jest.fn(),
    getCooldownInfo: jest.fn(),
  };

  const mockSecretsGateway = {
    notifyNewSecret: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretsController],
      providers: [
        {
          provide: SecretsService,
          useValue: mockSecretsService,
        },
        {
          provide: SecretsGateway,
          useValue: mockSecretsGateway,
        },
      ],
    }).compile();

    controller = module.get<SecretsController>(SecretsController);
    service = module.get<SecretsService>(SecretsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    const mockRequest = { user: { userId: 'user1' } };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call searchSecrets with default parameters', async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 20 };
      mockSecretsService.searchSecrets.mockResolvedValue(mockResult);

      const result = await controller.search(mockRequest);

      expect(service.searchSecrets).toHaveBeenCalledWith(
        'user1',
        {
          q: undefined,
          moods: undefined,
          tags: undefined,
          sort: 'newest',
        },
        1,
        20,
      );
      expect(result).toEqual(mockResult);
    });

    it('should call searchSecrets with query parameters', async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 10 };
      mockSecretsService.searchSecrets.mockResolvedValue(mockResult);

      const result = await controller.search(
        mockRequest,
        'hello #world',
        'happy,sad',
        'gaming,music',
        'relevant',
        '2',
        '10',
      );

      expect(service.searchSecrets).toHaveBeenCalledWith(
        'user1',
        {
          q: 'hello #world',
          moods: ['happy', 'sad'],
          tags: ['gaming', 'music'],
          sort: 'relevant',
        },
        2,
        10,
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle empty CSV parameters', async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 20 };
      mockSecretsService.searchSecrets.mockResolvedValue(mockResult);

      const result = await controller.search(
        mockRequest,
        'test',
        '', // empty moods
        ',,,', // empty tags with commas
        undefined,
        '1',
        '20',
      );

      expect(service.searchSecrets).toHaveBeenCalledWith(
        'user1',
        {
          q: 'test',
          moods: undefined,
          tags: undefined,
          sort: 'newest',
        },
        1,
        20,
      );
    });

    it('should validate and constrain page and limit parameters', async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 100 };
      mockSecretsService.searchSecrets.mockResolvedValue(mockResult);

      await controller.search(
        mockRequest,
        undefined,
        undefined,
        undefined,
        undefined,
        '0', // should be constrained to 1
        '500', // should be constrained to 100
      );

      expect(service.searchSecrets).toHaveBeenCalledWith(
        'user1',
        expect.any(Object),
        1, // constrained from 0
        100, // constrained from 500
      );
    });

    it('should trim whitespace from tags and moods', async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 20 };
      mockSecretsService.searchSecrets.mockResolvedValue(mockResult);

      await controller.search(
        mockRequest,
        undefined,
        ' happy , sad , ',
        ' gaming , music , ',
      );

      expect(service.searchSecrets).toHaveBeenCalledWith(
        'user1',
        {
          q: undefined,
          moods: ['happy', 'sad'],
          tags: ['gaming', 'music'],
          sort: 'newest',
        },
        1,
        20,
      );
    });
  });
});
