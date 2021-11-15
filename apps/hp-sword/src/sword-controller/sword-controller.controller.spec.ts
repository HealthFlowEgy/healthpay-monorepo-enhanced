import { Test, TestingModule } from '@nestjs/testing';
import { SwordControllerController } from './sword-controller.controller';

describe('SwordControllerController', () => {
  let controller: SwordControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SwordControllerController],
    }).compile();

    controller = module.get<SwordControllerController>(SwordControllerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
