import { expect } from "chai";
import { GenerateQuery, QueryType } from "../lib/queryBuilder.js";

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
			expect(() => GenerateQuery("INVALID", "test", () => {})).to.throw(
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
				const statement = GenerateQuery(QueryType.SELECT, "test");
				expect(statement.query).to.equal("SELECT * FROM test");
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a where clause", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", {
					where: { id: 1 },
				});
				expect(statement.query).to.equal("SELECT * FROM test WHERE id = ?");
				expect(statement.bindings.length).to.equal(1);
				expect(statement.bindings[0]).to.equal(1);
			});
			it("should generate a query with a where clause with multiple conditions", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", {
					where: { id: 1, name: "test" },
				});
				expect(statement.query).to.equal(
					"SELECT * FROM test WHERE id = ? AND name = ?"
				);
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
			});
			it("should generate a query with a limit", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", {
					limit: 10,
				});
				expect(statement.query).to.equal("SELECT * FROM test LIMIT 10");
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a limit and offset", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", {
					limit: 10,
					offset: 5,
				});
				expect(statement.query).to.equal(
					"SELECT * FROM test LIMIT 10 OFFSET 5"
				);
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a limit and offset and order", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", {
					limit: 10,
					offset: 5,
					orderBy: "id",
				});
				expect(statement.query).to.equal(
					'SELECT * FROM test ORDER BY "id" LIMIT 10 OFFSET 5'
				);
				expect(statement.bindings).to.be.empty;
			});
			it("should accept orderBy as an object", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", {
					orderBy: { column: "id", descending: true, nullLast: true },
				});
				expect(statement.query).to.equal(
					'SELECT * FROM test ORDER BY "id" DESC NULLS LAST'
				);
				expect(statement.bindings).to.be.empty;
			});
			it("should accept orderBy as an array", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", {
					orderBy: [{ column: "id", descending: true, nullLast: true }, "name"],
				});
				expect(statement.query).to.equal(
					'SELECT * FROM test ORDER BY "id" DESC NULLS LAST, "name"'
				);
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a where clause with multiple conditions and a limit and offset and order", () => {
				const statement = GenerateQuery(QueryType.SELECT, "test", {
					where: { id: 1, name: "test" },
					limit: 10,
					offset: 5,
					orderBy: [{ column: "name", descending: true }, "id"],
				});
				expect(statement.query).to.equal(
					'SELECT * FROM test WHERE id = ? AND name = ? ORDER BY "name" DESC, "id" LIMIT 10 OFFSET 5'
				);
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
			});
		});
		describe(QueryType.DELETE, () => {
			it("should generate a basic query", () => {
				const statement = GenerateQuery(QueryType.DELETE, "test");
				expect(statement.query).to.equal("DELETE FROM test");
				expect(statement.bindings).to.be.empty;
			});
			it("should generate a query with a where clause", () => {
				const statement = GenerateQuery(QueryType.DELETE, "test", {
					where: { id: 1 },
				});
				expect(statement.query).to.equal("DELETE FROM test WHERE id = ?");
				expect(statement.bindings.length).to.equal(1);
				expect(statement.bindings[0]).to.equal(1);
			});
			it("should generate a query with a where clause with multiple conditions", () => {
				const statement = GenerateQuery(QueryType.DELETE, "test", {
					where: { id: 1, name: "test" },
				});
				expect(statement.query).to.equal(
					"DELETE FROM test WHERE id = ? AND name = ?"
				);
				expect(statement.bindings.length).to.equal(2);
				expect(statement.bindings[0]).to.equal(1);
				expect(statement.bindings[1]).to.equal("test");
			});
		});
	});
});
