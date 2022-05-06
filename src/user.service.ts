import { Injectable } from '@nestjs/common';
import { TeleStatus } from '@prisma/client';
import { PrismaService } from './prisma.service';

export enum TelegramStatus {
  member = 'member',
  creator = 'creator',
  administrator = 'administrator',
  restricted = 'restricted',
  left = 'left',
  kicked = 'kicked',
}

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByTeleId(tele_id: string) {
    try {
      return await this.prismaService.users.findFirst({
        where: {
          tele_id: tele_id,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async createUser({ teleId, tele_username, status }) {
    try {
      return await this.prismaService.users.create({
        data: {
          tele_id: teleId,
          tele_username: tele_username,
          status: status,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async updateUserStatus(teleId: string) {
    try {
      return await this.prismaService.users.updateMany({
        where: {
          tele_id: teleId,
        },
        data: {
          status: TeleStatus.activate,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
