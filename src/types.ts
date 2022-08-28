export type D1ClassDefinition = Record<string, D1Column>;

export type D1Column = D1NullableColumn | D1NotNullableColumn;

export type D1BaseColumn = {
	type: D1ColumnType;
	primaryKey?: boolean;
	unique?: boolean;
};

export type D1NullableColumn = D1BaseColumn & {
	default?: D1ColumnTypeDefault | null;
	notNull?: false;
};

export type D1NotNullableColumn = D1BaseColumn & {
	default?: D1ColumnTypeDefault;
	notNull: true;
};

export type D1ColumnType = "string" | "number" | "boolean" | "blob";
export type D1ColumnTypeDefault = string | number | boolean | Uint32Array;
