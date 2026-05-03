import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const correlationId = (req.headers['x-correlation-id'] as string | undefined) ?? uuidv4();
  res.setHeader('X-Correlation-Id', correlationId);
  // Attach to request for downstream use
  (req as Request & { correlationId: string }).correlationId = correlationId;
  next();
}
