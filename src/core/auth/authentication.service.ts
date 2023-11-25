import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  RegisterDto,
  ResendDto,
  ResetDto,
  VerifyDto,
} from './authentication.dto';
import { ApiResponse } from 'src/types/response';
import { user } from '@prisma/client';
import { checkOtpExpired, comparePassword, hashPassword } from 'src/utils/misc';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { EVENTS } from 'src/utils/constants';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AuthenticationService {
  private notificationService: NotificationService;
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService, // private eventEmitter: EventEmitter2,
  ) {
    this.notificationService = new NotificationService(this.prismaService);
  }

  async register(
    data: RegisterDto,
  ): Promise<ApiResponse<user> | HttpException> {
    const existingUser = await this.prismaService.user.findFirst({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existingUser) {
      throw new ConflictException('Phone number already taken');
    }

    if (data.parentId) {
      const parent = await this.prismaService.user.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new BadRequestException('Invalid parent id');
      }
    }

    const { password, dateOfBirth, ...rest } = data;
    const hashed: string = await hashPassword(password);

    const user = await this.prismaService.user.create({
      data: { ...rest, password: hashed, dateOfBirth: new Date(dateOfBirth) },
    });

    // this.eventEmitter.emit(EVENTS.otpSend, user);
    await this.notificationService.handleSendOtpEvent(user);

    return new ApiResponse({ data: user, statusCode: 201 });
  }

  async login(data: LoginDto): Promise<ApiResponse<any> | HttpException> {
    const user = await this.prismaService.user.findFirst({
      where: { phoneNumber: data.phoneNumber },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password } = data;

    const validPassword = await comparePassword(user.password, password);

    if (!validPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!user.phoneVerified) {
      // this.eventEmitter.emit(EVENTS.otpSend, user);
      await this.notificationService.handleSendOtpEvent(user);

      return new ApiResponse({ data: user, statusCode: 201 });
    }

    const token = await this.jwtService.signAsync(user, { expiresIn: '7d' });

    return new ApiResponse({ data: { ...user, token }, statusCode: 201 });
  }

  async verifyOtp(data: VerifyDto): Promise<ApiResponse<any> | HttpException> {
    const user = await this.prismaService.user.findFirst({
      where: { phoneNumber: data.phoneNumber },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = await this.prismaService.otp.findFirst({
      where: { phoneNumber: data.phoneNumber },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnprocessableEntityException('Invalid code');
    }

    const otpExpired = checkOtpExpired(otp.createdAt, 5);

    if (otpExpired) {
      throw new UnprocessableEntityException('Code expired');
    }

    if (otp.code != data.code) {
      throw new UnprocessableEntityException('Invalid code');
    }

    if (!user.phoneVerified) {
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    const token = await this.jwtService.signAsync(
      { ...user, password: null },
      { expiresIn: '7d' },
    );

    await this.prismaService.otp.deleteMany({
      where: { phoneNumber: user.phoneNumber },
    });

    return new ApiResponse({ data: { ...user, token }, statusCode: 201 });
  }

  async resendOtp(data: ResendDto): Promise<ApiResponse<user> | HttpException> {
    const user = await this.prismaService.user.findFirst({
      where: { phoneNumber: data.phoneNumber },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // this.eventEmitter.emit(EVENTS.otpSend, user);
    await this.notificationService.handleSendOtpEvent(user);

    return new ApiResponse({ data: user, statusCode: 201 });
  }

  async resetPassword(
    data: ResetDto,
    authUser: user,
  ): Promise<ApiResponse<user> | HttpException> {
    const user = await this.prismaService.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashed: string = await hashPassword(data.password);

    const updatedUser = await this.prismaService.user.update({
      where: { id: authUser.id },
      data: { password: hashed },
    });

    return new ApiResponse({ data: updatedUser, statusCode: 201 });
  }
}
