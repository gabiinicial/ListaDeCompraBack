import { BudgetStatus, NotificationType } from '@prisma/client';

import { prisma } from '../config/prisma';
import { roundTo, toDecimal, toNumber } from '../utils/decimal';
import { notificationService } from './notification.service';
import { shoppingListService } from './shoppingList.service';

type BudgetUpsertInput = {
  totalLimit: number;
  currency?: string;
};

const budgetSelect = {
  id: true,
  listId: true,
  totalLimit: true,
  calculatedTotal: true,
  currency: true,
  status: true,
  createdAt: true,
  updatedAt: true
} as const;

const DEFAULT_THRESHOLD = 0.9;

const serializeBudget = (budget: Awaited<ReturnType<typeof prisma.budget.upsert>>) => ({
  id: budget.id,
  listId: budget.listId,
  totalLimit: budget.totalLimit === null ? null : toNumber(budget.totalLimit),
  calculatedTotal: toNumber(budget.calculatedTotal),
  currency: budget.currency,
  status: budget.status,
  createdAt: budget.createdAt,
  updatedAt: budget.updatedAt
});

const calculateStatus = (limit: number | null, total: number) => {
  if (limit === null) {
    return BudgetStatus.NO_BUDGET;
  }

  if (total > limit) {
    return BudgetStatus.OVER_LIMIT;
  }

  if (limit > 0 && total >= limit * DEFAULT_THRESHOLD) {
    return BudgetStatus.NEAR_LIMIT;
  }

  return BudgetStatus.UNDER_LIMIT;
};

const computeTotals = async (listId: string) => {
  const items = await prisma.item.findMany({
    where: { listId },
    select: {
      quantity: true,
      price: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  let estimatedTotal = 0;
  const categoryTotals = new Map<string, { categoryId: string | null; categoryName: string; total: number }>();

  for (const item of items) {
    const itemTotal = roundTo(toNumber(item.quantity) * toNumber(item.price));
    estimatedTotal = roundTo(estimatedTotal + itemTotal);

    const categoryId = item.categoryId ?? 'uncategorized';
    const categoryName = item.category?.name ?? 'Sin categoría';
    const existing = categoryTotals.get(categoryId);

    if (existing) {
      existing.total = roundTo(existing.total + itemTotal);
    } else {
      categoryTotals.set(categoryId, {
        categoryId: item.categoryId,
        categoryName,
        total: itemTotal
      });
    }
  }

  return {
    estimatedTotal,
    categoryTotals: Array.from(categoryTotals.values())
  };
};

export const budgetService = {
  async getBudgetState(userId: string, listId: string) {
    await shoppingListService.findById(userId, listId);

    const budget = await prisma.budget.findUnique({
      where: { listId },
      select: budgetSelect
    });

    const totals = await computeTotals(listId);

    const normalizedBudget = budget
      ? serializeBudget(budget)
      : {
          id: null,
          listId,
          totalLimit: null,
          calculatedTotal: totals.estimatedTotal,
          currency: 'USD',
          status: BudgetStatus.NO_BUDGET,
          createdAt: null,
          updatedAt: null
        };

    return {
      budget: normalizedBudget,
      summary: {
        estimatedTotal: totals.estimatedTotal,
        status: calculateStatus(normalizedBudget.totalLimit, totals.estimatedTotal),
        categoryTotals: totals.categoryTotals,
        remaining: normalizedBudget.totalLimit === null ? null : roundTo(normalizedBudget.totalLimit - totals.estimatedTotal),
        isOverLimit: normalizedBudget.totalLimit === null ? false : totals.estimatedTotal > normalizedBudget.totalLimit
      }
    };
  },

  async upsertBudget(userId: string, listId: string, input: BudgetUpsertInput) {
    await shoppingListService.findById(userId, listId);

    const totals = await computeTotals(listId);
    const previousBudget = await prisma.budget.findUnique({
      where: { listId },
      select: budgetSelect
    });

    const status = calculateStatus(input.totalLimit, totals.estimatedTotal);
    const budget = await prisma.budget.upsert({
      where: { listId },
      create: {
        listId,
        totalLimit: toDecimal(input.totalLimit),
        calculatedTotal: toDecimal(totals.estimatedTotal),
        currency: input.currency?.trim() || 'USD',
        status
      },
      update: {
        totalLimit: toDecimal(input.totalLimit),
        calculatedTotal: toDecimal(totals.estimatedTotal),
        currency: input.currency?.trim() || 'USD',
        status
      },
      select: budgetSelect
    });

    if (status === BudgetStatus.OVER_LIMIT && previousBudget?.status !== BudgetStatus.OVER_LIMIT) {
      await notificationService.createEvent({
        userId,
        listId,
        type: NotificationType.BUDGET_EXCEEDED,
        title: 'Presupuesto superado',
        message: `La lista ${listId} superó el presupuesto definido.`,
        metadata: {
          listId,
          totalLimit: input.totalLimit,
          estimatedTotal: totals.estimatedTotal
        }
      });
    }

    return {
      budget: serializeBudget(budget),
      summary: {
        estimatedTotal: totals.estimatedTotal,
        status,
        categoryTotals: totals.categoryTotals,
        remaining: roundTo(input.totalLimit - totals.estimatedTotal),
        isOverLimit: status === BudgetStatus.OVER_LIMIT
      }
    };
  },

  async recalculateBudget(listId: string, userId: string) {
    const budget = await prisma.budget.findUnique({
      where: { listId },
      select: budgetSelect
    });

    const totals = await computeTotals(listId);
    const nextStatus = calculateStatus(budget?.totalLimit != null ? toNumber(budget.totalLimit) : null, totals.estimatedTotal);

    const updatedBudget = await prisma.budget.upsert({
      where: { listId },
      create: {
        listId,
        totalLimit: budget?.totalLimit ?? null,
        calculatedTotal: toDecimal(totals.estimatedTotal),
        currency: budget?.currency ?? 'USD',
        status: nextStatus
      },
      update: {
        calculatedTotal: toDecimal(totals.estimatedTotal),
        status: nextStatus,
        ...(budget?.totalLimit != null ? { totalLimit: budget.totalLimit } : {}),
        ...(budget?.currency ? { currency: budget.currency } : {})
      },
      select: budgetSelect
    });

    if (nextStatus === BudgetStatus.OVER_LIMIT && budget != null && budget.status !== BudgetStatus.OVER_LIMIT && budget.totalLimit !== null) {
      await notificationService.createEvent({
        userId,
        listId,
        type: NotificationType.BUDGET_EXCEEDED,
        title: 'Presupuesto superado',
        message: `La lista ${listId} superó el presupuesto establecido.`,
        metadata: {
          listId,
          totalLimit: toNumber(budget.totalLimit),
          estimatedTotal: totals.estimatedTotal
        }
      });
    }

    return {
      budget: serializeBudget(updatedBudget),
      summary: {
        estimatedTotal: totals.estimatedTotal,
        status: nextStatus,
        categoryTotals: totals.categoryTotals,
        remaining: updatedBudget.totalLimit === null ? null : roundTo(toNumber(updatedBudget.totalLimit) - totals.estimatedTotal),
        isOverLimit: nextStatus === BudgetStatus.OVER_LIMIT
      }
    };
  }
};
