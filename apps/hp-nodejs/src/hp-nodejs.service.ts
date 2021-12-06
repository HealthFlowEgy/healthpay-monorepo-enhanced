import { Injectable } from '@nestjs/common';

@Injectable()
export class HpNodejsService {
  getHello(): string {
    return 'Hello World!';
  }
}
