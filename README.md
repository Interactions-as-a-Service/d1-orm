# D1-Orm

✨ A simple, strictly typed ORM, to assist you in using [Cloudflare's D1 product](https://blog.cloudflare.com/introducing-d1/)

Docs can be found at https://d1-orm.pages.dev

## Installation

This package can be [found on NPM](npmjs.com/package/d1-orm)

```sh
$ npm install d1-orm
```

## Usage

This package is recommended to be used with [@cloudflare/workers-types](https://github.com/cloudflare/workers-types) 3.16.0+.

```ts
import { D1Orm, DataTypes, Model } from "d1-orm";

export interface Env {
	// from @cloudflare/workers-types
	DB: D1Database;
}

type User = {
	id: number;
	name: string;
	email: string | undefined;
};

export default {
	async fetch(request: Request, env: Env) {
		const orm = new D1Orm(env.DB);
		const users = new Model<User>(
			{
				D1Orm: orm,
				tableName: "users",
			},
			{
				id: {
					type: DataTypes.INTEGER,
					primaryKey: true,
					autoIncrement: true,
					notNull: true,
				},
				name: {
					type: DataTypes.STRING,
					notNull: true,
					defaultValue: "John Doe",
				},
				email: {
					type: DataTypes.STRING,
					unique: true,
				},
			}
		);
	},
};
```

### Creating a table

```ts
// This will create the table based off of your model, and error if the table already exists.
await users.CreateTable({ strategy: "default" });

// You could force the table's creation, by dropping the table if it already exists.
await users.CreateTable({ strategy: "force" });
```

## Querying

### Selecting

```ts
await users.All({
	limit: 5,
	where: {
		name: "John Doe",
	},
});

await users.First({
	where: {
		email: "hello@example.com",
	},
});
```

### Inserting

```ts
await users.InsertOne({
	name: "Jane Doe",
	email: "jane@example.com",
});

await users.InsertMany([
	{
		name: "Jane Doe",
		email: "jane@example.com",
	},
	{
		name: "John Doe",
		email: "john@example.com",
	},
]);
```

### Updating

```ts
await users.Update({
	data: {
		name: 'Michael'
	},
	where: {
		name: 'John Doe',
	}
	limit: 3,
})
```

### Deleting

```ts
await users.Delete({
	where: {
		name: "John Doe",
	},
	limit: 5,
});
```

### Upserting

This allows you to Insert a model, or Update it if one with that primary key already exists.

```ts
await users.Upsert({
	insertData: {
		id: 1,
		name: "John Doe",
	},
	updateData: {
		name: "Jane Doe",
	},
	where: {
		id: 1,
	},
});
// The first time this is run, it'll create a user with ID 1, and name John Doe. When running this again, the primary key already exists with an ID of one, so the update statement is called instead.
```
