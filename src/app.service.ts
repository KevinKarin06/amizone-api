import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './core/prisma/prisma.service';
import { hashPassword } from './utils/misc';
import { Status } from './utils/constants';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private prismaService: PrismaService) {}

  getHello(): string {
    return 'App is up and running.....';
  }

  async onModuleInit() {
    try {
      const existingAdmin = await this.prismaService.user.findFirst({
        where: { isAdmin: true },
      });

      if (!existingAdmin) {
        const password = process.env.ADMIN_PASS || 'pass';
        const hashed = await hashPassword(password);

        await this.prismaService.user.create({
          data: {
            dateOfBirth: new Date(),
            interest: '',
            name: 'Admin',
            phoneNumber: process.env.ADMIN_PHONE || '',
            profession: '',
            sex: 'M',
            isAdmin: true,
            phoneVerified: true,
            hasPayment: true,
            password: hashed,
          },
        });
      }

      await this.prismaService.userExport.updateMany({
        where: { status: Status.Pending },
        data: {
          status: Status.Failed,
          message: 'Export cancelled',
          endTime: new Date(),
        },
      });
    } catch (error) {
      console.log('Failed to initialize admin', error?.message);
    }
  }
}
