import { Injectable } from '@nestjs/common';
import { createCipheriv, randomBytes, scrypt, createDecipheriv } from 'crypto';
import { promisify } from 'util';
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
  public async encryptTxt(txt: string): Promise<string> {
    const iv = randomBytes(16);
    const key = (await promisify(scrypt)(txt, 'salt', 32)) as Buffer;
    const cipher = createCipheriv('aes-256-ctr', key, iv);
    const textToEncrypt = 'HEALTHPAY';
    const encryptedText = Buffer.concat([
      cipher.update(textToEncrypt),
      cipher.final(),
    ]);
    return String(encryptedText);
  }
}
