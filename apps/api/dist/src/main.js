import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
const server = app.listen(env.PORT, () => {
    logger.info(`API server listening on port ${env.PORT}`);
});
const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
