import { AuctionOffers, Merchant } from '.prisma/client';
import { HelpersService } from '@app/helpers';
import { PrismaService, } from '@app/prisma';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';
import { SharedUserService } from '../shared-user/shared-user.service';
import { AuctionUsers, Prisma, AuctionOffersStatus } from '@prisma/client';
import { SharedBalanceService } from '../shared-balance/shared-balance.service';
import { SharedMerchantService } from '../shared-merchant/shared-merchant.service';


type AuctionWithMembers = AuctionOffers & {
  AuctionUsers: AuctionUsers[];
};

@Injectable()
export class SharedAuctionService {
  private readonly logger = new Logger(SharedAuctionService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(SharedBalanceService) private sharedBalance: SharedBalanceService,
    @Inject(SharedMerchantService) private sharedMerchant: SharedMerchantService,
    @Inject(SharedUserService) private sharedUser: SharedUserService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
    @Inject(HelpersService) private helpers: HelpersService,
    private readonly configService: ConfigService,
  ) { }


  async getActiveAuctions(where?: Prisma.AuctionOffersWhereInput, params: any = {}): Promise<AuctionOffers[]> {
    return this.getAllAuctions({
      status: AuctionOffersStatus.PENDING,
      ...where,
    }, params);
  }

  async getAuctionById(id: number): Promise<Prisma.Prisma__AuctionOffersClient<AuctionWithMembers>> {
    return this.prisma.auctionOffers.findUnique({
      where: {
        id
      },
      include: {
        AuctionUsers: true
      }
    });
  }


  async getAllAuctions(where?: Prisma.AuctionOffersWhereInput, params: any = {}):
    Promise<AuctionOffers[]> {
    return this.prisma.auctionOffers.findMany({
      where,
      ...params
    });
  }



  async getActiveAuctionByUserId(id: number, where: Prisma.AuctionOffersWhereInput): Promise<AuctionOffers[]> {
    const auctionUsersOffers = await this.prisma.auctionUsers.findMany({
      where: {
        userId: id
      },
      include: {
        offer: {
          select: {
            id: true,
          }
        }
      }
    });

    return this.getAllAuctions({
      id: {
        in: auctionUsersOffers.map(a => a.offer.id)
      },
      ...where
    });
  }


  async onAuctionMaxApplicants(auction: AuctionWithMembers) {

    // pick random winner
    const winner = await this.pickRandomWinner(auction);
    const auctionUsers = await this.prisma.auctionUsers.findMany({
      where: {
        offerId: auction.id
      }
    });


    for (let index = 0; index < auctionUsers.length; index++) {
      const element = auctionUsers[index];
      const user = await this.sharedUser.getUserById(element.userId);
      this.sharedNotify
        .toUser(user)
        .compose(element.isWinner ? 'auction_winning' : 'auction_losing', { auctionId: auction.id, itemName: auction.name })
        .notify()
        .send('default');


    }

    this.markAuctionAsCompleted(auction);
  }

  async pickRandomWinner(auction: AuctionWithMembers) {
    const auctionUsers = auction.AuctionUsers;
    const winner = await this.helpers.pickRandomElementFromArray(auctionUsers.map(el => el.id));
    await this.prisma.auctionUsers.update({
      where: {
        id: winner
      },
      data: {
        isWinner: true
      }
    });
    return winner;
  }


  async markAuctionAsCompleted(auction: AuctionWithMembers) {
    return this.prisma.auctionOffers.update({
      where: {
        id: auction.id
      },
      data: {
        status: AuctionOffersStatus.COMPLETED
      }
    });
  }


  async addUserToApplicantPool(auctionId: number, userId: number): Promise<AuctionOffers> {
    const user = await this.sharedUser.getUserById(userId);
    const auction = await this.getAuctionById(auctionId);

    this.logger.verbose(`[addUserToApplicantPool] user ${user}`);
    this.logger.verbose(`[addUserToApplicantPool] auction ${auction}`);


    const userActiveAuctions = await this.getActiveAuctionByUserId(userId, {
      status: AuctionOffersStatus.PENDING
    });

    if (!auction || auction.status !== AuctionOffersStatus.PENDING) {
      throw new BadRequestException('9000', 'invalid auction id');
    }

    if (userActiveAuctions.length > 0) {
      throw new BadRequestException('9001', 'user already have active auctions');
    }

    if (auction.maxApplicants <= auction.AuctionUsers.length) {
      await this.onAuctionMaxApplicants(auction);
      throw new BadRequestException('9002', 'auction is full');
    }
    
    const hpMerchant = await this.sharedMerchant.cashInMerchant();
    await this.sharedBalance.doTransFromUserToMerchant(
      hpMerchant.id,
      user.id,
      auction.price,
      'due to apply for auction ' + auction.name + ' with id ' + auction.id,
    );

    const userAuction = await this.prisma.auctionUsers.create({
      data: {
        isWinner: false,
        user: {
          connect: {
            id: user.id
          }
        },
        offer: {
          connect: {
            id: auction.id
          }
        }
      },
    });



    return auction;
  }
}
