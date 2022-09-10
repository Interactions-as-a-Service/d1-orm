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
		throw new Error("Must provide a prepare method");
	}
	let query = "";
	const bindings: unknown[] = [];
	switch (type) {
		case QueryType.SELECT: {
			query = `SELECT * FROM ${table}`;
			if (options.limit) {
				query += ` LIMIT ${options.limit}`;
				if (options.offset) {
					query += ` OFFSET ${options.offset}`;
				}
			}
			if (options.orderBy) {
				query += ` ORDER BY ${String(options.orderBy)}`;
			}
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
		case QueryType.DELETE: {
			query = `DELETE FROM ${table}`;
			if (options.limit) {
				query += ` LIMIT ${options.limit}`;
				if (options.offset) {
					query += ` OFFSET ${options.offset}`;
				}
			}
			if (options.orderBy) {
				query += ` ORDER BY ${String(options.orderBy)}`;
			}
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
	return prepare(query).bind(...bindings);
}
