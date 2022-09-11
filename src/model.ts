import { D1Orm } from "./database.js";
import { DataTypes } from "./datatypes.js";
import { QueryType, GenerateQuery } from "./queryBuilder.js";
import type { GenerateQueryOptions } from "./queryBuilder.js";

/**
 * @typeParam T - The type of the model, which will be returned when using methods such as First() or All()
 */
export class Model<T extends object> {
	/**
	 * @param options - The options for the model. The table name & D1Orm instance are required.
	 * @param options.tableName - The name of the table to use.
	 * @param options.D1Orm - The D1Orm instance to use.
	 * @param columns - The columns for the model. The keys are the column names, and the values are the column options. See {@link ModelColumn}
	 * @typeParam T - The type of the model, which will be returned when using methods such as First() or All()
	 */
	constructor(
		options: {
			D1Orm: D1Orm;
			tableName: string;
		},
		columns: Record<string, ModelColumn>
	) {
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
	public readonly columns: Record<string, ModelColumn>;
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
		options: { strategy: "default" | "force" | "alter" } = {
			strategy: "default",
		}
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
		const statement = GenerateQuery(QueryType.INSERT, this.tableName, data);
		return this.#D1Orm
			.prepare(statement.query)
			.bind(...statement.bindings)
			.run();
	}

	/**
	 * @param data The data to insert into the table, as an array of objects with the column names as keys and the values as values.
	 */
	public async InsertMany(data: Partial<T>[]): Promise<D1Result<T>[]> {
		const stmts: D1PreparedStatement[] = [];
		for (const row of data) {
			const stmt = GenerateQuery(QueryType.INSERT, this.tableName, row);
			stmts.push(this.#D1Orm.prepare(stmt.query).bind(...stmt.bindings));
		}
		return this.#D1Orm.batch<T>(stmts);
	}

	/**
	 * @param options The options for the query, see {@link GenerateQueryOptions}
	 * @returns Returns the first row that matches the where clause.
	 */
	public async First(
		options: Pick<GenerateQueryOptions<T>, "where">
	): Promise<D1Result<T>> {
		const statement = GenerateQuery(QueryType.SELECT, this.tableName, options);
		return this.#D1Orm
			.prepare(statement.query)
			.bind(...statement.bindings)
			.first();
	}

	/**
	 * @param options The options for the query, see {@link GenerateQueryOptions}
	 * @returns Returns all rows that match the where clause.
	 */
	public async All(
		options: Omit<GenerateQueryOptions<T>, "data">
	): Promise<D1Result<T[]>> {
		const statement = GenerateQuery(QueryType.SELECT, this.tableName, options);
		return this.#D1Orm
			.prepare(statement.query)
			.bind(...statement.bindings)
			.all();
	}

	/**
	 * @param options The options for the query, see {@link GenerateQueryOptions}
	 */
	public async Delete(
		options: Pick<GenerateQueryOptions<T>, "where">
	): Promise<D1Result<unknown>> {
		const statement = GenerateQuery(QueryType.DELETE, this.tableName, options);
		return this.#D1Orm
			.prepare(statement.query)
			.bind(...statement.bindings)
			.run();
	}

	/**
	 * @param options The options for the query, see {@link GenerateQueryOptions}
	 * @throws Throws an error if the data clause is empty.
	 */
	public async Update(
		options: Pick<GenerateQueryOptions<T>, "where" | "data">
	): Promise<D1Result<unknown>> {
		const statement = GenerateQuery(QueryType.UPDATE, this.tableName, options);
		return this.#D1Orm
			.prepare(statement.query)
			.bind(...statement.bindings)
			.run();
	}

	/**
	 * Upserting is a way to insert a row into the table, or update it if it already exists.
	 * This is done by using SQLITE's ON CONFLICT clause. As a result, this method should control the primary key for the insert & where clauses, and should not be used with auto incrementing keys.
	 * @param options The options for the query, see {@link GenerateQueryOptions}
	 */
	public async Upsert(
		options: Pick<
			GenerateQueryOptions<T>,
			"where" | "data" | "upsertOnlyUpdateData"
		>
	) {
		const statement = GenerateQuery(QueryType.UPSERT, this.tableName, options);
		return this.#D1Orm
			.prepare(statement.query)
			.bind(...statement.bindings)
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
}

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
