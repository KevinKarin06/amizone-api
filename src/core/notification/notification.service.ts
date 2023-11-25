import { Injectable } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
import { user } from '@prisma/client';
// import { EVENTS } from 'src/utils/constants';
import { TechSoftAPI } from './tech-soft-api';
import { generateOtpCode } from 'src/utils/misc';
import { PrismaService } from '../prisma/prisma.service';
import { SmsMessage } from 'src/types/misc';

@Injectable()
export class NotificationService extends TechSoftAPI {
  constructor(private prismaService: PrismaService) {
    super();
  }

  // @OnEvent(EVENTS.otpSend, { async: true })
  async handleSendOtpEvent(payload: user) {
    const otp = generateOtpCode(6);

    await this.prismaService.otp.create({
      data: {
        phoneNumber: payload.phoneNumber,
        code: String(otp),
      },
    });

    const data: SmsMessage = {
      message: `Your verification code is : ${otp}`,
      phoneNumber: payload.phoneNumber,
    };

    await this.sendSms(data);
  }
}
