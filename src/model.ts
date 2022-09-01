import { D1Orm } from "./database";
import { DataTypes } from "./datatypes";

export class Model<T> {
	constructor(options: ModelOptions, columns: ModelColumns) {
		this.#D1Orm = options.D1Orm;
		this.tableName = options.tableName;
		this.columns = columns;

		if (!(this.#D1Orm instanceof D1Orm)) {
			throw new Error("Options.D1Orm is not an instance of D1Orm");
		}
		if (!this.tableName?.length) {
			throw new Error("Options.tableName is not defined");
		}
		const columnEntries = Object.entries(this.columns);
		if (!columnEntries.length) {
			throw new Error("Model columns cannot be empty");
		}

		for (const [columnName, column] of columnEntries) {
			if (column.autoIncrement && column.type !== DataTypes.INTEGER) {
				throw new Error(
					`Column ${columnName} is autoincrement but is not an integer`
				);
			}
		}

		// This is done so the getter checks if the model has a primary key, and throws an error if not
		this.#primaryKey;
	}
	public tableName: string;
	public readonly columns: ModelColumns;
	readonly #D1Orm: D1Orm;

	public async CreateTable(
		{ strategy }: CreateTableOptions = { strategy: "default" }
	): Promise<D1Result<unknown>> {
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

	public async DropTable(silent?: boolean): Promise<D1Result<unknown>> {
		if (silent) {
			return this.#D1Orm.exec(`DROP TABLE IF EXISTS ${this.tableName};`);
		}
		return this.#D1Orm.exec(`DROP TABLE ${this.tableName};`);
	}

	public async InsertOne(data: Partial<T>): Promise<D1Result<T>> {
		return this.#createInsertStatement(data).first<D1Result<T>>();
	}

	public async InsertMany(data: Partial<T>[]): Promise<D1Result<T>[]> {
		const stmts: D1PreparedStatement[] = [];
		for (const row of data) {
			stmts.push(this.#createInsertStatement(row));
		}
		return this.#D1Orm.batch<T>(stmts);
	}

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
			throw new Error(`Model should have 1 primary key, got: ${keys.length}`);
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
			throw new Error("InsertOne called with no columns");
		}
		return this.#statementAddBindings(
			`INSERT INTO ${this.tableName} (${columnNames.join(
				", "
			)}) VALUES (${"?, ".repeat(columnSize - 1)}?) RETURNING *;`,
			dataRecord
		);
	}
}

export type ModelColumns = Record<string, ModelColumn>;

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

export type CreateTableOptions = {
	strategy: "default" | "force" | "alter";
};

export type WhereOptions<T> = Partial<T>;
