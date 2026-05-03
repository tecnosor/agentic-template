import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { container } from '../../container.js';
import { CreateUserCommandHandler } from '../../../application/features/user/commands/create-user/CreateUserCommandHandler.js';
import { CreateUserCommand } from '../../../application/features/user/commands/create-user/CreateUserCommand.js';
import { GetUserQueryHandler } from '../../../application/features/user/queries/get-user/GetUserQueryHandler.js';
import { GetUserQuery } from '../../../application/features/user/queries/get-user/GetUserQuery.js';

const router = Router();

const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

// POST /v1/users
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'urn:error:validation',
        title: 'VALIDATION_ERROR',
        status: 400,
        detail: parsed.error.message,
        instance: req.path,
      });
      return;
    }

    const handler = container.resolve(CreateUserCommandHandler);
    const command = CreateUserCommand.of(parsed.data);
    const result = await handler.handle(command);

    res.status(201).json({ id: result.id });
  } catch (err) {
    next(err);
  }
});

// GET /v1/users/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const handler = container.resolve(GetUserQueryHandler);
    const query = GetUserQuery.of({ id: req.params['id'] ?? '' });
    const result = await handler.handle(query);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export { router as userRouter };
