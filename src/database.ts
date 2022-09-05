/**
 * The D1Orm class is the main class for the ORM. It is used to create models, and to run queries.
 *
 * It's methods generally don't need to be called directly, but are instead to be used by the models.
 */
export class D1Orm implements D1Database {
	constructor(database: D1Database) {
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
		statements: D1PreparedStatement[]
	): Promise<D1Result<T>[]> {
		return this.database.batch<T>(statements);
	}

	public async exec<T>(query: string): Promise<D1Result<T>> {
		return this.database.exec<T>(query);
	}
}
