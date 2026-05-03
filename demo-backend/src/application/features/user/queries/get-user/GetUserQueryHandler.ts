import { injectable, inject } from 'tsyringe';
import type { GetUserQuery } from './GetUserQuery.js';
import type { GetUserQueryResult } from './GetUserQueryResult.js';
import type { UserRepository } from '../../../../../domain/repositories/UserRepository.js';
import { USER_REPOSITORY } from '../../../../../domain/repositories/tokens.js';
import { UserNotFoundError } from '../../../../../domain/errors/UserNotFoundError.js';

@injectable()
export class GetUserQueryHandler {
  constructor(
    @inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async handle(query: GetUserQuery): Promise<GetUserQueryResult> {
    const user = await this.userRepository.findById(query.id);
    if (user === null) {
      throw new UserNotFoundError(query.id);
    }

    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email.toString(),
      createdAt: user.createdAt.toISOString(),
    };
  }
}
