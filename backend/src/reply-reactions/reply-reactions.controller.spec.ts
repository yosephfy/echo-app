import { Test, TestingModule } from '@nestjs/testing';
import { ReplyReactionsController } from './reply-reactions.controller';

describe('ReactionsController', () => {
  let controller: ReplyReactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReplyReactionsController],
    }).compile();

    controller = module.get<ReplyReactionsController>(ReplyReactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
