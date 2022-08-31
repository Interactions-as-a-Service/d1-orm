import { D1Orm } from "./database";
import { DataTypes } from "./datatypes";

export class Model<T> {
	constructor(options: ModelOptions, columns: ModelColumns) {
		this.D1Orm = options.D1Orm;
		this.tableName = options.tableName;
		this.columns = columns;

		if (!(this.D1Orm instanceof D1Orm)) {
			throw new Error("Options.D1Orm is not an instance of D1Orm");
		}
		if (!this.tableName?.length) {
			throw new Error("Options.tableName is not defined");
		}
		const columnEntries = Object.entries(this.columns);
		if (!columnEntries.length) {
			throw new Error("Model columns cannot be empty");
		}
		let primaryKey: string | undefined;
		for (const [columnName, column] of columnEntries) {
			if (!column.type) {
				throw new Error(`Column ${columnName} has no type`);
			}
			if (column.primaryKey) {
				if (primaryKey) {
					throw new Error(`Model has multiple primary keys`);
				}
				primaryKey = columnName;
			}
			if (column.autoIncrement && column.type !== DataTypes.INTEGER) {
				throw new Error(
					`Column ${columnName} is autoincrement but is not an integer`
				);
			}
		}
	}
	public tableName: string;
	public readonly columns: ModelColumns;
	private readonly D1Orm: D1Orm;

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
		const statement = `CREATE TABLE ${this.tableName} (${columnDefinitions});`;
		if (strategy === "force") {
			await this.DropTable(true);
		}
		return this.D1Orm.exec(statement);
	}

	public async DropTable(silent?: boolean): Promise<D1Result<unknown>> {
		if (silent) {
			return this.D1Orm.exec(`DROP TABLE IF EXISTS ${this.tableName};`);
		}
		return this.D1Orm.exec(`DROP TABLE ${this.tableName};`);
	}

	private createStatement(data: Partial<T>): D1PreparedStatement {
		const dataRecord = data as Record<string, unknown>;
		const columnNames = Object.keys(dataRecord);
		const columnSize = columnNames.length;
		if (columnSize === 0) {
			throw new Error("InsertOne called with no columns");
		}
		let stmt = this.D1Orm.prepare(
			`INSERT INTO ${this.tableName} (${columnNames.join(
				", "
			)}) VALUES (${"?, ".repeat(columnSize - 1)}?) RETURNING *;`
		);
		for (const column of columnNames) {
			stmt = stmt.bind(dataRecord[column]);
		}
		return stmt;
	}

	public async InsertOne(data: Partial<T>): Promise<D1Result<T>> {
		return this.createStatement(data).first<D1Result<T>>();
	}

	public async InsertMany(data: Partial<T>[]): Promise<D1Result<T>[]> {
		const stmts: D1PreparedStatement[] = [];
		for (const row of data) {
			stmts.push(this.createStatement(row));
		}
		return this.D1Orm.batch<T>(stmts);
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
