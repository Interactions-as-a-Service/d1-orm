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
		it("should throw an error if prepare() is not a function", () => {
			expect(() => GenerateQuery(QueryType.SELECT, "test", null)).to.throw(
				Error,
				"Must provide a prepare method which returns a D1PreparedStatement"
			);
		});
		it("should throw an error if query type is invalid", () => {
			expect(() => GenerateQuery("INVALID", "test", () => {})).to.throw(
				Error,
				"Invalid QueryType provided"
			);
		});
		it("should throw an error if prepare() does not return an object with bind() method", () => {
			expect(() => GenerateQuery(QueryType.SELECT, "test", () => {})).to.throw(
				Error,
				"Must provide a prepare method which returns a D1PreparedStatement"
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
				const query = GenerateQuery(QueryType.SELECT, "test", prepare);
				expect(query.statement).to.equal("SELECT * FROM test");
				expect(query.bindings).to.be.empty;
			});
			it("should generate a query with a where clause", () => {
				const query = GenerateQuery(QueryType.SELECT, "test", prepare, {
					where: { id: 1 },
				});
				expect(query.statement).to.equal("SELECT * FROM test WHERE id = ?");
				expect(query.bindings.length).to.equal(1);
				expect(query.bindings[0]).to.equal(1);
			});
			it("should generate a query with a where clause with multiple conditions", () => {
				const query = GenerateQuery(QueryType.SELECT, "test", prepare, {
					where: { id: 1, name: "test" },
				});
				expect(query.statement).to.equal(
					"SELECT * FROM test WHERE id = ? AND name = ?"
				);
				expect(query.bindings.length).to.equal(2);
				expect(query.bindings[0]).to.equal(1);
				expect(query.bindings[1]).to.equal("test");
			});
			it("should generate a query with a limit", () => {
				const query = GenerateQuery(QueryType.SELECT, "test", prepare, {
					limit: 10,
				});
				expect(query.statement).to.equal("SELECT * FROM test LIMIT 10");
				expect(query.bindings).to.be.empty;
			});
			it("should generate a query with a limit and offset", () => {
				const query = GenerateQuery(QueryType.SELECT, "test", prepare, {
					limit: 10,
					offset: 5,
				});
				expect(query.statement).to.equal(
					"SELECT * FROM test LIMIT 10 OFFSET 5"
				);
				expect(query.bindings).to.be.empty;
			});
			it("should generate a query with a limit and offset and order", () => {
				const query = GenerateQuery(QueryType.SELECT, "test", prepare, {
					limit: 10,
					offset: 5,
					orderBy: "id",
				});
				expect(query.statement).to.equal(
					'SELECT * FROM test ORDER BY "id" LIMIT 10 OFFSET 5'
				);
				expect(query.bindings).to.be.empty;
			});
			it("should accept orderBy as an object", () => {
				const query = GenerateQuery(QueryType.SELECT, "test", prepare, {
					orderBy: { column: "id", descending: true, nullLast: true },
				});
				expect(query.statement).to.equal(
					'SELECT * FROM test ORDER BY "id" DESC NULLS LAST'
				);
			});
			it("should accept orderBy as an array", () => {
				const query = GenerateQuery(QueryType.SELECT, "test", prepare, {
					orderBy: [{ column: "id", descending: true, nullLast: true }, "name"],
				});
				expect(query.statement).to.equal(
					'SELECT * FROM test ORDER BY "id" DESC NULLS LAST, "name"'
				);
			});
			it("should generate a query with a where clause with multiple conditions and a limit and offset and order", () => {
				const query = GenerateQuery(QueryType.SELECT, "test", prepare, {
					where: { id: 1, name: "test" },
					limit: 10,
					offset: 5,
					orderBy: [{ column: "name", descending: true }, "id"],
				});
				expect(query.statement).to.equal(
					'SELECT * FROM test WHERE id = ? AND name = ? ORDER BY "name" DESC, "id" LIMIT 10 OFFSET 5'
				);
				expect(query.bindings.length).to.equal(2);
				expect(query.bindings[0]).to.equal(1);
				expect(query.bindings[1]).to.equal("test");
			});
		});
		describe(QueryType.DELETE, () => {
			it("should generate a basic query", () => {
				const query = GenerateQuery(QueryType.DELETE, "test", prepare);
				expect(query.statement).to.equal("DELETE FROM test");
				expect(query.bindings).to.be.empty;
			});
			it("should generate a query with a where clause", () => {
				const query = GenerateQuery(QueryType.DELETE, "test", prepare, {
					where: { id: 1 },
				});
				expect(query.statement).to.equal("DELETE FROM test WHERE id = ?");
				expect(query.bindings.length).to.equal(1);
				expect(query.bindings[0]).to.equal(1);
			});
			it("should generate a query with a where clause with multiple conditions", () => {
				const query = GenerateQuery(QueryType.DELETE, "test", prepare, {
					where: { id: 1, name: "test" },
				});
				expect(query.statement).to.equal(
					"DELETE FROM test WHERE id = ? AND name = ?"
				);
				expect(query.bindings.length).to.equal(2);
				expect(query.bindings[0]).to.equal(1);
				expect(query.bindings[1]).to.equal("test");
			});
		});
	});
});

function prepare(data) {
	const bindings = [];
	const toReturn = {
		statement: data,
		bindings,
		bind: (...value) => {
			bindings.push(...value);
			return toReturn;
		},
	};
	return toReturn;
}
