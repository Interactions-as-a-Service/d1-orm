import { D1Orm } from "./database.js";
import { DataTypes } from "./datatypes.js";

/**
 * @typeParam T - The type of the model, which will be returned when using methods such as First() or All()
 */
export class Model<T> {
	/**
	 * @param options - The options for the model. The table name & D1Orm instance are required.
	 * @param columns - The columns for the model. The keys are the column names, and the values are the column options. See {@link ModelColumn}
	 * @typeParam T - The type of the model, which will be returned when using methods such as First() or All()
	 */
	constructor(options: ModelOptions, columns: ModelColumns) {
		this.#D1Orm = options.D1Orm;
		this.tableName = options.tableName;
		this.columns = columns;

		if (!(this.#D1Orm instanceof D1Orm)) {
			throw new Error("Options.D1Orm is not an instance of D1Orm");
		}
		if (typeof this.tableName !== "string" || !this.tableName.length) {
			throw new Error("Options.tableName must be a string");
		}
		if (!columns) {
			throw new Error("Model columns must be defined");
		}
		const columnEntries = Object.entries(this.columns);
		if (!columnEntries.length) {
			throw new Error("Model columns cannot be empty");
		}

		for (const [columnName, column] of columnEntries) {
			if (column.autoIncrement && column.type !== DataTypes.INTEGER) {
				throw new Error(
					`Column "${columnName}" is autoincrement but is not an integer`
				);
			}
		}

		// This is done so the getter checks if the model has a primary key, and throws an error if not
		this.#primaryKey;
	}
	public tableName: string;
	public readonly columns: ModelColumns;
	readonly #D1Orm: D1Orm;

	/**
	 * @param options The options for creating the table. Currently only contains strategy, which is the strategy to use when creating the table.
	 * - "default" - The default strategy, which will attempt create the table.
	 * - "force" - Drops the table if it exists, then creates it
	 * - "alter" - [NOT YET IMPLEMENTED] Attempts to alter the table to match the model
	 * @throws
	 * - Throws an error if the table already exists and the strategy is not "force".
	 * - Throws an error if the strategy is "alter", as this is not yet implemented
	 */
	public async CreateTable(
		options: CreateTableOptions = { strategy: "default" }
	): Promise<D1Result<unknown>> {
		const { strategy } = options;
		if (strategy === "alter") {
			throw new Error("Alter strategy is not implemented");
		}
		const columnEntries = Object.entries(this.columns);
		const columnDefinitions = columnEntries
			.map(([columnName, column]) => {
				let definition = `${columnName} ${column.type}`;
				if (column.primaryKey) {
					definition += " PRIMARY KEY";
				}
				if (column.autoIncrement) {
					definition += " AUTOINCREMENT";
				}
				if (column.notNull) {
					definition += " NOT NULL";
				}
				if (column.unique) {
					definition += " UNIQUE";
				}
				if (column.defaultValue) {
					definition += ` DEFAULT "${column.defaultValue}"`;
				}
				return definition;
			})
			.join(", ");
		let statement = `CREATE TABLE ${this.tableName} (${columnDefinitions});`;
		if (strategy === "force") {
			statement = `DROP TABLE IF EXISTS ${this.tableName}\n${statement}`;
		}
		return this.#D1Orm.exec(statement);
	}

	/**
	 * @param silent If true, will ignore the table not existing. If false, will throw an error if the table does not exist.
	 */
	public async DropTable(silent?: boolean): Promise<D1Result<unknown>> {
		if (silent) {
			return this.#D1Orm.exec(`DROP TABLE IF EXISTS ${this.tableName};`);
		}
		return this.#D1Orm.exec(`DROP TABLE ${this.tableName};`);
	}

	/**
	 * @param data The data to insert into the table, as an object with the column names as keys and the values as values.
	 */
	public async InsertOne(data: Partial<T>): Promise<D1Result<T>> {
		return this.#createInsertStatement(data).first<D1Result<T>>();
	}

	/**
	 * @param data The data to insert into the table, as an array of objects with the column names as keys and the values as values.
	 */
	public async InsertMany(data: Partial<T>[]): Promise<D1Result<T>[]> {
		const stmts: D1PreparedStatement[] = [];
		for (const row of data) {
			stmts.push(this.#createInsertStatement(row));
		}
		return this.#D1Orm.batch<T>(stmts);
	}

	/**
	 * @param options The options for the query
	 * @param options.where - The where clause for the query. This is an object with the column names as keys and the values as values.
	 * @returns Returns the first row that matches the where clause.
	 */
	public async First(options: {
		where: WhereOptions<T>;
	}): Promise<D1Result<T>> {
		const { where } = options;
		const objectKeys = Object.keys(where as Record<string, unknown>);
		if (objectKeys.length === 0) {
			return this.#D1Orm
				.prepare(`SELECT * FROM ${this.tableName} LIMIT 1;`)
				.first<D1Result<T>>();
		}
		const stmt = this.#statementAddBindings(
			`SELECT * FROM ${this.tableName} WHERE ` +
				objectKeys.map((key) => `${key} = ?`).join(" AND ") +
				" LIMIT 1;",
			where
		);
		return stmt.first<D1Result<T>>();
	}

	/**
	 * @param options The options for the query
	 * @param options.where - The where clause for the query. This is an object with the column names as keys and the values as values.
	 * @param options.limit - The limit for the query. This is the maximum number of rows to return.
	 * @returns Returns all rows that match the where clause.
	 */
	public async All(options: {
		where: WhereOptions<T>;
		limit?: number;
	}): Promise<D1Result<T[]>> {
		const { where, limit } = options;
		const objectKeys = Object.keys(where as Record<string, unknown>);
		if (objectKeys.length === 0) {
			return this.#D1Orm
				.prepare(
					`SELECT * FROM ${this.tableName}${limit ? ` LIMIT ${limit}` : ""};`
				)
				.all<T>();
		}
		const stmt = this.#statementAddBindings(
			`SELECT * FROM ${this.tableName} WHERE` +
				objectKeys.map((key) => `${key} = ?`).join(" AND ") +
				(limit ? ` LIMIT ${limit}` : ""),
			where
		);
		return stmt.all<T>();
	}

	/**
	 * @param options The options for the query
	 * @param options.where - The where clause for the query. This is an object with the column names as keys and the values as values.
	 * @param options.limit - The limit for the query. This is the maximum number of rows to delete.
	 */
	public async Delete(options: {
		where: WhereOptions<T>;
		limit?: number;
	}): Promise<D1Result<unknown>> {
		const { where, limit } = options;
		const objectKeys = Object.keys(where as Record<string, unknown>);
		if (objectKeys.length === 0) {
			return this.#D1Orm
				.prepare(
					`DELETE FROM ${this.tableName}${limit ? `LIMIT ${limit}` : ""};`
				)
				.run();
		}
		const stmt = this.#statementAddBindings(
			`DELETE FROM ${this.tableName} WHERE ` +
				objectKeys.map((key) => `${key} = ?`).join(" AND ") +
				(limit ? ` LIMIT ${limit}` : ""),
			where
		);
		return stmt.run();
	}

	/**
	 * @param options The options for the query
	 * @param options.where - The where clause for the query. This is an object with the column names as keys and the values as values.
	 * @param options.limit - The limit for the query. This is the maximum number of rows to update.
	 * @param options.data - The data to update the rows with. This is an object with the column names as keys and the values as values.
	 * @throws
	 * - Throws an error if the data clause is empty.
	 */
	public async Update(options: {
		where: WhereOptions<T>;
		data: Partial<T>;
		limit?: number;
	}): Promise<D1Result<unknown>> {
		const { where, data } = options;
		const dataKeys = Object.keys(data as Record<string, unknown>);
		const whereKeys = Object.keys(where as Record<string, unknown>);
		if (dataKeys.length === 0) {
			throw new Error("Update called with no data");
		}
		if (whereKeys.length === 0) {
			return this.#D1Orm
				.prepare(
					`UPDATE ${this.tableName} SET ${Object.keys(data)
						.map((key) => `${key} = ?`)
						.join(", ")}`
				)
				.bind(...Object.values(data))
				.run();
		}
		const stmtArray = [...Object.values(data), ...Object.values(where)];
		const params: Record<number, unknown> = {};
		for (let i = 0; i < stmtArray.length; i++) {
			params[i] = stmtArray[i];
		}
		const stmt = this.#statementAddBindings(
			`UPDATE ${this.tableName} SET ${Object.keys(data)
				.map((key) => `${key} = ?`)
				.join(", ")} WHERE ` +
				whereKeys.map((key) => `${key} = ?`).join(" AND "),
			params
		);
		return stmt.run();
	}

	/**
	 * Upserting is a way to insert a row into the table, or update it if it already exists.
	 * This is done by using SQLITE's ON CONFLICT clause. As a result, this method should control the primary key for the insert & where clauses, and should not be used with auto incrementing keys.
	 * @param options The options for the query
	 * @param options.where - The where clause for the query. This is an object with the column names as keys and the values as values.
	 * @param options.limit - The limit for the query. This is the maximum number of rows to update.
	 * @param options.updateData - The data to update the rows with if an `ON CONFLICT` clause occurs. This is an object with the column names as keys and the values as values.
	 * @param options.insertData - The data to insert. This is an object with the column names as keys and the values as values.
	 * @throws
	 * - Throws an error if the data clause is empty.
	 */
	public async Upsert(options: {
		where: WhereOptions<T>;
		updateData: Partial<T>;
		insertData: Partial<T>;
	}) {
		const { where, updateData, insertData } = options;
		const insertDataKeys = Object.keys(insertData as Record<string, unknown>);
		const updateDataKeys = Object.keys(updateData as Record<string, unknown>);
		const whereKeys = Object.keys(where as Record<string, unknown>);

		if (insertDataKeys.length === 0 || updateDataKeys.length === 0) {
			throw new Error("Upsert called with no data");
		}

		const bindings = [
			...Object.values(insertData),
			...Object.values(updateData),
			...Object.values(where),
		];
		const stmt = `INSERT INTO ${this.tableName} (${insertDataKeys.join(
			", "
		)}) VALUES (${insertDataKeys.map(() => "?").join(", ")})
		ON CONFLICT (${this.#primaryKey}) DO UPDATE SET ${updateDataKeys
			.map((key) => `${key} = ?`)
			.join(", ")}
			${
				whereKeys.length
					? `WHERE ${whereKeys.map((x) => `${x} = ?`).join(" AND ")}`
					: ""
			};`;
		return this.#D1Orm
			.prepare(stmt)
			.bind(...bindings)
			.run();
	}

	get #primaryKey(): string {
		const keys = Object.keys(this.columns).filter(
			(key) => this.columns[key].primaryKey
		);
		if (keys.length !== 1) {
			throw new Error(`Model must have 1 primary key, got: ${keys.length}`);
		}
		return keys[0];
	}

	#statementAddBindings(
		query: string,
		data: Record<string, unknown>
	): D1PreparedStatement {
		const statement = this.#D1Orm.prepare(query).bind(...Object.values(data));
		return statement;
	}

	#createInsertStatement(data: Partial<T>): D1PreparedStatement {
		const dataRecord = data as Record<string, unknown>;
		const columnNames = Object.keys(dataRecord);
		const columnSize = columnNames.length;
		if (columnSize === 0) {
			throw new Error("Insert called with no columns");
		}
		return this.#statementAddBindings(
			`INSERT INTO ${this.tableName} (${columnNames.join(
				", "
			)}) VALUES (${"?, ".repeat(columnSize - 1)}?) RETURNING *;`,
			dataRecord
		);
	}
}

/**
 * An object where the keys are the column names, and the values are a {@link ModelColumn}
 */
export type ModelColumns = Record<string, ModelColumn>;

/**
 * The definition of a column in a model.
 * If the `defaultValue` is provided, it should be of the type defined by your `type`. Blobs should be provided as a [Uint32Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array).
 */
export type ModelColumn = {
	type: DataTypes;
	primaryKey?: boolean;
	notNull?: boolean;
	unique?: boolean;
	autoIncrement?: boolean;
	defaultValue?: unknown;
};

export type ModelOptions = {
	D1Orm: D1Orm;
	tableName: string;
};

/**
 * The options for the {@link Model.CreateTable} method.
 *
 * Note: Using `alter` is not yet supported. You should perform these migrations manually.
 */
export type CreateTableOptions = {
	strategy: "default" | "force" | "alter";
};

/**
 * The options for the {@link Model.First} method, amongst other {@link Model} methods.
 *
 * May be expanded in future to support more advanced querying, such as OR, NOT, IN operators, etc.
 * @typeParam T - The type of the model. It will be inferred from the model class, and should not need to be provided by you.
 */
export type WhereOptions<T> = Partial<T>;
