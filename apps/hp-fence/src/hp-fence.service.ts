import { Injectable } from '@nestjs/common';

@Injectable()
export class HpFenceService {
  getHello(): string {
    return 'Hello World!';
  }
}
