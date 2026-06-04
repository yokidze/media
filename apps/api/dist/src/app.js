import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttpImport from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { apiRateLimiter } from './middleware/rate-limit.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { archiveItemsRouter } from './modules/archive-items/archive-items.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { tagsRouter } from './modules/tags/tags.routes.js';
import { archiveItemFilesRouter, filesRouter } from './modules/files/files.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { filtersRouter } from './modules/filters/filters.routes.js';
import { statisticsRouter } from './modules/statistics/statistics.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { favoritesRouter } from './modules/favorites/favorites.routes.js';
import { historyRouter } from './modules/history/history.routes.js';
export const app = express();
const pinoHttp = pinoHttpImport;
app.disable('x-powered-by');
app.use(pinoHttp({ logger }));
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
    origin: env.APP_ORIGIN,
    credentials: true
}));
app.use(apiRateLimiter);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});
app.use(`${env.API_BASE_PATH}/auth`, authRouter);
app.use(`${env.API_BASE_PATH}/users`, usersRouter);
app.use(`${env.API_BASE_PATH}/archive-items`, archiveItemFilesRouter);
app.use(`${env.API_BASE_PATH}/archive-items`, archiveItemsRouter);
app.use(`${env.API_BASE_PATH}/categories`, categoriesRouter);
app.use(`${env.API_BASE_PATH}/tags`, tagsRouter);
app.use(`${env.API_BASE_PATH}/files`, filesRouter);
app.use(`${env.API_BASE_PATH}/search`, searchRouter);
app.use(`${env.API_BASE_PATH}/filters`, filtersRouter);
app.use(`${env.API_BASE_PATH}/statistics`, statisticsRouter);
app.use(`${env.API_BASE_PATH}/favorites`, favoritesRouter);
app.use(`${env.API_BASE_PATH}/history`, historyRouter);
app.use(`${env.API_BASE_PATH}/admin`, adminRouter);
app.use(notFoundHandler);
app.use(errorHandler);
