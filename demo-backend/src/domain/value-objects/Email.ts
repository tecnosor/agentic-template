export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static of(raw: string): Email {
    const normalised = raw.trim().toLowerCase();
    if (!normalised.includes('@') || normalised.length < 5) {
      throw new Error(`Invalid email address: ${raw}`);
    }
    return new Email(normalised);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
