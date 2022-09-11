export enum QueryType {
	SELECT = "SELECT",
	INSERT = "INSERT",
	UPDATE = "UPDATE",
	DELETE = "DELETE",
}

export type GenerateQueryOptions<T extends object> = {
	limit?: number;
	offset?: number;
	where?: Partial<T>;
	data?: Partial<T>;
	orderBy?: OrderBy<T> | OrderBy<T>[];
};

export type OrderBy<T extends object> =
	| keyof T
	| { column: keyof T; descending: boolean; nullLast?: boolean };

export function GenerateQuery<T extends object>(
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
				query += " ORDER BY " + transformOrderBy(options.orderBy);
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

function transformOrderBy<T extends object>(
	orderBy: OrderBy<T> | OrderBy<T>[]
): string {
	if (Array.isArray(orderBy)) {
		return orderBy.map((o) => transformOrderBy(o)).join(", ");
	}
	if (
		typeof orderBy === "string" ||
		typeof orderBy === "symbol" ||
		typeof orderBy === "number"
	) {
		return `"${String(orderBy)}"`;
	}
	return (
		`"${String(orderBy.column)}"` +
		(orderBy.descending ? " DESC" : "") +
		(orderBy.nullLast ? " NULLS LAST" : "")
	);
}
