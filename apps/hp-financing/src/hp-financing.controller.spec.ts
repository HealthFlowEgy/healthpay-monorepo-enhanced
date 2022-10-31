import { Test, TestingModule } from '@nestjs/testing';
import { HpFinancingController } from './hp-financing.controller';
import { HpFinancingService } from './hp-financing.service';

describe('HpFinancingController', () => {
  let hpFinancingController: HpFinancingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HpFinancingController],
      providers: [HpFinancingService],
    }).compile();

    hpFinancingController = app.get<HpFinancingController>(HpFinancingController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(hpFinancingController.getHello()).toBe('Hello World!');
    });
  });
});
