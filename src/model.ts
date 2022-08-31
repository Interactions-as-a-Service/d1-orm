import { D1Orm } from "./database";
import type { DataTypes } from "./datatypes";

export class Model {
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
