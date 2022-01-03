import { Test, TestingModule } from '@nestjs/testing';
import { FenceNotificationsApisResolver } from './fence-notifications-apis.resolver';

describe('FenceNotificationsApisResolver', () => {
  let resolver: FenceNotificationsApisResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FenceNotificationsApisResolver],
    }).compile();

    resolver = module.get<FenceNotificationsApisResolver>(FenceNotificationsApisResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
