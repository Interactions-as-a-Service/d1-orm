This is a way to insert a new record, or update an existing record, based on a unique key. This is a very common operation in many applications, and is often referred to as Upserting.

It's best to be used when you control the primary key of the record, and you want to update the record if it exists, or insert it if it doesn't. Let's use an example for this.

```ts
type User = {
	id: number;
	name: string;
	email: string;
};

const user: User = {
	id: 1,
	name: "John Doe",
	email: "john-doe@gmail.com",
};
```

In this case, our user will always have an ID of 1.
An UPSERT query in SQL looks something like

```sql
INSERT INTO USERS (id, name, email) VALUES (1, 'John Doe', 'john-doe@gmail.com')
ON CONFLICT(id) DO UPDATE SET name = 'John Doe', email = 'john-doe@gmail.com'
WHERE id = 1;
```

This query attempts to insert our user with an ID of 1, and if it already exists, the ON CONFLICT clause is called, instead updating our user.

The [QueryBuilder](/guides/query-building) supports this operation, and it's very easy to use. Let's see how we can do this.

```ts
import { GenerateQuery, QueryType } from "d1-orm";

type User = {
	id: number;
	name: string;
	email: string;
};

const user: User = {
	id: 1,
	name: "John Doe",
	email: "john-doe@gmail.com",
};

const statement = GenerateQuery(
	QueryType.UPSERT,
	"users",
	{
		data: user,
		upsertOnlyUpdateData: {
			name: user.name,
			email: user.email,
		},
		where: {
			id: user.id,
		},
	},
	"id"
);
/* Returns: 
{
	query: "INSERT INTO users (id, name, email) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = ?, email = ? WHERE id = ?",
	bindings: [1, "John Doe", "john-doe@gmail.com", "John Doe", "john-doe@gmail.com", 1]
}
*/
```

That might have looked like a lot. If you're confused about the first statements, reading [the Query Building guide](/guides/query-building) will help you out.
The important part here is the final code block.

We generate a statement with the `GenerateQuery` method, and pass in the `QueryType.UPSERT` parameter. This tells the method that we want to generate an UPSERT statement. We then give it the name of the table to use, in this case "users".

The next parameter is the `QueryOptions` object. This is where we specify the data we want to insert, and the data we want to update. We specify three objects within this:

- `data`: This is the data we want to insert. In this case, it's the `user` object we created earlier.
- `where`: This is the unique key we want to use to determine if the record exists. In this case, we use the `id` field. `id` is the only field that's useful here, but you can use multiple fields if you want.
- `upsertOnlyUpdateData`: This is the data we want to update if the record exists. In this case, we use the `name` and `email` fields.

Finally, the QueryBuilder allows you to provide a primary key for UPSERT operations, if you so choose. It will default to `id`. This is the key that is used in the `ON CONFLICT` statement. In this case, we use `id` as well. You can specify an array of keys if you're using composite primary keys.

\*Note: This primary key value will be ignored for all other operations, and will only be used for UPSERT operations.

### Upserting with Models

This follows the same process as the previous example, but with a [Model](/guides/models) instead of the raw query builder interface.

```ts
import { Model, DataTypes } from "d1-orm";
import type { Infer } from "d1-orm";

const users = new Model(
	{
		tableName: "users",
		D1Orm: MyD1OrmInstance,
	},
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			notNull: true,
		},
		email: {
			type: DataTypes.STRING,
		},
	}
);

type User = Infer<typeof users>;

const user: User = {
	id: 1,
	name: "John Doe",
	email: "john-doe@gmail.com",
};

await users.Upsert({
	data: user,
	upsertOnlyUpdateData: {
		name: user.name,
		email: user.email,
	},
	where: {
		id: user.id,
	},
});
```
