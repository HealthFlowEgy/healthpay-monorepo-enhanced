import { Test, TestingModule } from '@nestjs/testing';
import { ValidationsService } from './validations.service';

describe('ValidationsService', () => {
  let service: ValidationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationsService],
    }).compile();

    service = module.get<ValidationsService>(ValidationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
