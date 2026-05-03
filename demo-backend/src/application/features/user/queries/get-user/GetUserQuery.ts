export interface GetUserQueryInput {
  id: string;
}

export class GetUserQuery {
  private constructor(
    public readonly id: string,
  ) {}

  static of(input: GetUserQueryInput): GetUserQuery {
    return new GetUserQuery(input.id);
  }
}
