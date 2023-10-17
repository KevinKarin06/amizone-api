import { PrismaClient } from '@prisma/client';
import { TransactionMotif, Status } from 'src/utils/constants';

const prismaClient = new PrismaClient();
const referralRule = {
  1: 1000,
  2: 200,
  3: 100,
};

export const getChildrenRecursive = async (user: any, n: number, depth = 1) => {
  if (depth > n) {
    return user;
  }

  const directChildren = await prismaClient.user.findMany({
    where: { parentId: user.id, id: { not: user.id } },
    select: { name: true, profileImage: true, id: true },
  });

  user['children'] = [];

  for (const child of directChildren) {
    const childWithChildren = await getChildrenRecursive(child, n, depth + 1);
    childWithChildren['depth'] = depth;
    user['children'].push(childWithChildren);
  }

  return user;
};

export const calculateReferralBalance = async (
  userId: string,
  n: number,
  depth = 1,
) => {
  if (depth > n) {
    return 0;
  }

  let referralGain = 0;

  const directChildren = await prismaClient.user.findMany({
    where: { parentId: userId, id: { not: userId } },
    select: { id: true },
  });

  for (const child of directChildren) {
    const transaction = await prismaClient.transaction.findFirst({
      where: {
        userId: userId,
        referralIds: { contains: child.id },
        status: Status.Success,
        motif: TransactionMotif.ReferralGain,
      },
    });

    if (!transaction) {
      const amount = referralRule[depth];
      if (amount) {
        referralGain += amount;
      }
    }

    referralGain += await calculateReferralBalance(child.id, n, depth + 1);
  }

  return referralGain;
};
