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
import TelegramBot = require("node-telegram-bot-api");
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
      console.log(msg)
      if (msg.status != TelegramStatus.member) {
        throw new Error('Failed!');
      } else {
        const user = await this.userService.findUserByTeleId(teleId);
        if (user) {
          await this.userService.updateUserStatus(teleId);
        } else
          await this.userService.createUser({
            teleId: teleId,
            tele_username: msg?.user?.username,
            status: TeleStatus.activate,
          });
        return { code: 200, msg: 'Success!' };
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
