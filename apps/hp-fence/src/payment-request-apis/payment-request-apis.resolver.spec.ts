import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRequestApisResolver } from './payment-request-apis.resolver';

describe('PaymentRequestApisResolver', () => {
  let resolver: PaymentRequestApisResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentRequestApisResolver],
    }).compile();

    resolver = module.get<PaymentRequestApisResolver>(PaymentRequestApisResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
