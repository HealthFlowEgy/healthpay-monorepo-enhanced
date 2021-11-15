import { Test, TestingModule } from '@nestjs/testing';
import { SharedMerchantService } from './shared-merchant.service';

describe('SharedMerchantService', () => {
  let service: SharedMerchantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedMerchantService],
    }).compile();

    service = module.get<SharedMerchantService>(SharedMerchantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
