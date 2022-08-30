export class D1Orm implements D1Database {
	database: D1Database;

	constructor(database: D1Database) {
		this.database = database;
	}

	async exec<T>(query: string): Promise<D1Result<T>> {
		return this.database.exec<T>(query);
	}

	async dump(): Promise<ArrayBuffer> {
		return this.database.dump();
	}

	prepare(query: string): D1PreparedStatement {
		return this.database.prepare(query);
	}

	async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
		return this.database.batch<T>(statements);
	}
}
