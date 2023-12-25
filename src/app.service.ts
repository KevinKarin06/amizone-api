import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './core/prisma/prisma.service';
import { hashPassword } from './utils/misc';
import { Status } from './utils/constants';
import { ApiResponse } from './types/response';
import { CustomLogger } from './utils/logger';

@Injectable()
export class AppService implements OnModuleInit {
  private logger = new CustomLogger('AppService');
  constructor(private prismaService: PrismaService) {}

  index(): ApiResponse<string> {
    return new ApiResponse({ data: 'Amizone is up and running 😁' });
  }

  async onModuleInit() {
    await this.initializeAdmin();
    await this.clearPendingExports();
  }

  private async clearPendingExports() {
    try {
      await this.prismaService.userExport.updateMany({
        where: { status: Status.Pending },
        data: {
          status: Status.Failed,
          message: 'Export cancelled',
          endTime: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed clean export', error);
    }
  }

  private async initializeAdmin() {
    try {
      const existingAdmin = await this.prismaService.user.findFirst({
        where: { isAdmin: true },
      });

      const password = process.env.ADMIN_PASS || 'pass';
      const hashed = await hashPassword(password);
      if (!existingAdmin) {
        await this.prismaService.user.create({
          data: {
            dateOfBirth: new Date(),
            interest: '',
            name: 'Admin',
            phoneNumber: process.env.ADMIN_PHONE || '237694271964',
            profession: '',
            sex: 'M',
            isAdmin: true,
            phoneVerified: true,
            hasPayment: true,
            password: hashed,
          },
        });
      } else {
        await this.prismaService.user.update({
          where: { id: existingAdmin.id },
          data: {
            phoneNumber: process.env.ADMIN_PHONE || '237694271964',
            password: hashed,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed clean export', error);
    }
  }
}
