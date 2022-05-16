import { Test, TestingModule } from '@nestjs/testing';
import { AuthFinanceService } from './auth-finance.service';

describe('AuthFinanceService', () => {
  let service: AuthFinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthFinanceService],
    }).compile();

    service = module.get<AuthFinanceService>(AuthFinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
