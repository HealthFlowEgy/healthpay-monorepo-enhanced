import * as bcrypt from 'bcrypt';

import { Injectable } from '@nestjs/common';

@Injectable()
export class HelpersService {
  public doCreateUUID(prefix: string): string {
    return prefix + '_' + this.generateUUID();
  }

  private generateUUID(): string {
    const firstPart = (Math.random() * 46656) | 0;
    const secondPart = (Math.random() * 46656) | 0;
    const newFirstPart = ('0000' + firstPart.toString(36)).slice(-4);
    const newSecondPart = ('0000' + secondPart.toString(36)).slice(-4);
    const uid = newFirstPart + newSecondPart;
    return uid;
  }
  public generateOTP(): string {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  }

  public generateDates() {
    return {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  public async encryptTxt(): Promise<string> {
    return this.generateUUID() + this.generateUUID();
  }
}
