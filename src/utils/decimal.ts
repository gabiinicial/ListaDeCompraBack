import { Prisma } from '@prisma/client';

export const toNumber = (value: Prisma.Decimal | number | string | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  return Number(value.toString());
};

export const toDecimal = (value: number | string): Prisma.Decimal => {
  return new Prisma.Decimal(value);
};

export const roundTo = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
