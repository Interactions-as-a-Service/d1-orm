import { D1Orm } from "./database.js";
import { QueryType, GenerateQuery } from "./queryBuilder.js";
import type { GenerateQueryOptions } from "./queryBuilder.js";

/**
 * @typeParam T - The type of the model, which will be returned when using methods such as First() or All()
 */
export class Model<T extends Record<string, ModelColumn>> {
	/**
	 * @param options - The options for the model. The table name & D1Orm instance are required.
	 * @param options.tableName - The name of the table to use.
	 * @param options.D1Orm - The D1Orm instance to use.
	 * @param columns - The columns for the model. The keys are the column names, and the values are the column options. See {@link ModelColumn}
	 */
	constructor(
		options: {
			D1Orm: D1Orm;
			tableName: string;
		},
		columns: T
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

		let hasAutoIncrement = false;
		for (const [columnName, column] of columnEntries) {
			if (column.autoIncrement) {
				if (column.type !== DataTypes.INTEGER) {
					throw new Error(
						`Column "${columnName}" is autoincrement but is not an integer`
					);
				}
				if (!column.primaryKey) {
					throw new Error(
						`Column "${columnName}" is autoincrement but is not the primary key`
					);
				}
				hasAutoIncrement = true;
			}
		}
		if (hasAutoIncrement && this.#primaryKeys.length > 1) {
			throw new Error(
				"Model cannot have more than 1 primary key if autoIncrement is true"
			);
		}
		if (!this.#primaryKeys.length) {
			throw new Error("Model must have a primary key");
		}
	}
	public tableName: string;
	public readonly columns: T;
	readonly #D1Orm: D1Orm;

	get #primaryKeys(): string[] {
		return Object.keys(this.columns).filter((x) => this.columns[x].primaryKey);
	}

	/**
	 * @returns A CreateTable definition for the model, which can be used in a CREATE TABLE statement.
	 */
	get createTableDefinition(): string {
		const columnEntries = Object.entries(this.columns);
		let hasAutoIncrement = false;
		const columnDefinition = columnEntries.map(([columnName, column]) => {
			let definition = `${columnName} ${column.type}`;
			if (column.autoIncrement) {
				hasAutoIncrement = true;
				definition += " PRIMARY KEY AUTOINCREMENT";
			}
			if (column.notNull) {
				definition += " NOT NULL";
			}
			if (column.unique) {
				definition += " UNIQUE";
			}
			if (column.defaultValue !== undefined) {
				definition += ` DEFAULT "${column.defaultValue}"`;
			}
			return definition;
		});
		if (!hasAutoIncrement)
			columnDefinition.push(`PRIMARY KEY (${this.#primaryKeys.join(", ")})`);
		return `CREATE TABLE \`${this.tableName}\` (${columnDefinition.join(
			", "
		)});`;
	}

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
		let statement = this.createTableDefinition;
		if (strategy === "force") {
			statement = `DROP TABLE IF EXISTS \`${this.tableName}\`\n${statement}`;
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
	public async InsertOne(
		data: Partial<InferFromColumns<T>>,
		orReplace = false
	): Promise<D1Result<InferFromColumns<T>>> {
		const qt = orReplace ? QueryType.INSERT_OR_REPLACE : QueryType.INSERT;
		const statement = GenerateQuery(qt, this.tableName, { data });
		return this.#D1Orm
			.prepare(statement.query)
			.bind(...statement.bindings)
			.run();
	}

	/**
	 * @param data The data to insert into the table, as an array of objects with the column names as keys and the values as values.
	 */
	public async InsertMany(
		data: Partial<InferFromColumns<T>>[],
		orReplace = false
	): Promise<D1Result<InferFromColumns<T>>[]> {
		const qt = orReplace ? QueryType.INSERT_OR_REPLACE : QueryType.INSERT;
		const stmts: D1PreparedStatement[] = [];
		for (const row of data) {
			const stmt = GenerateQuery(qt, this.tableName, {
				data: row,
			});
			stmts.push(this.#D1Orm.prepare(stmt.query).bind(...stmt.bindings));
		}
		return this.#D1Orm.batch(stmts);
	}

	/**
	 * @param options The options for the query, see {@link GenerateQueryOptions}
	 * @returns Returns the first row that matches the where clause, or null if no rows match.
	 */
	public async First(
		options: Pick<GenerateQueryOptions<Partial<InferFromColumns<T>>>, "where">
	): Promise<InferFromColumns<T> | null> {
		const statement = GenerateQuery(
			QueryType.SELECT,
			this.tableName,
			Object.assign(options, { limit: 1 })
		);
		try {
			return await this.#D1Orm
				.prepare(statement.query)
				.bind(...statement.bindings)
				.first();
		} catch (e) {
			if ((e as Error).message === "D1_NORESULTS") {
				return null;
			}
			throw e;
		}
	}

	/**
	 * @param options The options for the query, see {@link GenerateQueryOptions}
	 * @returns Returns all rows that match the where clause.
	 */
	public async All(
		options: Omit<
			GenerateQueryOptions<Partial<InferFromColumns<T>>>,
			"data" | "upsertOnlyUpdateData"
		>
	): Promise<D1Result<InferFromColumns<T>[]>> {
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
		options: Pick<GenerateQueryOptions<Partial<InferFromColumns<T>>>, "where">
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
		options: Pick<
			GenerateQueryOptions<Partial<InferFromColumns<T>>>,
			"where" | "data"
		>
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
			GenerateQueryOptions<Partial<InferFromColumns<T>>>,
			"where" | "data" | "upsertOnlyUpdateData"
		>
	) {
		const statement = GenerateQuery(
			QueryType.UPSERT,
			this.tableName,
			options,
			this.#primaryKeys
		);
		return this.#D1Orm
			.prepare(statement.query)
			.bind(...statement.bindings)
			.run();
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

/**
 * @enum {string} Aliases for DataTypes used in a {@link ModelColumn} definition.
 */
export enum DataTypes {
	INTEGER = "integer",
	INT = "integer",
	TEXT = "text",
	STRING = "text",
	VARCHAR = "text",
	CHAR = "text",
	NUMBER = "real",
	NUMERIC = "real",
	REAL = "real",
	BLOB = "blob",
	BOOLEAN = "boolean",
}

/**
 * This is a helper type that allows you to know the JS type of a {@link ModelColumn} type.
 */
export type InferFromColumn<T extends ModelColumn> =
	T["type"] extends DataTypes.INTEGER
		? number
		: T["type"] extends DataTypes.REAL
		? number
		: T["type"] extends DataTypes.TEXT
		? string
		: T["type"] extends DataTypes.BLOB
		? ArrayBuffer
		: T["type"] extends DataTypes.BOOLEAN
		? 1 | 0
		: never;

/**
 * This is a helper type that allows you to know the JS type of a Record of {@link ModelColumn}s.
 */
export type InferFromColumns<T extends Record<string, ModelColumn>> = {
	[K in keyof T]: InferFromColumn<T[K]>;
};

/**
 * Infer is a utility type that allows you to infer the type of a model from the columns.
 * @example
 * ```ts
 * import { Model, DataTypes } from "d1-orm";
 * import type { Infer } from "d1-orm";
 *
 * const users = new Model(
 * 	{
 * 		tableName: "users",
 * 		D1Orm: MyD1OrmInstance,
 * 	},
 * 	{
 * 		name: {
 * 			type: DataTypes.STRING
 * 		},
 * 		age: {
 * 			type: DataTypes.NUMBER
 * 		},
 * 	}
 * );
 *
 * type User = Infer<typeof users>;
 * //type User = {
 * 	//name: string,
 * 	//age: number
 * //}
 * ```
 */
export type Infer<T extends { columns: Record<string, ModelColumn> }> =
	InferFromColumns<T["columns"]>;
