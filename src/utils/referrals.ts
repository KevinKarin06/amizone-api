import { PrismaClient } from '@prisma/client';
import { TransactionMotif, Status } from 'src/utils/constants';

const prismaClient = new PrismaClient();
const referralRule = {
  1: 1000,
  2: 300,
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

export const getReferralIDsFromTransactions = async (userId: string) => {
  const transactions = await prismaClient.transaction.findMany({
    where: {
      userId: userId,
      status: Status.Success,
      motif: TransactionMotif.ReferralGain,
    },
    select: { referralIds: true },
  });
  const referralIds = transactions
    .filter((t) => t.referralIds != null && t.referralIds != undefined)
    .flatMap((t) => t.referralIds.trim().split(','));

  return referralIds;
};

export const calculateReferralBalance = async (
  userId: string,
  n: number,
  transactionReferralIds: Array<string>,
  depth = 1,
) => {
  if (depth > n) {
    return {};
  }

  let referralGain = {};

  const directChildren = await prismaClient.user.findMany({
    where: { parentId: userId, id: { not: userId }, hasPayment: true },
    select: { id: true },
  });

  for (const child of directChildren) {
    if (!transactionReferralIds.includes(child.id)) {
      const amount = referralRule[depth];
      if (amount) {
        referralGain[child.id] = amount;
      }
    }

    const temp = await calculateReferralBalance(
      child.id,
      n,
      transactionReferralIds,
      depth + 1,
    );
    referralGain = { ...referralGain, ...temp };
  }

  return referralGain;
};
