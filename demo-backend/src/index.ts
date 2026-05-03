import 'reflect-metadata';
import './infrastructure/container.js';
import express from 'express';
import { correlationIdMiddleware } from './infrastructure/rest/middleware/correlationId.js';
import { errorHandler } from './infrastructure/rest/middleware/errorHandler.js';
import { userRouter } from './infrastructure/rest/controllers/UserController.js';

const app = express();

// Middleware
app.use(express.json());
app.use(correlationIdMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'UP' });
});

// API routes
app.use('/v1/users', userRouter);

// Error handler (must be last)
app.use(errorHandler);

const PORT = Number(process.env['PORT'] ?? 3000);

app.listen(PORT, () => {
  console.log(JSON.stringify({ level: 'info', message: `Server started on port ${PORT}`, port: PORT }));
});

export { app };
