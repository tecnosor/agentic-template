import { DomainError } from './DomainError.js';

export class EmailAlreadyExistsError extends DomainError {
  readonly code = 'EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super(`Email already in use: ${email}`);
  }
}
