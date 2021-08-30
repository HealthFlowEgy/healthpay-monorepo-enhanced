import { Test, TestingModule } from '@nestjs/testing';
import { SharedWalletService } from './shared-wallet.service';

describe('SharedWalletService', () => {
  let service: SharedWalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedWalletService],
    }).compile();

    service = module.get<SharedWalletService>(SharedWalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
