import type { User } from '../../domain/entities/User.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.store.set(user.id.toString(), user);
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email.toString() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
