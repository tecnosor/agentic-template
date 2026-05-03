import { Email } from '../value-objects/Email.js';
import { UserId } from '../value-objects/UserId.js';

interface UserProps {
  id: UserId;
  name: string;
  email: Email;
  createdAt: Date;
}

export class User {
  readonly id: UserId;
  readonly name: string;
  readonly email: Email;
  readonly createdAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.createdAt = props.createdAt;
  }

  static create(name: string, email: string): User {
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    return new User({
      id: UserId.generate(),
      name: name.trim(),
      email: Email.of(email),
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, name: string, email: string, createdAt: Date): User {
    return new User({
      id: UserId.of(id),
      name,
      email: Email.of(email),
      createdAt,
    });
  }
}
