import { Test, TestingModule } from '@nestjs/testing';
import { SharedHpOpsService } from './shared-hp-ops.service';

describe('SharedHpOpsService', () => {
  let service: SharedHpOpsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedHpOpsService],
    }).compile();

    service = module.get<SharedHpOpsService>(SharedHpOpsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
