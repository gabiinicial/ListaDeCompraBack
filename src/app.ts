import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler, notFound } from './middlewares/error.middleware';
import apiRoutes from './routes';
import healthRoutes from './routes/health.routes';

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
const corsOrigin = env.CORS_ORIGIN.trim() === '*' ? true : allowedOrigins;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
