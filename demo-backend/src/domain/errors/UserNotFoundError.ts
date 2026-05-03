import { DomainError } from './DomainError.js';

export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';

  constructor(id: string) {
    super(`User not found: ${id}`);
  }
}
