import { D1Orm, isDatabase } from "./database.js";
import { QueryType, GenerateQuery } from "./queryBuilder.js";
import type { GenerateQueryOptions } from "./queryBuilder.js";

/**
 * @typeParam T - The type of the model, which will be returned when using methods such as First() or All()
 */
export class Model<T extends Record<string, ModelColumn>> {
	/**
	 * @param options - The options for the model. All parameters except autoIncrement and uniqueKeys are required.
	 * @param options.tableName - The name of the table to use.
	 * @param options.D1Orm - The D1Orm instance to use.
	 * @param options.primaryKeys - The primary key or keys of the table.
	 * @param options.autoIncrement - The column to use for auto incrementing. If specified, only one primary key is allowed, and must be of type INTEGER.
	 * @param options.uniqueKeys - The unique keys of the table. For example `[ ['id'], ['username', 'discriminator'] ]` would cause ID to be unique, as well as the combination of username and discriminator.
	 * @param columns - The columns for the model. The keys are the column names, and the values are the column options. See {@link ModelColumn}
	 */
	constructor(
		options: {
			D1Orm: D1Orm;
			tableName: string;
			primaryKeys: Extract<keyof T, string> | Extract<keyof T, string>[];
			autoIncrement?: Extract<keyof T, string>;
			uniqueKeys: Extract<keyof T, string>[][];
		},
		columns: T
	) {
		this.#D1Orm = options.D1Orm;
		this.tableName = options.tableName;
		this.columns = columns;
		this.primaryKeys = Array.isArray(options.primaryKeys)
			? options.primaryKeys
			: [options.primaryKeys].filter(Boolean);
		this.#autoIncrementColumn = options.autoIncrement;
		this.uniqueKeys = options.uniqueKeys || [];

		if (!(this.#D1Orm instanceof D1Orm) || !isDatabase(this.#D1Orm)) {
			throw new Error("Options.D1Orm is not an instance of D1Orm");
		}
		if (typeof this.tableName !== "string" || !this.tableName.length) {
			throw new Error("Options.tableName must be a string");
		}
		if (
			!this.primaryKeys.length ||
			this.primaryKeys.find((x) => typeof x !== "string" || !x.length)
		) {
			throw new Error(
				"Options.primaryKeys must be a string or an array of strings"
			);
		}
		if (!columns) {
			throw new Error("Model columns must be defined");
		}
		const columnEntries = Object.entries(columns);
		if (!columnEntries.length) {
			throw new Error("Model columns cannot be empty");
		}
		if (this.primaryKeys.find((x) => !(x in columns))) {
			throw new Error(
				"Options.primaryKeys includes a column that does not exist"
			);
		}
		if (this.#autoIncrementColumn) {
			if (typeof this.#autoIncrementColumn !== "string") {
				throw new Error(
					"Options.autoIncrement was provided, but was not a string"
				);
			}
			if (!this.primaryKeys.includes(this.#autoIncrementColumn)) {
				throw new Error(
					"Options.autoIncrement was provided, but was not a primary key"
				);
			}
			if (this.primaryKeys.length > 1) {
				throw new Error(
					"Options.autoIncrement was provided, but there are multiple primary keys"
				);
			}
			if (!this.columns[this.#autoIncrementColumn]) {
				throw new Error(
					"Options.autoIncrement was provided, but is not a column"
				);
			}
			if (this.columns[this.#autoIncrementColumn].type !== DataTypes.INTEGER) {
				throw new Error(
					"Options.autoIncrement was provided, but is not an integer column"
				);
			}
		}
	}
	public tableName: string;
	public readonly columns: T;
	public readonly primaryKeys: Extract<keyof T, string>[];
	public readonly uniqueKeys: Extract<keyof T, string>[][];
	readonly #D1Orm: D1Orm;
	readonly #autoIncrementColumn?: Extract<keyof T, string>;

	/**
	 * @returns A CreateTable definition for the model, which can be used in a CREATE TABLE statement.
	 */
	get createTableDefinition(): string {
		const columnEntries = Object.entries(this.columns);
		const columnDefinition = columnEntries.map(([columnName, column]) => {
			let definition = `${columnName} ${column.type}`;
			if (columnName === this.#autoIncrementColumn) {
				definition += " PRIMARY KEY AUTOINCREMENT";
			}
			if (column.notNull) {
				definition += " NOT NULL";
			}
			if (column.defaultValue !== undefined) {
				let defaultStr = `${column.defaultValue}`;
				if (typeof column.defaultValue === "string") {
					defaultStr = `"${column.defaultValue}"`;
				}
				definition += ` DEFAULT ${defaultStr}`;
			}
			return definition;
		});
		if (!this.#autoIncrementColumn) {
			columnDefinition.push(`PRIMARY KEY (${this.primaryKeys.join(", ")})`);
		}
		for (const i of this.uniqueKeys) {
			columnDefinition.push(`UNIQUE (${i.join(", ")})`);
		}
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
				.first<InferFromColumns<T>>();
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
			this.primaryKeys
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
	notNull?: boolean;
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
 * Should not be used directly, instead see {@link Infer}
 * @internal
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
 * Should not be used directly, instead see {@link Infer}
 * @internal
 */
export type InferFromColumns<T extends Record<string, ModelColumn>> = {
	[K in keyof T]: T[K]["notNull"] extends true
		? InferFromColumn<T[K]>
		: InferFromColumn<T[K]> | null;
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
