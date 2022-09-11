/**
 * @enum {string} - The type of the query
 */
export enum QueryType {
	SELECT = "SELECT",
	INSERT = "INSERT",
	UPDATE = "UPDATE",
	DELETE = "DELETE",
}

/**
 * @param _
 * **where** - The where clause for the query. This is an object with the column names as keys and the values as values.
 *
 * **limit** - The limit for the query. This is the maximum number of rows to return.
 *
 * **offset** - The offset for the query. This is the number of rows to skip before returning.
 *
 * **orderBy** - The order by clause for the query. See {@link OrderBy} for more information.
 *
 * @typeParam T - The type of the object to query. This is generally not needed to be specified, but can be useful if you're calling this yourself instead of through a {@link Model}.
 */
export type GenerateQueryOptions<T extends object> = {
	limit?: number;
	offset?: number;
	where?: Partial<T>;
	data?: Partial<T>;
	orderBy?: OrderBy<T> | OrderBy<T>[];
};

/**
 * @typeParam T - The type of the object to query. This is generally not needed to be specified, but can be useful if you're calling this yourself instead of through a {@link Model}.
 * ```ts
 * {
 * 	// Any of these are valid
 * 	orderBy: 'id',
 * 	orderBy: ['id', 'name'],
 * 	orderBy: { column: 'id', descending: true, nullLast: true },
 * 	orderBy: [{ column: 'id', descending: true, nullLast: true }, { column: 'name', descending: false, nullLast: false }],
 * }
 * ```
 */
export type OrderBy<T extends object> =
	| keyof T
	| { column: keyof T; descending: boolean; nullLast?: boolean };

/**
 * ReturnedStatement is the return type of {@link GenerateQuery}
 *
 * The query is the SQL query to be executed, and the bindings are an array of sorted values to be bound to the query.
 */
export type ReturnedStatement = {
	query: string;
	bindings: unknown[];
};

/**
 * @param type - The type of query to generate, see {@link QueryType}
 * @param tableName - The table to query
 * @param options - The options for the query, see {@link GenerateQueryOptions}
 * @typeParam T - The type of the object to query. This is generally not needed to be specified, but can be useful if you're calling this yourself instead of through a {@link Model}.
 * @returns See {@link ReturnedStatement}
 */
export function GenerateQuery<T extends object>(
	type: QueryType,
	tableName: string,
	options: GenerateQueryOptions<T> = {}
): ReturnedStatement {
	if (typeof tableName !== "string" || !tableName.length) {
		throw new Error("Invalid table name");
	}
	let query = "";
	const bindings: unknown[] = [];
	switch (type) {
		case QueryType.SELECT: {
			query = `SELECT * FROM ${tableName}`;
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
			query = `DELETE FROM ${tableName}`;
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
			query = `INSERT INTO ${tableName}`;
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
			query = `UPDATE ${tableName}`;
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
	return {
		query,
		bindings,
	};
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
