import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from 'src/types/response';
import { user } from '@prisma/client';
import { EVENTS, Status } from 'src/utils/constants';
import vcf from 'vcf';

@Injectable()
export class ExportService {
  constructor(
    private prismaService: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

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
      id: authUser.id,
      name: body?.name,
    });

    return new ApiResponse({ data: {}, statusCode: 200 });
  }

  @OnEvent(EVENTS.launchExport, { async: true })
  async exportUserContacts(payload: any) {
    console.log('begin export', payload);
  }
}
