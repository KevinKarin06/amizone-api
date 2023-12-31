import {
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { user } from '@prisma/client';
import { ApiResponse } from 'src/types/response';
import { hashPassword } from 'src/utils/misc';
import { UserDto } from './user.dto';
import { MAX_DEPTH, TransactionMotif, Status } from 'src/utils/constants';
import {
  calculateReferralBalance,
  getReferralIDsFromTransactions,
} from 'src/utils/referrals';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async getUsers(
    queryParams: Record<string, any>,
  ): Promise<ApiResponse<user[]> | HttpException> {
    const { pagination, filters } = queryParams;

    const users = await this.prismaService.user.findMany({
      where: {
        ...filters,
        isAdmin: false,
      },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return new ApiResponse({ data: users, statusCode: 200 });
  }

  async searchUser(term: string): Promise<ApiResponse<user[]> | HttpException> {
    const users = await this.prismaService.user.findMany({
      where: {
        name: { contains: term },
        isAdmin: false,
      },
      take: 10,
    });

    return new ApiResponse({ data: users, statusCode: 200 });
  }

  async getUserCount(
    queryParams: Record<string, any>,
  ): Promise<ApiResponse<number> | HttpException> {
    const { filters } = queryParams;

    const totalUsers = await this.prismaService.user.count({
      where: { ...filters, isAdmin: false },
    });

    return new ApiResponse({ data: totalUsers, statusCode: 200 });
  }

  async getTotalUsersMonthly(
    year: string,
  ): Promise<ApiResponse<number> | HttpException> {
    let result: any = await this.prismaService.$queryRaw`
    SELECT 
      YEAR(createdAt) as year,
      MONTH(createdAt) as month,
      COUNT(id) as count
    FROM user
    WHERE YEAR(createdAt) = ${year}
      AND isAdmin = ${false}
    GROUP BY YEAR(createdAt), MONTH(createdAt)
  `;

    result = result.map((el: any) => {
      const count = BigInt(el.count);
      el['count'] = Number(count);
      return el;
    });

    return new ApiResponse({ data: result, statusCode: 200 });
  }

  async getTotalPendingUsersMonthly(
    year: string,
  ): Promise<ApiResponse<number> | HttpException> {
    let result: any = await this.prismaService.$queryRaw`
    SELECT 
      YEAR(createdAt) as year,
      MONTH(createdAt) as month,
      COUNT(id) as count
    FROM user
    WHERE hasPayment = ${false}
      AND YEAR(createdAt) = ${year}
      AND isAdmin = ${false}
    GROUP BY YEAR(createdAt), MONTH(createdAt)
  `;

    result = result.map((el: any) => {
      const count = BigInt(el.count);
      el['count'] = Number(count);
      return el;
    });

    return new ApiResponse({ data: result, statusCode: 200 });
  }

  async getProfile(
    authUser: user,
    userId: string,
  ): Promise<ApiResponse<user> | HttpException> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!authUser.isAdmin && authUser.id != user.id) {
      throw new ForbiddenException();
    }

    return new ApiResponse({ data: user, statusCode: 200 });
  }

  async getReferralsCount(
    authUser: user,
    userId: string,
  ): Promise<ApiResponse<number> | HttpException> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!authUser.isAdmin && authUser.id != user.id) {
      throw new ForbiddenException();
    }

    const count = await this.countReferralsRecursive(user.id, MAX_DEPTH);

    return new ApiResponse({ data: count, statusCode: 200 });
  }

  async getReferralTree(
    authUser: user,
    userId: string,
  ): Promise<ApiResponse<user> | HttpException> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!authUser.isAdmin && authUser.id != user.id) {
      throw new ForbiddenException();
    }

    const tree = await this.getChildrenRecursive(user, MAX_DEPTH);

    return new ApiResponse({ data: tree, statusCode: 200 });
  }

  async getFirstChild(
    authUser: user,
    userId: string,
  ): Promise<ApiResponse<user> | HttpException> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { name: true, profileImage: true, id: true, parentId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      !authUser.isAdmin &&
      authUser.id != user.id &&
      authUser.id != user.parentId
    ) {
      throw new ForbiddenException();
    }

    const tree = await this.getChildrenRecursive(user, 1);

    return new ApiResponse({ data: tree, statusCode: 200 });
  }

  async getReferralRevenue(
    authUser: user,
    userId: string,
  ): Promise<ApiResponse<number> | HttpException> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!authUser.isAdmin && authUser.id != user.id) {
      throw new ForbiddenException();
    }

    const result: any = await this.prismaService.$queryRaw`
         SELECT SUM(amount) AS sum
         FROM transaction
         WHERE userId = ${userId}
         AND status = ${Status.Success}
         AND motif = ${TransactionMotif.ReferralGain}`;

    return new ApiResponse({ data: result[0].sum || 0, statusCode: 200 });
  }

  async getReferralBalance(
    authUser: user,
    userId: string,
  ): Promise<ApiResponse<number> | HttpException> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!authUser.isAdmin && authUser.id != user.id) {
      throw new ForbiddenException();
    }

    const transactionReferralIds = await getReferralIDsFromTransactions(
      user.id,
    );

    const referralGain = await calculateReferralBalance(
      user.id,
      MAX_DEPTH,
      transactionReferralIds,
    );

    const totalGain = Object.values(referralGain).reduce(
      (acc: number, currentValue: number) => acc + currentValue,
      0,
    ) as number;

    return new ApiResponse({ data: totalGain, statusCode: 200 });
  }

  async updateProfile(
    data: UserDto,
    authUser: user,
    userId: string,
  ): Promise<ApiResponse<user> | HttpException> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!authUser.isAdmin && authUser.id != user.id) {
      throw new ForbiddenException();
    }

    let userData = {};
    const { password, active, dateOfBirth, ...rest } = data;

    let hashed = null;
    if (password && password != '') {
      hashed = await hashPassword(password);
      userData = { password: hashed };
    }

    if (authUser.isAdmin && active != undefined) {
      userData['active'] = active;
    }

    if (data.phoneNumber && data.phoneNumber != user.phoneNumber) {
      userData['phoneVerified'] = false;
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        ...rest,
        ...userData,
        dateOfBirth: data.dateOfBirth
          ? new Date(dateOfBirth)
          : user.dateOfBirth,
      },
    });

    return new ApiResponse({ data: updatedUser, statusCode: 201 });
  }

  private async countReferralsRecursive(
    parentId: string,
    maxDepth: number,
    currentDepth = 0,
  ): Promise<number> {
    if (currentDepth >= maxDepth) {
      return 0;
    }

    const directReferralsCount = await this.prismaService.user.count({
      where: { parentId },
    });

    let totalReferralsCount = directReferralsCount;

    const directReferrals = await this.prismaService.user.findMany({
      where: { parentId },
    });

    for (const directReferral of directReferrals) {
      totalReferralsCount += await this.countReferralsRecursive(
        directReferral.id,
        maxDepth,
        currentDepth + 1,
      );
    }

    return totalReferralsCount;
  }

  private async getChildrenRecursive(
    user: any,
    n: number,
    depth = 1,
  ): Promise<user> {
    if (depth > n) {
      return user;
    }

    const directChildren = await this.prismaService.user.findMany({
      where: { parentId: user.id, id: { not: user.id } },
      select: { name: true, profileImage: true, id: true },
    });

    user['children'] = [];

    for (const child of directChildren) {
      const childWithChildren = await this.getChildrenRecursive(
        child,
        n,
        depth + 1,
      );
      childWithChildren['depth'] = depth;
      user['children'].push(childWithChildren);
    }

    return user;
  }
}
