import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { user } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';

const IS_PUBLIC_KEY = 'isPublic';
const IS_ADMIN = 'isAdmin';
const IS_PAYMENT = 'isPayment';

export const Public = (value = true) => SetMetadata(IS_PUBLIC_KEY, value);
export const Admin = (value = true) => SetMetadata(IS_ADMIN, value);
export const Payment = (value = true) => SetMetadata(IS_PAYMENT, value);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const isAdmin = this.reflector.getAllAndOverride<boolean>(IS_ADMIN, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isPayment = this.reflector.getAllAndOverride<boolean>(IS_PAYMENT, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      let payload: user = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_TOKEN,
      });

      payload = await this.prismaService.user.findUniqueOrThrow({
        where: { id: payload.id },
      });

      if (isAdmin && !payload.isAdmin) {
        throw new ForbiddenException();
      }

      if (isPayment && !payload.isAdmin && !payload.hasPayment) {
        throw new UnauthorizedException();
      }

      if (!payload.isAdmin && !payload.active) {
        throw new ForbiddenException();
      }

      request['user'] = payload;
    } catch (e) {
      if (e instanceof ForbiddenException) {
        throw new ForbiddenException();
      } else {
        throw new UnauthorizedException();
      }
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
