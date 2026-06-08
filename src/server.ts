import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const bootstrap = async () => {
  try {
    await prisma.$connect();

    const server = app.listen(env.PORT, () => {
      console.log(`Grocery Pro Backend running on port ${env.PORT}`);
    });

    const shutdown = async () => {
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

void bootstrap();
