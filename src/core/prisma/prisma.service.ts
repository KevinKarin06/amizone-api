import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { calculateReferralBalance } from './prisma-utils';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    this.$extends({
      model: {
        user: {
          async getReferralBalance(id: string, depth = 3) {
            // return await calculateReferralBalance(id, depth);
          },
        },
      },
      query: {
        $allModels: {
          findMany({ args, query }) {
            args = { orderBy: { createdAt: 'desc' }, ...args };

            return query(args);
          },
        },
      },
    });
  }
}
