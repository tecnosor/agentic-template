import { v4 as uuidv4 } from 'uuid';

export class UserId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): UserId {
    return new UserId(uuidv4());
  }

  static of(value: string): UserId {
    if (!value || value.length < 10) {
      throw new Error(`Invalid UserId: ${value}`);
    }
    return new UserId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
