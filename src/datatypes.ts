/**
 * SQLite specification doesn't provide an explicit boolean data type,
 * so boolean is converted to an integer where: 0=false, 1=true
 *
 * @enum {string} Aliases for DataTypes used in a {@link ModelColumn} definition.
 */
export enum DataTypes {
	INTEGER = "integer",
	INT = "integer",
	BOOLEAN = "boolean",
	TEXT = "text",
	STRING = "text",
	VARCHAR = "text",
	CHAR = "text",
	NUMBER = "real",
	NUMERIC = "real",
	REAL = "real",
	BLOB = "blob",
}
