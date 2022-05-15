import { Injectable } from '@nestjs/common';

@Injectable()
export class HpFinancingService {
  getHello(): string {
    return 'Hello World!';
  }
}
