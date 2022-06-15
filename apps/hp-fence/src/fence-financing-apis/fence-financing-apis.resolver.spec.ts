import { Test, TestingModule } from '@nestjs/testing';
import { FenceFinancingApisResolver } from './fence-financing-apis.resolver';

describe('FenceFinancingApisResolver', () => {
  let resolver: FenceFinancingApisResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FenceFinancingApisResolver],
    }).compile();

    resolver = module.get<FenceFinancingApisResolver>(FenceFinancingApisResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
