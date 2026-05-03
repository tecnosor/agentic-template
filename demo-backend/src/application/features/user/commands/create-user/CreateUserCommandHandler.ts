import { injectable, inject } from 'tsyringe';
import type { CreateUserCommand } from './CreateUserCommand.js';
import type { CreateUserCommandResult } from './CreateUserCommandResult.js';
import type { UserRepository } from '../../../../../domain/repositories/UserRepository.js';
import { USER_REPOSITORY } from '../../../../../domain/repositories/tokens.js';
import { User } from '../../../../../domain/entities/User.js';
import { EmailAlreadyExistsError } from '../../../../../domain/errors/EmailAlreadyExistsError.js';

@injectable()
export class CreateUserCommandHandler {
  constructor(
    @inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async handle(command: CreateUserCommand): Promise<CreateUserCommandResult> {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing !== null) {
      throw new EmailAlreadyExistsError(command.email);
    }

    const user = User.create(command.name, command.email);
    await this.userRepository.save(user);

    return { id: user.id.toString() };
  }
}
