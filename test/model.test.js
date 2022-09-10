import { expect } from "chai";
import { D1Orm } from "../lib/database.js";
import { DataTypes } from "../lib/datatypes.js";
import { Model } from "../lib/model.js";

describe("Model Validation", () => {
	const fakeD1Database = {
		prepare: () => {},
		dump: () => {},
		batch: () => {},
		exec: () => {},
	};
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
			).to.throw(Error, "Model must have 1 primary key, got: 0");
		});
		it("should throw an error if there is more than 1 primary key", () => {
			expect(
				() =>
					new Model(
						{ D1Orm: orm, tableName: "test" },
						{
							id: { type: DataTypes.INTEGER, primaryKey: true },
							id2: { type: DataTypes.INTEGER, primaryKey: true },
						}
					)
			).to.throw(Error, "Model must have 1 primary key, got: 2");
		});
	});
});
