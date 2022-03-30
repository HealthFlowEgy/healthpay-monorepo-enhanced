import { SmsService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { AvailableMessages, SendNotifyResults } from './shared-notify.types';

@Injectable()
export class SharedNotifyService {
  private readonly logger = new Logger(SharedNotifyService.name);
  private thisUser: Pick<User, 'id' | 'prefLang' | 'mobile'> | null;

  private composed = {
    message: '',
    vars: {},
  };
  private options = {
    includeNotification: false,
    includeSms: false,
    includeEmail: false,
  };

  constructor(
    @Inject(SmsService) private smsServ: SmsService,
    @Inject(PrismaService) private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(I18nService)
    private readonly i18n: I18nService,
  ) {}

  public toUser(user: User): SharedNotifyService {
    this.thisUser = user;
    return this;
  }

  public compose(message: AvailableMessages, vars?: any): SharedNotifyService {
    this.composed = { message: `notify.${message}`, vars };
    return this;
  }

  public notify(): SharedNotifyService {
    this.options.includeNotification = true;
    return this;
  }

  public sms(): SharedNotifyService {
    this.options.includeSms = true;
    return this;
  }

  public email(): SharedNotifyService {
    this.options.includeEmail = true;
    return this;
  }

  /**
   * select all avilable channels
   * @returns SharedNotifyService
   */
  public allChannels(): SharedNotifyService {
    this.options.includeSms = true;
    this.options.includeNotification = true;
    this.options.includeEmail = true;

    return this;
  }

  /**
   *
   * @returns Promise<SendNotifyResults>
   */
  public async send(confirmed?: boolean): Promise<SendNotifyResults> {
    const errors = [];
    const success = [];
    const i18nMessage = await this.i18n.translate(this.composed.message, {
      lang: this.thisUser.prefLang,
      args: this.composed.vars,
    });
    if (this.options.includeNotification) {
      // TODO: Send push notification to user;
    }
    if (this.options.includeEmail) {
      // TODO: Send email to user;
    }
    if (this.options.includeSms) {
      try {
        const apiResponse = await this.sendSms(i18nMessage, confirmed);
        success.push(JSON.stringify(apiResponse));
      } catch (e) {
        const stringErr = typeof e === 'object' ? JSON.stringify(e) : e;
        errors.push(stringErr);
        this.logger.error(`[send] ${stringErr}`);
      }
    }

    await this.logMessage(this.composed.message, this.thisUser.id);

    return {
      errors,
      success,
    };
  }

  private sendSms(msg: string, confirmed?: boolean) {
    if (this.configService.get('NODE_ENV') === 'production') {
      return this.smsServ.sendMessage(msg, this.thisUser.mobile, confirmed);
    }
  }

  public async getTranslatedMessage() {
    return await this.i18n.translate(this.composed.message, {
      lang: this.thisUser.prefLang,
      args: this.composed.vars,
    });
  }

  public async sendLoginOTP(generatedOTP): Promise<SendNotifyResults> {
    this.compose('otp', { otp: generatedOTP });
    return this.send(true);
  }

  private async logMessage(msg: string, userId: number) {
    return this.prisma.notification.create({
      data: {
        msg: msg,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
}
