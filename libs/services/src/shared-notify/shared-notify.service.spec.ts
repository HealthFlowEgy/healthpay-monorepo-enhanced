import { Test, TestingModule } from '@nestjs/testing';
import { SharedNotifyService } from './shared-notify.service';

describe('SharedNotifyService', () => {
  let service: SharedNotifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedNotifyService],
    }).compile();

    service = module.get<SharedNotifyService>(SharedNotifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
