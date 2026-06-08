import { NotificationType, Prisma } from '@prisma/client';

import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';

export type CreateNotificationInput = {
  userId: string;
  listId?: string | null;
  itemId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue | null;
};

const notificationSelect = {
  id: true,
  userId: true,
  listId: true,
  itemId: true,
  type: true,
  title: true,
  message: true,
  isRead: true,
  metadata: true,
  createdAt: true,
  updatedAt: true
} as const;

export const notificationService = {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        listId: input.listId ?? null,
        itemId: input.itemId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata ?? undefined
      },
      select: notificationSelect
    });
  },

  async createEvent(input: CreateNotificationInput) {
    return this.create(input);
  },

  async findAllByUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: notificationSelect
    });
  },

  async countUnreadByUser(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  },

  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: notificationSelect
    });

    if (!notification) {
      throw new AppError('Notificación no encontrada', 404);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      select: notificationSelect
    });
  }
};
