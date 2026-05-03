export interface GetUserQueryResult {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: string; // ISO 8601 UTC
}
