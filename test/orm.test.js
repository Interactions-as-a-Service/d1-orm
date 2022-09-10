import { expect } from "chai";
import { D1Orm } from "../lib/database.js";

describe("ORM Validation", () => {
	it("should throw if the database does not have the required methods", () => {
		expect(() => new D1Orm({})).to.throw(
			Error,
			"Invalid database, should contain prepare, dump, batch, and exec methods"
		);
	});
	it("should allow a valid database", () => {
		expect(
			() =>
				new D1Orm({
					prepare: () => {},
					dump: () => {},
					batch: () => {},
					exec: () => {},
				})
		).to.not.throw();
	});
	describe("it should call the database methods", () => {
		const hasCalled = {
			prepare: false,
			dump: false,
			batch: false,
			exec: false,
		};
		const db = {
			prepare: () => {
				hasCalled.prepare = true;
			},
			dump: () => {
				hasCalled.dump = true;
			},
			batch: () => {
				hasCalled.batch = true;
			},
			exec: () => {
				hasCalled.exec = true;
			},
		};
		const orm = new D1Orm(db);
		it("should call prepare", () => {
			orm.prepare("test");
			expect(hasCalled.prepare).to.be.true;
		});
		it("should call dump", () => {
			orm.dump();
			expect(hasCalled.dump).to.be.true;
		});
		it("should call batch", () => {
			orm.batch();
			expect(hasCalled.batch).to.be.true;
		});
		it("should call exec", () => {
			orm.exec();
			expect(hasCalled.exec).to.be.true;
		});
	});
});
