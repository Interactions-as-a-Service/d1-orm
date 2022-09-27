import { expect } from "chai";
import { D1Orm } from "../lib/database.js";
import { DataTypes } from "../lib/datatypes.js";
import { Model } from "../lib/model.js";

const fakeD1Database = {
	prepare: () => {},
	dump: () => {},
	batch: () => {},
	exec: () => {},
};

describe("Model Validation", () => {
	const orm = new D1Orm(fakeD1Database);
	describe("it should throw if the model has invalid options", () => {
		it("should throw if an invalid D1Orm is provided", () => {
			expect(() => new Model({ D1Orm: {} })).to.throw(
				Error,
				"Options.D1Orm is not an instance of D1Orm"
			);
		});
		it("should throw if an invalid tableName is provided", () => {
			expect(() => new Model({ D1Orm: orm, tableName: 1 })).to.throw(
				Error,
				"Options.tableName must be a string"
			);
		});
		it("should throw an error if no columns are provided", () => {
			expect(() => new Model({ D1Orm: orm, tableName: "test" })).to.throw(
				Error,
				"Model columns must be defined"
			);
		});
		it("should throw an error if columns are an empty object", () => {
			expect(() => new Model({ D1Orm: orm, tableName: "test" }, {})).to.throw(
				Error,
				"Model columns cannot be empty"
			);
		});
		it("should throw an error if an autoincrement column is not an integer type", () => {
			expect(
				() =>
					new Model(
						{ D1Orm: orm, tableName: "test" },
						{
							id: { type: DataTypes.STRING, autoIncrement: true },
						}
					)
			).to.throw(Error, `Column "id" is autoincrement but is not an integer`);
		});
		it("should throw an error if there is no primary key", () => {
			expect(
				() =>
					new Model(
						{ D1Orm: orm, tableName: "test" },
						{
							id: { type: DataTypes.INTEGER },
						}
					)
			).to.throw(Error, "Model must have a primary key");
		});
		it("should not throw an error if there is more than 1 primary key", () => {
			expect(
				() =>
					new Model(
						{ D1Orm: orm, tableName: "test" },
						{
							id: { type: DataTypes.INTEGER, primaryKey: true },
							id2: { type: DataTypes.INTEGER, primaryKey: true },
						}
					)
			).to.not.throw();
		});
		it("should throw an error if 2 primary keys and autoincrement is true", () => {
			expect(
				() =>
					new Model(
						{ D1Orm: orm, tableName: "test" },
						{
							id: { type: DataTypes.INTEGER, primaryKey: true },
							id2: {
								type: DataTypes.INTEGER,
								primaryKey: true,
								autoIncrement: true,
							},
						}
					)
			).to.throw(
				Error,
				"Model cannot have more than 1 primary key if autoIncrement is true"
			);
		});
	});
});

describe("Model > Create Tables", () => {
	const orm = new D1Orm(fakeD1Database);
	it("should return a create table statement", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test" },
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				name: { type: DataTypes.STRING },
			}
		);
		expect(model.createTableDefinition).to.equal(
			"CREATE TABLE `test` (id integer PRIMARY KEY AUTOINCREMENT, name text);"
		);
	});
	it("should return a create table statement with multiple primary keys", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test" },
			{
				id: { type: DataTypes.INTEGER, primaryKey: true },
				name: { type: DataTypes.STRING, primaryKey: true },
			}
		);
		expect(model.createTableDefinition).to.equal(
			"CREATE TABLE `test` (id integer, name text, PRIMARY KEY (id, name));"
		);
	});
	it("should support a not null constraint", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test" },
			{
				id: { type: DataTypes.INTEGER, primaryKey: true },
				name: { type: DataTypes.STRING, notNull: true },
			}
		);
		expect(model.createTableDefinition).to.equal(
			"CREATE TABLE `test` (id integer, name text NOT NULL, PRIMARY KEY (id));"
		);
	});
	it("should support a unique constraint", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test" },
			{
				id: { type: DataTypes.INTEGER, primaryKey: true },
				name: { type: DataTypes.STRING, unique: true },
			}
		);
		expect(model.createTableDefinition).to.equal(
			"CREATE TABLE `test` (id integer, name text UNIQUE, PRIMARY KEY (id));"
		);
	});
	it("should support a default value", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test" },
			{
				id: { type: DataTypes.INTEGER, primaryKey: true },
				name: { type: DataTypes.STRING, defaultValue: "test" },
			}
		);
		expect(model.createTableDefinition).to.equal(
			'CREATE TABLE `test` (id integer, name text DEFAULT "test", PRIMARY KEY (id));'
		);
	});
});
