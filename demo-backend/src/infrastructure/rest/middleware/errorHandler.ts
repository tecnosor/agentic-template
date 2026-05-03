import type { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../domain/errors/DomainError.js';
import { UserNotFoundError } from '../../../domain/errors/UserNotFoundError.js';
import { EmailAlreadyExistsError } from '../../../domain/errors/EmailAlreadyExistsError.js';

// RFC 7807 Problem Details
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId?: string;
}

function statusForDomainError(error: DomainError): number {
  if (error instanceof UserNotFoundError) return 404;
  if (error instanceof EmailAlreadyExistsError) return 409;
  return 400;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = (req as Request & { correlationId?: string }).correlationId;

  if (err instanceof DomainError) {
    const status = statusForDomainError(err);
    const body: ProblemDetails = {
      type: `urn:error:${err.code.toLowerCase().replace(/_/g, '-')}`,
      title: err.code,
      status,
      detail: err.message,
      instance: req.path,
      ...(correlationId !== undefined && { correlationId }),
    };
    res.status(status).json(body);
    return;
  }

  // Unexpected errors — do not leak internals
  console.error('Unhandled error', err);
  const body: ProblemDetails = {
    type: 'urn:error:internal-server-error',
    title: 'INTERNAL_SERVER_ERROR',
    status: 500,
    detail: 'An unexpected error occurred',
    instance: req.path,
    ...(correlationId !== undefined && { correlationId }),
  };
  res.status(500).json(body);
}
