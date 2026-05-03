import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateUserCommandHandler } from './CreateUserCommandHandler.js';
import { CreateUserCommand } from './CreateUserCommand.js';
import type { UserRepository } from '../../../../../domain/repositories/UserRepository.js';
import { EmailAlreadyExistsError } from '../../../../../domain/errors/EmailAlreadyExistsError.js';

describe('CreateUserCommandHandler', () => {
  let repository: UserRepository;
  let handler: CreateUserCommandHandler;

  beforeEach(() => {
    repository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    handler = new CreateUserCommandHandler(repository);
  });

  describe('when email is new', () => {
    it('should create the user and return an ID', async () => {
      // Arrange
      const command = CreateUserCommand.of({ name: 'Alice', email: 'alice@example.com' });

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(repository.save).toHaveBeenCalledOnce();
    });
  });

  describe('when email already exists', () => {
    it('should throw EmailAlreadyExistsError', async () => {
      // Arrange
      vi.mocked(repository.findByEmail).mockResolvedValue({} as never);
      const command = CreateUserCommand.of({ name: 'Bob', email: 'bob@example.com' });

      // Act + Assert
      await expect(handler.handle(command)).rejects.toThrow(EmailAlreadyExistsError);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
