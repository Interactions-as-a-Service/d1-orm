export class D1Orm {
	database: D1Database;

	constructor(database: D1Database) {
		this.database = database;
	}

	async exec<T = unknown>(query: string): Promise<D1Result<T>> {
		return this.database.exec<T>(query);
	}

	async dump(): Promise<ArrayBuffer> {
		return this.database.dump();
	}

	async prepare(query: string): Promise<D1PreparedStatement> {
		return this.database.prepare(query);
	}

	async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
		return this.database.batch<T>(statements);
	}
}
