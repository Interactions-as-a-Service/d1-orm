import { expect } from "chai";
import { D1Orm } from "../lib/database.js";
import { Model, DataTypes } from "../lib/model.js";

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
		it("should throw if autoincrement and withRowId are both set", () => {
			expect(
				() =>
					new Model(
						{
							D1Orm: orm,
							tableName: "users",
							primaryKeys: "id",
							autoIncrement: "id",
							withRowId: true,
						},
						{ id: { type: DataTypes.INTEGER } }
					)
			).to.throw(
				Error,
				"Options.autoIncrement and Options.withRowId cannot both be set"
			);
		});
		describe("Primary keys", () => {
			it("should throw an error if no primary keys are provided", () => {
				expect(() => new Model({ D1Orm: orm, tableName: "users" })).to.throw(
					Error,
					"Options.primaryKeys must be a string or an array of strings"
				);
			});
			it("should throw an error if the primary keys are not strings", () => {
				expect(
					() => new Model({ D1Orm: orm, tableName: "users", primaryKeys: [1] })
				).to.throw(
					Error,
					"Options.primaryKeys must be a string or an array of strings"
				);
			});
			it("should throw an error if a primary key is not a column", () => {
				expect(
					() =>
						new Model(
							{ D1Orm: orm, tableName: "users", primaryKeys: ["users"] },
							{ id: { type: DataTypes.INTEGER } }
						)
				).to.throw(
					Error,
					"Options.primaryKeys includes a column that does not exist"
				);
			});
		});
		describe("Auto Increment", () => {
			it("should throw an error if autoIncrement is not a string", () => {
				expect(
					() =>
						new Model(
							{
								D1Orm: orm,
								tableName: "users",
								primaryKeys: "id",
								autoIncrement: 1,
							},
							{ id: { type: DataTypes.INTEGER } }
						)
				).to.throw(
					Error,
					"Options.autoIncrement was provided, but was not a string"
				);
			});
			it("should throw an error if the autoIncrement is not a primary key", () => {
				expect(
					() =>
						new Model(
							{
								D1Orm: orm,
								tableName: "users",
								primaryKeys: "id",
								autoIncrement: "notId",
							},
							{ id: { type: DataTypes.INTEGER } }
						)
				).to.throw(
					Error,
					"Options.autoIncrement was provided, but was not a primary key"
				);
			});
			it("should throw an error if autoIncrement is used with more than one primary key", () => {
				expect(
					() =>
						new Model(
							{
								D1Orm: orm,
								tableName: "users",
								primaryKeys: ["id", "id2"],
								autoIncrement: "id",
							},
							{
								id: { type: DataTypes.INTEGER },
								id2: { type: DataTypes.INTEGER },
							}
						)
				).to.throw(
					Error,
					"Options.autoIncrement was provided, but there are multiple primary keys"
				);
			});
			it("should throw an error if autoIncrement column is not an integer", () => {
				expect(
					() =>
						new Model(
							{
								D1Orm: orm,
								tableName: "users",
								primaryKeys: "id",
								autoIncrement: "id",
							},
							{
								id: {
									type: DataTypes.STRING,
								},
							}
						)
				).to.throw(
					Error,
					"Options.autoIncrement was provided, but is not an integer column"
				);
			});
		});
		it("should accept no ORM being set", () => {
			expect(
				() =>
					new Model(
						{ tableName: "users", primaryKeys: "id" },
						{ id: { type: DataTypes.INTEGER } }
					)
			).to.not.throw();
		});
	});
	describe("SetOrm", () => {
		it("should throw if the ORM is not an instance of D1Orm", () => {
			expect(() =>
				new Model(
					{ tableName: "users", primaryKeys: "id" },
					{ id: { type: DataTypes.INTEGER } }
				).SetOrm({})
			).to.throw(Error, "Options.D1Orm is not an instance of D1Orm");
		});
		it("should accept an instance of D1Orm", () => {
			expect(() =>
				new Model(
					{ tableName: "users", primaryKeys: "id" },
					{ id: { type: DataTypes.INTEGER } }
				).SetOrm(orm)
			).to.not.throw();
		});
		it("should stop the getter from erroring", () => {
			const model = new Model(
				{ tableName: "users", primaryKeys: "id" },
				{ id: { type: DataTypes.INTEGER } }
			);
			expect(() => model.D1Orm).to.throw();
			model.SetOrm(orm);
			expect(() => model.D1Orm).to.not.throw();
		});
	});
});

describe("Model > Create Tables", () => {
	const orm = new D1Orm(fakeD1Database);
	it("should return a create table statement", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test", primaryKeys: "id", autoIncrement: "id" },
			{
				id: { type: DataTypes.INTEGER },
				name: { type: DataTypes.STRING },
			}
		);
		expect(model.createTableDefinition).to.equal(
			"CREATE TABLE `test` (id integer PRIMARY KEY AUTOINCREMENT, name text);"
		);
	});
	it("should return a create table statement with multiple primary keys", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test", primaryKeys: ["id", "name"] },
			{
				id: { type: DataTypes.INTEGER },
				name: { type: DataTypes.STRING },
			}
		);
		expect(model.createTableDefinition).to.equal(
			"CREATE TABLE `test` (id integer, name text, PRIMARY KEY (id, name)) WITHOUT ROWID;"
		);
	});
	it("should support a not null constraint", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test", primaryKeys: "id" },
			{
				id: { type: DataTypes.INTEGER },
				name: { type: DataTypes.STRING, notNull: true },
			}
		);
		expect(model.createTableDefinition).to.equal(
			"CREATE TABLE `test` (id integer, name text NOT NULL, PRIMARY KEY (id)) WITHOUT ROWID;"
		);
	});
	it("should support a valid autoIncrement constraint", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test", primaryKeys: "id", autoIncrement: "id" },
			{
				id: { type: DataTypes.INTEGER },
				name: { type: DataTypes.STRING },
			}
		);
		expect(model.createTableDefinition).to.equal(
			"CREATE TABLE `test` (id integer PRIMARY KEY AUTOINCREMENT, name text);"
		);
	});
	it("should not include WITHOUT ROWID", () => {
		const model = new Model(
			{ D1Orm: orm, tableName: "test", primaryKeys: "id", withRowId: true },
			{
				id: { type: DataTypes.INTEGER },
				is_admin: { type: DataTypes.STRING },
			}
		);
		expect(model.createTableDefinition).to.equal(
			"CREATE TABLE `test` (id integer, is_admin text, PRIMARY KEY (id));"
		);
	});
	describe("Unique Constraints", () => {
		it("should support a unique constraint", () => {
			const model = new Model(
				{
					D1Orm: orm,
					tableName: "test",
					primaryKeys: "id",
					uniqueKeys: [["id"]],
				},
				{
					id: { type: DataTypes.INTEGER, primaryKey: true },
					name: { type: DataTypes.STRING },
				}
			);
			expect(model.createTableDefinition).to.equal(
				"CREATE TABLE `test` (id integer, name text, PRIMARY KEY (id), UNIQUE (id)) WITHOUT ROWID;"
			);
		});
		it("should support multiple unique constraints", () => {
			const model = new Model(
				{
					D1Orm: orm,
					tableName: "test",
					primaryKeys: "id",
					uniqueKeys: [["id"], ["name"]],
				},
				{
					id: { type: DataTypes.INTEGER, primaryKey: true },
					name: { type: DataTypes.STRING },
				}
			);
			expect(model.createTableDefinition).to.equal(
				"CREATE TABLE `test` (id integer, name text, PRIMARY KEY (id), UNIQUE (id), UNIQUE (name)) WITHOUT ROWID;"
			);
		});
		it("should support a unique constraint with multiple columns", () => {
			const model = new Model(
				{
					D1Orm: orm,
					tableName: "test",
					primaryKeys: "id",
					uniqueKeys: [["id", "name"]],
				},
				{
					id: { type: DataTypes.INTEGER, primaryKey: true },
					name: { type: DataTypes.STRING },
				}
			);
			expect(model.createTableDefinition).to.equal(
				"CREATE TABLE `test` (id integer, name text, PRIMARY KEY (id), UNIQUE (id, name)) WITHOUT ROWID;"
			);
		});
	});
	describe("default values", () => {
		it("should support a string", () => {
			const model = new Model(
				{ D1Orm: orm, tableName: "test", primaryKeys: "id" },
				{
					id: { type: DataTypes.INTEGER },
					is_admin: { type: DataTypes.STRING, defaultValue: "test" },
				}
			);
			expect(model.createTableDefinition).to.equal(
				"CREATE TABLE `test` (id integer, is_admin text DEFAULT 'test', PRIMARY KEY (id)) WITHOUT ROWID;"
			);
		});
		it("should support a number", () => {
			const model = new Model(
				{ D1Orm: orm, tableName: "test", primaryKeys: "id" },
				{
					id: { type: DataTypes.INTEGER },
					is_admin: { type: DataTypes.INTEGER, defaultValue: 1 },
				}
			);
			expect(model.createTableDefinition).to.equal(
				"CREATE TABLE `test` (id integer, is_admin integer DEFAULT 1, PRIMARY KEY (id)) WITHOUT ROWID;"
			);
		});
		it("should support a boolean", () => {
			const model = new Model(
				{ D1Orm: orm, tableName: "test", primaryKeys: "id" },
				{
					id: { type: DataTypes.INTEGER },
					is_admin: { type: DataTypes.BOOLEAN, defaultValue: true },
				}
			);
			expect(model.createTableDefinition).to.equal(
				"CREATE TABLE `test` (id integer, is_admin boolean DEFAULT true, PRIMARY KEY (id)) WITHOUT ROWID;"
			);
		});
	});
});
