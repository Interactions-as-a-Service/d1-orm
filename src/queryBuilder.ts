export enum QueryType {
	SELECT = "SELECT",
	INSERT = "INSERT",
	UPDATE = "UPDATE",
	DELETE = "DELETE",
}

export type GenerateQueryOptions<T> = {
	limit?: number;
	offset?: number;
	where?: Partial<T>;
	data?: Partial<T>;
	orderBy?: keyof T;
};

export function GenerateQuery<T>(
	type: QueryType,
	table: string,
	prepare: (query: string) => D1PreparedStatement,
	options: GenerateQueryOptions<T> = {}
): D1PreparedStatement {
	if (typeof table !== "string" || !table.length) {
		throw new Error("Invalid table name");
	}
	if (typeof prepare !== "function") {
		throw new Error(
			"Must provide a prepare method which returns a D1PreparedStatement"
		);
	}
	let query = "";
	const bindings: unknown[] = [];
	switch (type) {
		case QueryType.SELECT: {
			query = `SELECT * FROM ${table}`;
			if (options.where) {
				const whereStmt = [];
				for (const [key, value] of Object.entries(options.where)) {
					whereStmt.push(`${key} = ?`);
					bindings.push(value);
				}
				query += ` WHERE ${whereStmt.join(" AND ")}`;
			}
			if (options.orderBy) {
				query += ` ORDER BY "${String(options.orderBy)}"`;
			}
			if (options.limit) {
				query += ` LIMIT ${options.limit}`;
				if (options.offset) {
					query += ` OFFSET ${options.offset}`;
				}
			}
			break;
		}
		case QueryType.DELETE: {
			query = `DELETE FROM ${table}`;
			if (options.where) {
				const whereStmt = [];
				for (const [key, value] of Object.entries(options.where)) {
					whereStmt.push(`${key} = ?`);
					bindings.push(value);
				}
				query += ` WHERE ${whereStmt.join(" AND ")}`;
			}
			if (options.orderBy) {
				query += ` ORDER BY "${String(options.orderBy)}"`;
			}
			if (options.limit) {
				query += ` LIMIT ${options.limit}`;
				if (options.offset) {
					query += ` OFFSET ${options.offset}`;
				}
			}
			break;
		}
		case QueryType.INSERT: {
			query = `INSERT INTO ${table}`;
			if (typeof options.data !== "object") {
				throw new Error("Must provide data to insert");
			}
			const keys = [];
			for (const [key, value] of Object.entries(options.data)) {
				keys.push(key);
				bindings.push(value);
			}
			query += ` (${keys.join(", ")}) VALUES (${"?"
				.repeat(keys.length)
				.split("")
				.join(", ")})`;
			break;
		}
		case QueryType.UPDATE: {
			query = `UPDATE ${table}`;
			if (typeof options.data !== "object") {
				throw new Error("Must provide data to update");
			}
			const keys = [];
			for (const [key, value] of Object.entries(options.data)) {
				keys.push(`${key} = ?`);
				bindings.push(value);
			}
			query += ` SET ${keys.join(", ")}`;
			if (options.where) {
				const whereStmt = [];
				for (const [key, value] of Object.entries(options.where)) {
					whereStmt.push(`${key} = ?`);
					bindings.push(value);
				}
				query += ` WHERE ${whereStmt.join(" AND ")}`;
			}
			break;
		}
		default:
			throw new Error("Invalid QueryType provided");
	}
	const prepared = prepare(query);
	if (!prepared?.bind || typeof prepared.bind !== "function") {
		throw new Error(
			"Must provide a prepare method which returns a D1PreparedStatement"
		);
	}
	return prepared.bind(...bindings);
}
