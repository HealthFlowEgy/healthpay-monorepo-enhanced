import { Test, TestingModule } from '@nestjs/testing';
import { SharedUserService } from './shared-user.service';

describe('SharedUserService', () => {
  let service: SharedUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedUserService],
    }).compile();

    service = module.get<SharedUserService>(SharedUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
