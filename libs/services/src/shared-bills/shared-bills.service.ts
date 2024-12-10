/* eslint-disable @typescript-eslint/no-unused-vars */
import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { SharedBalanceService } from '../shared-balance/shared-balance.service';

import {
  BasataService,
  IBasataProvider,
  IBasataProvidersList,
  IBasataService,
  IBasataServiceInputParams,
  IBasataServices,
  IBasataTransactionDetails,
  IBasataTransactionInquiry,
  IBasataTransactionPayment,
} from '@app/helpers/basata.service';
import { ConfigService } from '@nestjs/config';
import { BillPaymentService, TRANS_STATUS, User } from '@prisma/client';
import { SharedMerchantService } from '../shared-merchant/shared-merchant.service';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';

@Injectable()
export class ShardBillsService {
  private readonly logger = new Logger(ShardBillsService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(BasataService) private basataService: BasataService,
    @Inject(forwardRef(() => SharedBalanceService))
    private sharedBalance: SharedBalanceService,

    @Inject(forwardRef(() => SharedWalletService))
    private sharedWallet: SharedWalletService,

    @Inject(forwardRef(() => SharedMerchantService))
    private sharedMerchant: SharedMerchantService,

    private configService: ConfigService,
  ) {}

  public async getBillsProviders(): Promise<IBasataProvidersList> {
    const providerList = await this._syncAction<IBasataProvidersList>(
      'GetProviderList',
      {
        service_version: 0,
      },
    );

    return providerList;
  }

  public async getProviderById(providerId: number): Promise<IBasataProvider> {
    const providerListt = await this.getBillsProviders();

    return providerListt.provider_list.find((item) => item.id === providerId);
  }

  public async getBillsServices(providerId: number): Promise<IBasataServices> {
    const serviceList = await this._syncAction<IBasataServices>(
      'GetServiceList',
      {
        provider_id: providerId,
      },
      false,
    );
    return serviceList;
  }

  public async getServiceInputParams(
    serviceId: number,
  ): Promise<IBasataServiceInputParams> {
    const paramList = await this._syncAction<IBasataServiceInputParams>(
      'GetServiceInputParameterList',
      {
        service_id: serviceId,
      },
      false,
    );
    return paramList;
  }

  public async transactionInquiry(
    serviceId: number,
    input_parameter_list: { key: string; value: string }[],
  ): Promise<IBasataTransactionInquiry> {
    const { data, error_code, error_text } =
      await this.basataService.getByActionName<IBasataTransactionInquiry>(
        'TransactionInquiry',
        {
          service_version:
            Number(this.configService.get<number>('BASATA_SERVICE_VERSION')) ??
            0,
          service_id: serviceId,
          account_number: this.configService.get('BASATA_LOGIN') ?? 0,
          input_parameter_list,
        },
        '/transaction',
      );
    if (error_code != null || error_text != null) {
      this.logger.error(
        'transactionInquiry error' +
          JSON.stringify({ error_code, error_text, data }),
      );
      throw new BadRequestException('7900', error_text);
    }

    return data;
  }

  public async trasnactionById(
    transactionId: string,
  ): Promise<IBasataTransactionDetails> {
    const { data, error_code } =
      await this.basataService.getByActionName<IBasataTransactionDetails>(
        'GetTransactionDetails',
        {
          transaction_id: transactionId,
        },
        '/report',
      );

    if (error_code != null) {
      this.logger.error(
        'trasnactionById error' + JSON.stringify({ error_code, data }),
      );
      throw new BadRequestException('7900', 'transaction not found');
    }

    return data;
  }

  public async payTransaction(
    transactionId: string,
    input_parameter_list: { key: string; value: string }[],
    user: User,
    serviceId: number,
    rAmount: number = null,
  ): Promise<{
    data: IBasataTransactionPayment;
    isPaymentProcessed: boolean;
  }> {
    const service = await this.getServiceById(serviceId);

    if (service.inquiry_required == true) {
      const { transaction_details } = await this.trasnactionById(transactionId);
      if (transaction_details == null) {
        throw new BadRequestException('7910', 'transaction not found');
      }
      rAmount =
        this._getBillAmountFromDetailsList(transaction_details.details_list) ??
        transaction_details.amount;
    } else {
      if (rAmount == null || rAmount == 0) {
        rAmount = service.service_value ?? 0;
      }
    }

    const { amount, serviceCharge, userAmount } =
      await this._caluculateUserPayingAmount(
        service,
        rAmount,
        input_parameter_list,
      );

    if (userAmount <= 0) {
      throw new BadRequestException('7901', 'bill amount is invalid ');
    }

    // user has enough balance
    const wallet = await this.sharedWallet.getWalletByUserId(user.id);
    if (wallet.total < userAmount) {
      throw new BadRequestException('7001', 'Insufficient balance');
    }

    if (service.price_type == 'RANGE') {
      // delete amout from input params list
      input_parameter_list = input_parameter_list.filter(
        (item) => item.key !== 'amount',
      );
    }

    // process payment
    const { isPaymentProcessed, data, uid } = await this.processBillPayment(
      transactionId,
      input_parameter_list,
      serviceId,
      amount,
      serviceCharge,
    );

    // save transaction
    await this.onPaymentProccesed(
      serviceId,
      data,
      isPaymentProcessed,
      user,
      uid,
      userAmount,
    );
    const _providers = await this.getBillsProviders();
    return {
      data: {
        ...data,
        service,
        provider: await this.getProviderById(service.provider_id),
        amount,
        serviceCharge,
        userAmount,
      },
      isPaymentProcessed,
    };
  }

  private async onPaymentProccesed(
    serviceId: number,
    data: IBasataTransactionPayment,
    isPaymentProcessed: boolean,
    user: User,
    uid: string,
    userAmount: number,
  ): Promise<boolean> {
    await this.prisma.userPayoutServiceRequest.create({
      data: {
        serviceId: serviceId,
        fields: JSON.stringify(data),
        status: isPaymentProcessed
          ? TRANS_STATUS.COMPLETED
          : TRANS_STATUS.DECLINED,
        userId: user.id,
        uid,
      },
    });

    if (isPaymentProcessed) {
      const hpMerchant = await this.sharedMerchant.cashInMerchant();
      await this.sharedBalance.doTransFromUserToMerchant(
        hpMerchant.id,
        user.id,
        userAmount,
        'deducted due bill payment request ' + uid,
      );
    }

    return isPaymentProcessed;
  }

  // take first two decimal point without rounding
  private _getTwoDecimalPoints(amount: number): number {
    return Math.floor(amount * 100) / 100;
  }

  /**
   * Process bill payment with api
   */
  public async processBillPayment(
    transactionId: string,
    input_parameter_list: { key: string; value: string }[],
    serviceId: number,
    amount: number,
    serviceCharge: number,
  ): Promise<{
    isPaymentProcessed: boolean;
    data: IBasataTransactionPayment | null;
    uid: string;
  }> {
    const uid = this.helpers.doCreateUUID('bp');
    const payload = {
      external_id: uid,
      service_version:
        Number(this.configService.get<number>('BASATA_SERVICE_VERSION')) ?? 0,
      account_number: this.configService.get('BASATA_LOGIN') ?? 0,
      inquiry_transaction_id: transactionId,
      service_id: serviceId,
      service_charge: this._getTwoDecimalPoints(serviceCharge),
      amount,
      total_amount: this._getTwoDecimalPoints(amount + serviceCharge),
      quantity: 1,
      input_parameter_list,
    };

    // remove empty keys from payload
    // Object.keys(payload).forEach((key) => payload[key] == null || payload[key] == "" && delete payload[key]);

    this.logger.verbose(
      '[processBillPayment] payload' + JSON.stringify(payload),
    );
    const { data, error_text, error_code } =
      await this.basataService.getByActionName<IBasataTransactionPayment>(
        'TransactionPayment',
        payload,
        '/transaction',
      );

    if (error_code != null || error_text != null) {
      this.logger.error(
        'processBillPayment error' +
          JSON.stringify({ error_code, error_text, data }),
      );

      throw new BadRequestException('7905', error_text);
    }

    if (data == null) {
      return {
        isPaymentProcessed: false,
        data: null,
        uid,
      };
    }

    if (this._isPaymentSuccess(data)) {
      return {
        isPaymentProcessed: true,
        data,
        uid,
      };
    }

    return {
      isPaymentProcessed: false,
      data,
      uid,
    };
  }

  public async _caluculateUserPayingAmount(
    service: IBasataService,
    rAmount: number | null = null,
    input_parameter_list: { key: string; value: string }[],
  ): Promise<{
    amount: number;
    serviceCharge: number;
    systemCharge: number;
    userAmount: number;
  }> {
    let amount = 0;

    amount = rAmount;

    if (
      input_parameter_list.length > 0 &&
      input_parameter_list.filter((item) => item.key === 'amount').length > 0
    ) {
      // resolve to amount from   input_parameter_list
      const amountKey = input_parameter_list.find(
        (item) => item.key === 'amount',
      )?.value;
      amount = Number(amountKey ?? 0);
      this.logger.verbose(
        '[_caluculateUserPayingAmount] amount from input_parameter_list' +
          amount,
      );
    }

    const serviceCharge = await this._caluclateServiceCharge(service, amount);
    const systemFees =
      Number(this.configService.get<number>('SYSTEM_FEES', 0.02)) ?? 0.02;

    this.logger.verbose('[systemFees] ' + systemFees);
    const systemCharge = Math.ceil((amount + serviceCharge) * systemFees);

    this.logger.verbose(
      '[_caluculateUserPayingAmount] systemCharge' + systemCharge,
    );
    this.logger.verbose(
      '[_caluculateUserPayingAmount] serviceCharge' + serviceCharge,
    );
    this.logger.verbose('[_caluculateUserPayingAmount] amount' + amount);

    const data = {
      amount,
      serviceCharge,
      systemCharge,
      userAmount: amount + serviceCharge + systemCharge,
    };

    // this.logger.debug(
    //   '[_caluculateUserPayingAmount] data' + JSON.stringify(data),
    // );

    return data;
  }

  private _isPaymentSuccess(data: IBasataTransactionPayment) {
    return data.transaction_id != null && data.status === 'SUCCESS';
  }

  async getServiceById(serviceId: number): Promise<IBasataService> {
    const serviceList = await this._syncAction<IBasataServices>(
      'GetServiceList',
      {},
      true,
    );

    if (serviceList == null || serviceList.service_list.length <= 0) {
      throw new BadRequestException('7902', 'service list is empty');
    }

    const service = serviceList.service_list.find(
      (item) => item.id === serviceId,
    );

    if (service == null) {
      throw new BadRequestException('7903', 'service not found');
    }

    return service;
  }

  private async _caluclateServiceCharge(
    service: IBasataService,
    amount: number,
  ): Promise<number> {
    const amountBracket = service.service_charge_list.find(
      (item) => item.from <= amount && item.to >= amount,
    );
    if (amountBracket == null) {
      throw new BadRequestException(
        '7904',
        'no bills available for this inquiry',
      );
    }
    if (amountBracket.percentage) {
      return Number((amount * amountBracket.charge) / 100);
    }
    return amountBracket.charge;
  }

  /**
   * Get bill amount + system fees based on bill amount
   * @param details_list
   * @returns
   */
  _getBillAmountFromDetailsList(
    details_list: Array<
      Array<{
        key: string;
        value: string;
      }>
    > = [],
  ): number {
    const amountKey = details_list[0].find(
      (item) => item.key === 'amount',
    )?.value;
    return Number(amountKey ?? 0);
  }

  /**
   * Get cached action
   * @param name
   * @returns BillPaymentService | null
   */
  private async _getCachedAction(
    name: string,
  ): Promise<BillPaymentService | null> {
    return this.prisma.billPaymentService.findFirst({
      where: {
        name,
      },
    });
  }

  /**
   * Sync action with cache into db
   * @param action
   * @param data
   * @param allowCache
   * @returns
   */
  private async _syncAction<T>(
    action: string,
    data: any,
    allowCache = true,
  ): Promise<T> {
    const actionCacheName = action + JSON.stringify(data);

    if (allowCache) {
      const cachedAction = await this._getCachedAction(actionCacheName);
      // this.logger.verbose(
      //   '[_syncAction] cachedAction ' + JSON.stringify(cachedAction),
      // );
      let yesterday = new Date(new Date().setDate(new Date().getDate() - 1));
      if (cachedAction && cachedAction.updatedAt > yesterday) {
        return cachedAction.data as T;
      }
    }
    this.logger.verbose('[_syncAction] cache miss');

    const actionData = await this.basataService.getByActionName<T>(
      action,
      data,
    );

    // this.logger.verbose(
    //   '[_syncAction] actionData ' + JSON.stringify(actionData),
    // );

    if (actionData.data) {
      if (allowCache) {
        await this.prisma.billPaymentService.deleteMany({
          where: {
            name: actionCacheName,
          },
        });

        await this.prisma.billPaymentService.create({
          data: {
            name: actionCacheName,
            data: actionData.data as any,
          },
        });
      }
      return actionData.data as T;
    }

    return null;
  }
}
