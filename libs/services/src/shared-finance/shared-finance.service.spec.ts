import { Test, TestingModule } from '@nestjs/testing';
import { SharedFinanceService } from './shared-finance.service';

describe('SharedFinanceService', () => {
  let service: SharedFinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedFinanceService],
    }).compile();

    service = module.get<SharedFinanceService>(SharedFinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
