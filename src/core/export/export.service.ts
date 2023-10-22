import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from 'src/types/response';
import { user, userExport } from '@prisma/client';
import { EVENTS, Status } from 'src/utils/constants';
import {
  generateFilePath,
  getCurrentTimestamp,
  writeToFile,
} from 'src/utils/misc';
import { createReadStream } from 'fs';

@Injectable()
export class ExportService {
  constructor(
    private prismaService: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async downloadContactExport(
    id: string,
    authUser: user,
  ): Promise<StreamableFile | HttpException> {
    const userExport = await this.prismaService.userExport.findFirst({
      where: { id, status: Status.Success },
    });

    if (!userExport) {
      throw new NotFoundException('Export not found');
    }

    if (userExport.userId != authUser.id && !authUser.isAdmin) {
      throw new ForbiddenException();
    }

    const file = createReadStream(userExport.filePath);
    return new StreamableFile(file);
  }

  async launchContactExport(
    authUser: user,
    queryParams: Record<string, any>,
    body: any,
  ): Promise<ApiResponse<any> | HttpException> {
    const { filters } = queryParams;

    const pendingExport = await this.prismaService.userExport.findFirst({
      where: { userId: authUser.id, status: Status.Pending },
    });

    if (pendingExport) {
      throw new ConflictException('Another export is ongoing');
    }

    this.eventEmitter.emit(EVENTS.launchExport, {
      filters,
      userId: authUser.id,
      name: body?.name,
    });

    return new ApiResponse({ data: {}, statusCode: 200 });
  }

  async getUserExports(
    authUser: user,
    queryParams: Record<string, any>,
  ): Promise<ApiResponse<userExport[]> | HttpException> {
    const { pagination, filters } = queryParams;

    const userExports = await this.prismaService.userExport.findMany({
      where: { ...filters, userId: authUser.isAdmin ? undefined : authUser.id },
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
    });

    return new ApiResponse({ data: userExports, statusCode: 200 });
  }

  @OnEvent(EVENTS.launchExport, { async: true })
  async exportUserContacts(payload: any) {
    const { filters, userId, name } = payload;

    const contactExport = await this.prismaService.userExport.create({
      data: {
        status: Status.Pending,
        userId,
        name: name || `Export_${getCurrentTimestamp()}`,
        startTime: new Date(),
      },
    });

    const filePath = generateFilePath(`${contactExport.id}.vcf`, userId);

    try {
      let skip = 0;
      const take = 100;
      let hasMoreData = true;
      let totalExported = 0;

      while (hasMoreData) {
        const chunk = await this.prismaService.user.findMany({
          where: { ...filters, isAdmin: false, id: { not: userId } },
          skip,
          take,
        });

        if (chunk.length === 0) {
          hasMoreData = false;
          break;
        }

        for (const user of chunk) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const vCard = require('vcards-js')();

          vCard.firstName = user.name;
          vCard.birthday = user.dateOfBirth;
          vCard.cellPhone = user.phoneNumber;
          vCard.otherPhone = user.phoneNumber;
          vCard.email = user.email;
          vCard.uid = user.id;
          vCard.title = user.profession;
          vCard.version = '4.0';
          if (user.profileImage) {
            vCard.photo.embedFromString(user.profileImage, '');
          }

          writeToFile(filePath, vCard.getFormattedString(), true);
          totalExported++;
        }

        skip += take;
      }

      await this.prismaService.userExport.update({
        where: { id: contactExport.id },
        data: {
          status: Status.Success,
          message: 'Export complete',
          totalExported,
          filePath,
          endTime: new Date(),
        },
      });
    } catch (error) {
      console.log(error);
      await this.prismaService.userExport.update({
        where: { id: contactExport.id },
        data: {
          status: Status.Failed,
          message: 'Export failed',
          details: error?.toString(),
          endTime: new Date(),
        },
      });
    }
  }
}
