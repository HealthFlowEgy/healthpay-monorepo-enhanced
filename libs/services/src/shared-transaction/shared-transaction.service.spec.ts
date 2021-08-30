import { Test, TestingModule } from '@nestjs/testing';
import { SharedTransactionService } from './shared-transaction.service';

describe('SharedTransactionService', () => {
  let service: SharedTransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedTransactionService],
    }).compile();

    service = module.get<SharedTransactionService>(SharedTransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
