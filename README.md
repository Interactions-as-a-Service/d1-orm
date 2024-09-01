# D1-Orm

✨ A simple, strictly typed ORM, to assist you in using [Cloudflare's SQLite Database](https://developers.cloudflare.com/d1)

Docs can be found at https://docs.interactions.rest/d1-orm/

API reference can be found at https://orm.interactions.rest/modules

## Installation

This package can be [found on NPM](https://npmjs.com/package/d1-orm)

```sh
npm install d1-orm
```

## Usage

This package is recommended to be used with [@cloudflare/workers-types](https://github.com/cloudflare/workers-types) 4+.

```ts
import { D1Orm, DataTypes, Model } from "d1-orm";
import type { Infer } from "d1-orm";

export interface Env {
	// from @cloudflare/workers-types
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env) {
		const orm = new D1Orm(env.DB);
		const users = new Model(
			{
				D1Orm: orm,
				tableName: "users",
				primaryKeys: "id",
				autoIncrement: "id",
				uniqueKeys: [["email"]],
			},
			{
				id: {
					type: DataTypes.INTEGER,
					notNull: true,
				},
				name: {
					type: DataTypes.STRING,
					notNull: true,
					defaultValue: "John Doe",
				},
				email: {
					type: DataTypes.STRING,
				},
			},
		);
		type User = Infer<typeof users>;

		await users.First({
			where: {
				id: 1,
			},
		});
		// Promise<User | null>
	},
};
```
