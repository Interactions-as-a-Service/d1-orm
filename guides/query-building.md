## Using the Query Builder

The Query Builder is an interface designed for preparing SQL queries in an Object-Oriented manner, with or without the rest of the library.

This guide will go through a basic example of usage.

```ts
import { GenerateQuery, QueryType } from "d1-orm";
```

To start with, we'll create an object for the type of our table. In this example, we'll use a Users type, with the same structure as a users table.

```ts
type User = {
	id: string;
	name: string;
	email: string;
};
```

Now let's fetch all of the users with a particular name.

```ts
const statement = GenerateQuery(QueryType.SELECT, "users", {
	where: {
		name: "John Doe",
	},
});
```

The GenerateQuery method has 3 key parameters.

- QueryType: This is used for determining the structure of your query. See {@link QueryType}.
  The available options are `SELECT`, `INSERT`, `INSERT_OR_REPLACE`, `UPDATE`, `DELETE` and `UPSERT`. These are all standard SQL, with the exception of `UPSERT`.

- TableName: This is rather self-explanatory. It's used to determine which table you're operating on. In this case, we choose "users".

- QueryOptions: For API reference, see {@link GenerateQueryOptions}. For a detailed explanation, carry on reading.

The return value of `statement` will look something like the following

```json
{
	"query": "SELECT * FROM `users` WHERE name = ?",
	"bindings": ["John Doe"]
}
```

You're now able to use this statement however you like.

## QueryOptions

With the example of our User type from above, here's what a full QueryOptions object would look like.

```ts
{
	where?: Partial<User>
	limit?: number,
	offset?: number,
	orderBy?: keyof User | { column: keyof User, descending: boolean, nullLast?: boolean } // Or an array of this
	data?: Partial<User>
	upsertOnlyUpdateData?: Partial<User>
}
```

This is a lot to deal with, so here's a breakdown of it:

- where: This is used for Selects, Updates, Deletes and Upserts. It's a [Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype), meaning that every key of the User type is optional. For now, all that's supported is AND querying. For example the following would generate `SELECT * FROM users WHERE id = 1 AND name = "John Doe"`:

```ts
GenerateQuery(QueryType.SELECT, "users", {
	where: {
		id: "1",
		name: "John Doe",
	},
});
```

- limit: See [SQLITE Limit](https://www.sqlitetutorial.net/sqlite-limit/). Will restrict the maximum number of results returned. Only applicable to Selects.

- offset: See [SQLITE Offset](https://www.sqlitetutorial.net/sqlite-limit/). Skip `offset` results before returning any. Only applied when `limit` is applied. Only applicable to Selects.

- orderBy: This column is a little more complex. Example:

```ts
{
	orderBy: "name"
	orderBy: { column: "name" },
	orderBy: { column: "name", descending: true }, // ORDER BY name DESC
	orderBy: { column: "name", descending: true, nullLast: true}, // ORDER BY name DESC NULLS LAST
	orderBy: ["name", "id"], // ORDER BY name, id
	orderBy: [{ column: "name", descending: true }, "id"] // ORDER BY name DESC, id
}
```

Note: [Order By Nulls Last](https://www.sqlitetutorial.net/sqlite-order-by/#:~:text=the%20SELECT%20clause.-,Sorting%20NULLs,-In%20the%20database)

Any combination of the above is valid. Only applicable to Selects.

- data: Follows the same premise as `where`, however is **mandatory** for INSERTs, UPDATEs and UPSERTs. Is also a `Partial<User>` in this case. Example:

```ts
GenerateQuery(QueryType.INSERT, "users", {
	data: {
		id: 1,
		name: "John Doe",
		email: "john.doe@gmail.com",
	},
});
//query: INSERT INTO `users` (id, name, email) VALUES (?, ? , ?)
//bindings: [1, "John Doe", "john.doe@gmail.com"]
```

- upsertOnlyUpdateData: This is the same as `data`, but is exclusively used for Upsert queries. See [Upserting](/guides/upserting) for more information.
