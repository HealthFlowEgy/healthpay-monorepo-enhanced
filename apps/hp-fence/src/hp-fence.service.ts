import { ValuService } from '@app/helpers';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class HpFenceService {
  constructor(@Inject(ValuService) private valuService: ValuService) {}
  getHello() {
    return this.valuService.generateToken();
  }
}
