export interface CreateUserCommandInput {
  name: string;
  email: string;
}

export class CreateUserCommand {
  private constructor(
    public readonly name: string,
    public readonly email: string,
  ) {}

  static of(input: CreateUserCommandInput): CreateUserCommand {
    return new CreateUserCommand(input.name, input.email);
  }
}
