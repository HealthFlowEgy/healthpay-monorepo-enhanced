import { Test, TestingModule } from '@nestjs/testing';
import { HpNodejsController } from './hp-nodejs.controller';
import { HpNodejsService } from './hp-nodejs.service';

describe('HpNodejsController', () => {
  let hpNodejsController: HpNodejsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HpNodejsController],
      providers: [HpNodejsService],
    }).compile();

    hpNodejsController = app.get<HpNodejsController>(HpNodejsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(hpNodejsController.getHello()).toBe('Hello World!');
    });
  });
});
