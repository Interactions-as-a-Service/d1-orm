import type { ModelColumns } from "./model";

/**
 * @enum {string} - The type of the query
 */
export enum QueryType {
	SELECT = "SELECT",
	INSERT = "INSERT",
	INSERT_OR_REPLACE = "INSERT or REPLACE",
	UPDATE = "UPDATE",
	DELETE = "DELETE",
	UPSERT = "UPSERT",
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
 * **data** - The data to insert, or update with. This is an object with the column names as keys and the values as values. In the case of Upsert, `upsertOnlyUpdateData` is also required, and that will be the data to update with, if an `ON CONFLICT` clause is matched.
 *
 * **upsertOnlyUpdateData** - The data to update with, if an `ON CONFLICT` clause is matched. This is an object with the column names as keys and the values as values.
 * @typeParam T - The type of the object to query. This is generally not needed to be specified, but can be useful if you're calling this yourself instead of through a {@link Model}.
 */
export type GenerateQueryOptions<T extends object> = {
	where?: Partial<T>;
	limit?: number;
	offset?: number;
	orderBy?: OrderBy<T> | OrderBy<T>[];
	data?: Partial<T>;
	upsertOnlyUpdateData?: Partial<T>;
	columns?: ModelColumns;
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
 * @param type - The type of query to generate, see {@link QueryType}
 * @param tableName - The table to query
 * @param options - The options for the query, see {@link GenerateQueryOptions}
 * @typeParam T - The type of the object to query. This is generally not needed to be specified, but can be useful if you're calling this yourself instead of through a {@link Model}.
 * @returns The query and bindings to be executed
 */
export function GenerateQuery<T extends object>(
	type: QueryType,
	tableName: string,
	options: GenerateQueryOptions<T> = {},
	primaryKeys: string | string[] = "id"
): { bindings: unknown[]; query: string } {
	if (typeof tableName !== "string" || !tableName.length) {
		throw new Error("Invalid table name");
	}
	let query = "";
	const bindings: unknown[] = [];
	switch (type) {
		case QueryType.SELECT: {
			query = `SELECT * FROM \`${tableName}\``;
			if (options.where) {
				const whereStmt = [];
				for (const [key, value] of Object.entries(options.where)) {
					whereStmt.push(`${key} = ?`);
					bindings.push(value);
				}
				if (whereStmt.length) query += ` WHERE ${whereStmt.join(" AND ")}`;
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
			query = `DELETE FROM \`${tableName}\``;
			if (options.where) {
				const whereStmt = [];
				for (const [key, value] of Object.entries(options.where)) {
					whereStmt.push(`${key} = ?`);
					bindings.push(value);
				}
				if (whereStmt.length) query += ` WHERE ${whereStmt.join(" AND ")}`;
			}
			break;
		}
		case QueryType.INSERT_OR_REPLACE:
		case QueryType.INSERT: {
			query = `${type} INTO \`${tableName}\``;
			if (
				typeof options.data !== "object" ||
				Object.getOwnPropertyNames(options.data).length === 0
			) {
				throw new Error("Must provide data to insert");
			}
			const keys = [];
			const values = [];
			for (const [key, value] of Object.entries(options.data)) {
				const column = options.columns?.[key];
				keys.push(key);
				if (column?.json) {
					bindings.push(JSON.stringify(value));
					values.push(`json(?)`);
				} else {
					bindings.push(value);
					values.push("?");
				}
			}
			query += ` (${keys.join(", ")}) VALUES (${values.join(", ")})`;
			break;
		}
		case QueryType.UPDATE: {
			query = `UPDATE \`${tableName}\``;
			if (
				typeof options.data !== "object" ||
				Object.getOwnPropertyNames(options.data).length === 0
			) {
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
				if (whereStmt.length) query += ` WHERE ${whereStmt.join(" AND ")}`;
			}
			break;
		}
		case QueryType.UPSERT: {
			const insertDataKeys = Object.keys(options.data ?? {});
			const updateDataKeys = Object.keys(options.upsertOnlyUpdateData ?? {});
			const whereKeys = Object.keys(options.where ?? {});
			bindings.push(
				...Object.values(options.data ?? {}),
				...Object.values(options.upsertOnlyUpdateData ?? {}),
				...Object.values(options.where ?? {})
			);

			if (
				insertDataKeys.length === 0 ||
				updateDataKeys.length === 0 ||
				whereKeys.length === 0
			) {
				throw new Error(
					"Must provide data to insert with, data to update with, and where keys in Upsert"
				);
			}
			query = `INSERT INTO \`${tableName}\` (${insertDataKeys.join(", ")})`;
			query += ` VALUES (${"?"
				.repeat(insertDataKeys.length)
				.split("")
				.join(", ")})`;

			const primaryKeyStr = Array.isArray(primaryKeys)
				? primaryKeys.join(", ")
				: primaryKeys;
			query += ` ON CONFLICT (${primaryKeyStr}) DO UPDATE SET`;
			query += ` ${updateDataKeys.map((key) => `${key} = ?`).join(", ")}`;
			query += ` WHERE ${whereKeys.map((key) => `${key} = ?`).join(" AND ")}`;
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

/**
 * @private
 * @hidden
 */
export function transformOrderBy<T extends object>(
	orderBy: OrderBy<T> | OrderBy<T>[]
): string {
	if (Array.isArray(orderBy)) {
		return orderBy.map(transformOrderBy).join(", ");
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
