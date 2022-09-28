import { expect } from "chai";
import { D1Orm } from "../lib/database.js";
import { DataTypes } from "../lib/datatypes.js";
import { Model } from "../lib/model.js";
import {
	GenerateQuery,
	QueryType,
	transformOrderBy,
} from "../lib/queryBuilder.js";


const fakeD1Database = {
	prepare: () => {},
	dump: () => {},
	batch: () => {},
	exec: () => {},
};
const model = new Model(
	{ D1Orm: new D1Orm(fakeD1Database), tableName: "test" },
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		name: { type: DataTypes.STRING },
		flag: { type: DataTypes.BOOLEAN },
	}
);

describe("Query Builder", () => {
	describe("Validation of options", () => {
		it("should throw an error if tableName is not a string", () => {
			expect(() => GenerateQuery()).to.throw(Error, "Invalid table name");
			expect(() => GenerateQuery(null, 1)).to.throw(
				Error,
				"Invalid table name"
			);
		});
		it("should throw an error if query type is invalid", () => {
			expect(() => GenerateQuery("INVALID", "test", model, () => {})).to.throw(
				Error,
				"Invalid QueryType provided"
			);
		});
		it("should not throw an error for a valid query", () => {
			expect(() =>
				GenerateQuery(QueryType.SELECT, "test", () => ({ bind: () => {} }))
			).to.not.throw();
		});
	});
	describe("Query Generation", () => {
		describe(QueryType.SELECT, () => {
			it("should generate a basic query", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model);
				expect(statement.query).to.equal("SELECT * FROM `test`");
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a where clause", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model, {
					where: { id: 1 },
				});
				expect(statement.query).to.equal("SELECT * FROM `test` WHERE id = ?");
				expect(statement.bindings.length).to.equal(1);
				expect(statement.bindings[0]).to.equal(1);
			});
			it("should generate a query with a where clause with multiple conditions", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model, {
					where: { id: 1, name: "test" },
				});
				expect(statement.query).to.equal(
					"SELECT * FROM `test` WHERE id = ? AND name = ?"
				);
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
			});
			it("should generate a query with a limit", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model, {
					limit: 10,
				});
				expect(statement.query).to.equal("SELECT * FROM `test` LIMIT 10");
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a limit and offset", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model, {
					limit: 10,
					offset: 5,
				});
				expect(statement.query).to.equal(
					"SELECT * FROM `test` LIMIT 10 OFFSET 5"
				);
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a limit and offset and order", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model, {
					limit: 10,
					offset: 5,
					orderBy: "id",
				});
				expect(statement.query).to.equal(
					'SELECT * FROM `test` ORDER BY "id" LIMIT 10 OFFSET 5'
				);
				expect(statement.bindings).to.be.empty;
			});
			it("should accept orderBy as an object", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model, {
					orderBy: { column: "id", descending: true, nullLast: true },
				});
				expect(statement.query).to.equal(
					'SELECT * FROM `test` ORDER BY "id" DESC NULLS LAST'
				);
				expect(statement.bindings).to.be.empty;
			});
			it("should accept orderBy as an array", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model, {
					orderBy: [{ column: "id", descending: true, nullLast: true }, "name"],
				});
				expect(statement.query).to.equal(
					'SELECT * FROM `test` ORDER BY "id" DESC NULLS LAST, "name"'
				);
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a where clause with multiple conditions and a limit and offset and order", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model, {
					where: { id: 1, name: "test" },
					limit: 10,
					offset: 5,
					orderBy: [{ column: "name", descending: true }, "id"],
				});
				expect(statement.query).to.equal(
					'SELECT * FROM `test` WHERE id = ? AND name = ? ORDER BY "name" DESC, "id" LIMIT 10 OFFSET 5'
				);
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
			});
			it("should ignore an empty where clause object", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", model, {
					where: {},
				});
				expect(statement.query).to.equal("SELECT * FROM `test`");
				expect(statement.bindings).to.be.empty;
			});
		});
		describe(QueryType.DELETE, () => {
			it("should generate a basic query", () => {
				const statement = GenerateQuery(QueryType.DELETE, "test", model);
				expect(statement.query).to.equal("DELETE FROM `test`");
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a where clause", () => {
				const statement = GenerateQuery(QueryType.DELETE, "test", model, {
					where: { id: 1 },
				});
				expect(statement.query).to.equal("DELETE FROM `test` WHERE id = ?");
				expect(statement.bindings.length).to.equal(1);
				expect(statement.bindings[0]).to.equal(1);
			});
			it("should generate a query with a where clause with multiple conditions", () => {
				const statement = GenerateQuery(QueryType.DELETE, "test", model, {
					where: { id: 1, name: "test" },
				});
				expect(statement.query).to.equal(
					"DELETE FROM `test` WHERE id = ? AND name = ?"
				);
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
			});
		});
		describe(QueryType.INSERT, () => {
			it("should throw an error if no data is provided", () => {
				expect(() => GenerateQuery(QueryType.INSERT, "test", model)).to.throw(
					"Must provide data to insert"
				);
			});
			it("should throw an error if empty data is provided", () => {
				expect(() =>
					GenerateQuery(QueryType.INSERT, "test", model, { data: {} })
				).to.throw("Must provide data to insert");
			});
			it("should generate a basic query", () => {
				const statement = GenerateQuery(QueryType.INSERT, "test", model, {
					data: { id: 1 },
				});
				expect(statement.query).to.equal("INSERT INTO `test` (id) VALUES (?)");
				expect(statement.bindings.length).to.equal(1);
				expect(statement.bindings[0]).to.equal(1);
			});
			it("should generate a query with multiple columns", () => {
				const statement = GenerateQuery(QueryType.INSERT, "test", model, {
					data: { id: 1, name: "test" },
				});
				expect(statement.query).to.equal(
					"INSERT INTO `test` (id, name) VALUES (?, ?)"
				);
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
			});
			it("should generate a query with multiple columns and boolean values", () => {
				const statement = GenerateQuery(QueryType.INSERT, "test", model, {
					data: { id: 1, name: "test", flag: true },
				});
				expect(statement.query).to.equal(
					"INSERT INTO `test` (id, name, flag) VALUES (?, ?, ?)"
				);
				expect(statement.bindings.length).to.equal(3);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
				expect(statement.bindings[2]).to.equal(1);
			});
		});
		describe(QueryType.INSERT_OR_REPLACE, () => {
			it("should throw an error if no data is provided", () => {
				expect(() =>
					GenerateQuery(QueryType.INSERT_OR_REPLACE, "test", model)
				).to.throw("Must provide data to insert");
			});
			it("should throw an error if empty data is provided", () => {
				expect(() =>
					GenerateQuery(QueryType.INSERT_OR_REPLACE, "test", model, { data: {} })
				).to.throw("Must provide data to insert");
			});
			it("should generate a basic query", () => {
				const statement = GenerateQuery(QueryType.INSERT_OR_REPLACE, "test", model, {
					data: { id: 1 },
				});
				expect(statement.query).to.equal(
					"INSERT or REPLACE INTO `test` (id) VALUES (?)"
				);
				expect(statement.bindings.length).to.equal(1);
				expect(statement.bindings[0]).to.equal(1);
			});
			it("should generate a query with multiple columns", () => {
				const statement = GenerateQuery(QueryType.INSERT_OR_REPLACE, "test", model, {
					data: { id: 1, name: "test" },
				});
				expect(statement.query).to.equal(
					"INSERT or REPLACE INTO `test` (id, name) VALUES (?, ?)"
				);
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
			});
		});
		describe(QueryType.UPDATE, () => {
			it("should throw an error if no data is provided", () => {
				expect(() => GenerateQuery(QueryType.UPDATE, "test", model)).to.throw(
					"Must provide data to update"
				);
			});
			it("should throw an error if empty data is provided", () => {
				expect(() =>
					GenerateQuery(QueryType.UPDATE, "test", model, { data: {} })
				).to.throw("Must provide data to update");
			});
			it("should generate a basic query", () => {
				const statement = GenerateQuery(QueryType.UPDATE, "test", model, {
					data: { id: 1 },
				});
				expect(statement.query).to.equal("UPDATE `test` SET id = ?");
				expect(statement.bindings.length).to.equal(1);
				expect(statement.bindings[0]).to.equal(1);
			});
			it("should generate a query with multiple columns", () => {
				const statement = GenerateQuery(QueryType.UPDATE, "test", model, {
					data: { id: 1, name: "test" },
				});
				expect(statement.query).to.equal("UPDATE `test` SET id = ?, name = ?");
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
			});
			it("should generate a query with a where clause", () => {
				const statement = GenerateQuery(QueryType.UPDATE, "test", model, {
					data: { name: "test" },
					where: { id: 1 },
				});
				expect(statement.query).to.equal(
					"UPDATE `test` SET name = ? WHERE id = ?"
				);
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal("test");
				expect(statement.bindings[1]).to.equal(1);
			});
			it("should generate a query with a where clause with multiple conditions", () => {
				const statement = GenerateQuery(QueryType.UPDATE, "test", model, {
					data: { name: "test" },
					where: { id: 1, name: "test" },
				});
				expect(statement.query).to.equal(
					"UPDATE `test` SET name = ? WHERE id = ? AND name = ?"
				);
				expect(statement.bindings.length).to.equal(3);
				expect(statement.bindings[0]).to.equal("test");
				expect(statement.bindings[1]).to.equal(1);
				expect(statement.bindings[2]).to.equal("test");
			});
		});
		describe(QueryType.UPSERT, () => {
			it("should throw an error if invalid options are provided", () => {
				expect(() => GenerateQuery(QueryType.UPSERT, "test", model)).to.throw(
					"Must provide data to insert with, data to update with, and where keys in Upsert"
				);
				expect(() =>
					GenerateQuery(QueryType.UPSERT, "test", model, {
						data: { id: 1 },
					})
				).to.throw(
					"Must provide data to insert with, data to update with, and where keys in Upsert"
				);
				expect(() =>
					GenerateQuery(QueryType.UPSERT, "test", model, {
						data: { id: 1 },
						where: { id: 1 },
					})
				).to.throw(
					"Must provide data to insert with, data to update with, and where keys in Upsert"
				);
				expect(() =>
					GenerateQuery(QueryType.UPSERT, "test", model, {
						data: { id: 1 },
						where: { id: 1 },
						upsertOnlyUpdateData: { id: 1 },
					})
				).to.not.throw();
			});
			it("should generate a basic query", () => {
				const statement = GenerateQuery(QueryType.UPSERT, "test", model, {
					data: { id: 1 },
					upsertOnlyUpdateData: { id: 2 },
					where: { id: 3 },
				});
				expect(statement.query).to.equal(
					"INSERT INTO `test` (id) VALUES (?) ON CONFLICT (id) DO UPDATE SET id = ? WHERE id = ?"
				);
				expect(statement.bindings.length).to.equal(3);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal(2);
				expect(statement.bindings[2]).to.equal(3);
			});
			it("should generate a query with multiple columns", () => {
				const statement = GenerateQuery(QueryType.UPSERT, "test", model, {
					data: { id: 1, name: "test" },
					upsertOnlyUpdateData: { id: 1, name: "test" },
					where: { id: 1 },
				});
				expect(statement.query).to.equal(
					"INSERT INTO `test` (id, name) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET id = ?, name = ? WHERE id = ?"
				);
				expect(statement.bindings.length).to.equal(5);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
				expect(statement.bindings[2]).to.equal(1);
				expect(statement.bindings[3]).to.equal("test");
				expect(statement.bindings[4]).to.equal(1);
			});
			it("should generate a query with a different ON CONFLICT key", () => {
				const statement = GenerateQuery(
					QueryType.UPSERT,
					"test", model,

					{
						data: { id: 1, name: "test" },
						upsertOnlyUpdateData: { id: 1, name: "test" },
						where: { id: 1 },
					},
					"name"
				);
				expect(statement.query).to.equal(
					"INSERT INTO `test` (id, name) VALUES (?, ?) ON CONFLICT (name) DO UPDATE SET id = ?, name = ? WHERE id = ?"
				);
				expect(statement.bindings.length).to.equal(5);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
				expect(statement.bindings[2]).to.equal(1);
				expect(statement.bindings[3]).to.equal("test");
				expect(statement.bindings[4]).to.equal(1);
			});
			it("should accept multiple primary keys", () => {
				const statement = GenerateQuery(
					QueryType.UPSERT,
					"test", model,
					{
						data: { id: 1, name: "test" },
						upsertOnlyUpdateData: { id: 1, name: "test" },
						where: { id: 1 },
					},
					["name", "id"]
				);
				expect(statement.query).to.equal(
					"INSERT INTO `test` (id, name) VALUES (?, ?) ON CONFLICT (name, id) DO UPDATE SET id = ?, name = ? WHERE id = ?"
				);
				expect(statement.bindings.length).to.equal(5);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
				expect(statement.bindings[2]).to.equal(1);
				expect(statement.bindings[3]).to.equal("test");
				expect(statement.bindings[4]).to.equal(1);
			});
		});
	});
	describe("Ordering", () => {
		it("should not transform a single string", () => {
			expect(transformOrderBy("test")).to.equal(`"test"`);
		});
		it("should transform an array of strings", () => {
			expect(transformOrderBy(["test", "test2"])).to.equal(`"test", "test2"`);
		});
		it("should transform an object", () => {
			expect(transformOrderBy({ column: "id" })).to.equal(`"id"`);
			expect(transformOrderBy({ column: "id", descending: true })).to.equal(
				`"id" DESC`
			);
			expect(
				transformOrderBy({ column: "id", descending: true, nullLast: true })
			).to.equal(`"id" DESC NULLS LAST`);
		});
		it("should transform an array of objects", () => {
			expect(transformOrderBy([{ column: "id" }, { column: "id2" }])).to.equal(
				`"id", "id2"`
			);
			expect(
				transformOrderBy([
					{ column: "id", descending: true },
					{ column: "id2" },
				])
			).to.equal(`"id" DESC, "id2"`);
			expect(
				transformOrderBy([
					{ column: "id", descending: true, nullLast: true },
					{ column: "id2" },
				])
			).to.equal(`"id" DESC NULLS LAST, "id2"`);
		});
		it("should mix and match strings and objects", () => {
			expect(
				transformOrderBy([
					{ column: "id", descending: true, nullLast: true },
					"id2",
				])
			).to.equal(`"id" DESC NULLS LAST, "id2"`);
		});
	});
});
