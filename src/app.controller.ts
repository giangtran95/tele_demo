import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  BadRequestException,
  InternalServerErrorException,
  HttpCode,
} from '@nestjs/common';
import { TeleStatus } from '@prisma/client';
import TelegramBot from 'node-telegram-bot-api';
import { TelegramStatus, UserService } from './user.service';
const token = process.env.BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
@Controller()
export class AppController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  async test(@Query('id') id: number, @Query('username') username: string) {
    try {
      const user = await this.userService.findUserByTeleId(String(id));
      if (!user) {
        await this.userService.createUser({
          teleId: String(id),
          tele_username: username,
          status: TeleStatus.pending,
        });
      }
      return process.env.TELEGRAM_CHANNEL;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @HttpCode(200)
  @Post('check/:teleId')
  async check(@Param('teleId') teleId: string) {
    try {
      const msg = await bot.getChatMember(
        process.env.TELEGRAM_CHANNEL_ID,
        teleId,
      );
      if (msg.status != TelegramStatus.member) {
        let err_msg = '';
        switch (msg.status) {
          case TelegramStatus.administrator:
            err_msg = `Can't participate because you're the administrator of the channel!`;
          case TelegramStatus.creator:
            err_msg = `Can't participate because you're the creator of the channel!`;
          case TelegramStatus.kicked:
            err_msg = `You have been kicked out of this channel. Please contact to the channel admin!`;
          case TelegramStatus.left:
            err_msg = `You haven't joint the channel!`;
          case TelegramStatus.restricted:
            err_msg = `You have been restricted from this channel. Please contact to the channel admin!`;
          default:
            err_msg = `You haven't joint the channel!`;
        }
        throw new Error(err_msg);
      } else {
        const user = await this.userService.findUserByTeleId(teleId);
        if (!user) {
          await this.callCreateUser({
            teleId: teleId,
            tele_username: msg?.user?.username,
            status: TeleStatus.activate,
          });
          return { code: 200, msg: 'Success!' };
        }
        await this.callUpdateUserStatus(teleId);
        return { code: 200, msg: 'Success!' };
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async callUpdateUserStatus(teleId: string) {
    await this.userService.updateUserStatus(teleId);
  }

  async callCreateUser({ teleId, tele_username, status }) {
    await this.userService.createUser({
      teleId: teleId,
      tele_username: tele_username,
      status: status,
    });
  }
}
