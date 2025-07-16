import { Test, TestingModule } from '@nestjs/testing';
import { ReplyReactionsService } from './reply-reactions.service';

describe('ReplyReactionsService', () => {
  let service: ReplyReactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReplyReactionsService],
    }).compile();

    service = module.get<ReplyReactionsService>(ReplyReactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
