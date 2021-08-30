import { Test, TestingModule } from '@nestjs/testing';
import { SharedBalanceService } from './shared-balance.service';

describe('SharedBalanceService', () => {
  let service: SharedBalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedBalanceService],
    }).compile();

    service = module.get<SharedBalanceService>(SharedBalanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
