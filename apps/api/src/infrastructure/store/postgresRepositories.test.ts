import type { QueryResult, QueryResultRow } from "pg";
import { describe, expect, it } from "vitest";
import type { User } from "./entities.js";
import { PostgresRepositories } from "./postgresRepositories.js";

describe("PostgresRepositories", () => {
  it("maps inserted users back to domain shape", async () => {
    const user: User = {
      id: "user-1",
      email: "owner@example.com",
      passwordHash: "hash",
      firstName: "Demo",
      lastName: "Owner",
      status: "active",
      recoveryCodeHashes: [],
      createdAt: new Date("2026-05-16T12:00:00.000Z"),
      updatedAt: new Date("2026-05-16T12:00:00.000Z")
    };
    const executor = new FakeExecutor([
      {
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        first_name: user.firstName,
        last_name: user.lastName,
        status: user.status,
        email_verified_at: null,
        two_factor_secret: null,
        two_factor_enabled_at: null,
        recovery_code_hashes: [],
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }
    ]);
    const repositories = new PostgresRepositories(executor);

    const created = await repositories.users.createUser(user);

    expect(executor.queries[0]).toContain("INSERT INTO users");
    expect(created).toEqual(user);
  });

  it("commits successful transactions", async () => {
    const client = new FakeClient();
    const repositories = new PostgresRepositories(client, {
      connect: async () => client
    });

    const result = await repositories.transaction(async () => "ok");

    expect(result).toBe("ok");
    expect(client.queries).toEqual(["BEGIN", "COMMIT"]);
    expect(client.released).toBe(true);
  });

  it("rolls back failed transactions", async () => {
    const client = new FakeClient();
    const repositories = new PostgresRepositories(client, {
      connect: async () => client
    });

    await expect(
      repositories.transaction(async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    expect(client.queries).toEqual(["BEGIN", "ROLLBACK"]);
    expect(client.released).toBe(true);
  });
});

class FakeExecutor {
  readonly queries: string[] = [];

  constructor(private readonly rows: QueryResultRow[] = []) {}

  async query<R extends QueryResultRow>(text: string): Promise<QueryResult<R>> {
    this.queries.push(text.trim());
    return {
      command: "SELECT",
      rowCount: this.rows.length,
      oid: 0,
      fields: [],
      rows: this.rows as R[]
    };
  }
}

class FakeClient extends FakeExecutor {
  released = false;

  release() {
    this.released = true;
  }
}
