import 'reflect-metadata';
import { container } from 'tsyringe';
import { InMemoryUserRepository } from './persistence/InMemoryUserRepository.js';
import { USER_REPOSITORY } from '../domain/repositories/tokens.js';
import { CreateUserCommandHandler } from '../application/features/user/commands/create-user/CreateUserCommandHandler.js';
import { GetUserQueryHandler } from '../application/features/user/queries/get-user/GetUserQueryHandler.js';

// Register repositories
container.registerSingleton(USER_REPOSITORY, InMemoryUserRepository);

// Register handlers (auto-injectable via @injectable())
container.registerSingleton(CreateUserCommandHandler);
container.registerSingleton(GetUserQueryHandler);

export { container };
