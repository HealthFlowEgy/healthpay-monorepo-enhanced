import { Test, TestingModule } from '@nestjs/testing';
import { FinancingController } from './financing.controller';

describe('FinancingController', () => {
  let controller: FinancingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancingController],
    }).compile();

    controller = module.get<FinancingController>(FinancingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
