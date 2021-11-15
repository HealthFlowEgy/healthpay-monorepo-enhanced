import { Test, TestingModule } from '@nestjs/testing';
import { ValuController } from './valu.controller';

describe('ValuController', () => {
  let controller: ValuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValuController],
    }).compile();

    controller = module.get<ValuController>(ValuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
