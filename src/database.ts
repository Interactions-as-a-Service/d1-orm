/**
 * The D1Orm class is the main class for the ORM. It is used to create models, and to run queries.
 *
 * It's methods generally don't need to be called directly, but are instead to be used by the models.
 */
import type {
	D1Database,
	D1ExecResult,
	D1PreparedStatement,
	D1Result,
} from "@cloudflare/workers-types";
export class D1Orm implements D1Database {
	constructor(database: D1Database) {
		if (!isDatabase(database)) {
			throw new Error(
				"Invalid database, should contain prepare, dump, batch, and exec methods",
			);
		}
		this.database = database;
	}

	private readonly database: D1Database;

	public prepare(query: string): D1PreparedStatement {
		return this.database.prepare(query);
	}

	public async dump(): Promise<ArrayBuffer> {
		return this.database.dump();
	}

	public async batch<T>(
		statements: D1PreparedStatement[],
	): Promise<D1Result<T>[]> {
		return this.database.batch<T>(statements);
	}

	public async exec(query: string): Promise<D1ExecResult> {
		return this.database.exec(query);
	}
}

/**
 * @private
 * @hidden
 */
export function isDatabase(database: unknown): database is D1Database {
	return (
		!!database &&
		["prepare", "dump", "batch", "exec"].every(
			// @ts-expect-error - We're checking if the database is valid
			(x) => typeof database[x] === "function",
		)
	);
}
