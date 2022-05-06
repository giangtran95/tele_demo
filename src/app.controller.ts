import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
  Req,
  BadRequestException,
  InternalServerErrorException,
  HttpCode,
} from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { users as UserModel, Prisma, tele_status } from '@prisma/client'
const TelegramBot = require('node-telegram-bot-api');
const token = '5331358070:AAHI_EVrwUZaCN7tEQXLWFWsAMgGXXd2EoI';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
@Controller()
export class AppController {
  constructor(
    private readonly prismaService: PrismaService,
  ) { }

  @Get('')
  async test(
    @Query('id') id: number,
    @Query('username') username: string,
  ){
    try {
      let user = await this.prismaService.users.findFirst({
        where: {
          tele_id: String(id)
        }
      })
      if (!user) {
        await this.prismaService.users.create({
          data: {
            tele_id: String(id),
            tele_username: username,
            status: tele_status.pending,
          }
        })
      }
      return 'https://t.me/+IqcXOLGXRXRlZjBl'
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  @HttpCode(200)
  @Post('check/:tele_id')
  async check(@Param('tele_id') tele_id: number) {
    try {
      let msg = await bot.getChatMember(-1001550813126, tele_id)
      if (msg.status == 'member') {
        await this.prismaService.users.upsert({
          where: {
            tele_id: String(tele_id),
          },
          update: {
            status: tele_status.activate
          },
          create: {
            tele_id: String(tele_id),
            tele_username: msg?.user?.username,
            status: tele_status.activate
          }
        });
        return {code: 200, 'msg': "Success!"}
      } else {
        return {'msg': 'Failed!'}
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}