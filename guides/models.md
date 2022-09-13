Models are a wrapper around the [Query Builder](/guides/query-building) that allows you to manage the queries and data in a more object-oriented way.

### Creating a Model

To start with, we'll make a type for our model. This is optional, but it's recommended to make a type for your model so you can have improved type safety.

```ts
type User = {
	id: number;
	name: string;
	email: string | undefined;
};
```

Now we need to define the Model structure.

```ts
import { D1Orm, DataTypes, Model } from "d1-orm";

// We must initialise an ORM to use the Model class. This is done by passing in a D1Database instance.
const orm = new D1Orm(env.DB);

// Now, to create the model:
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
```

Both arguments are required. The first argument is the model options, and the second argument is the model schema.

- The model options should contain the `D1Orm` instance we created earlier, and the `tableName` of the model.

- The model schema should contain the columns of the model. The key of the object should be the name of the column, and the value should be the column options. See {@link ModelColumn} for API reference.

The next step is to create the table in the database. This is done by calling the {@link Model.CreateTable} method on the model. There are two strategies for this:

- default: This will attempt to create the table, and error if it already exists.
- force: This will drop the table if it already exists, and then recreate it. Warning: This will delete all data in the table.

To use it, it's as simple as

```ts
await users.CreateTable({ strategy: "default" /* or "force" */ });
```

This will either return successfully or throw an error that your table already exists.

It's not recommended to use the force strategy in production, but it's useful for development.
You additionally shouldn't call this method on each worker request, as it's an expensive operation. Instead, you should call it once when you deploy your worker.

That's it! You've now created a model. You can now use the model to query the database.

### Selecting Data

There are two ways of selecting data from the database. The first is to use the {@link Model.First} method which will return one result, and the second is to use the {@link Model.All} method, which will return an array of results.

#### First()

Let's start with the {@link Model.First} method. This method will return the first result that matches the query. It takes a single argument, which is an object containing a `Where` clause. See [Query Building](/guides/query-building) for more information on how to use the `Where` clause. This should be an object with a key of the column name, and a value of the value to match.

```ts
const user = await users.First({ where: { id: 1 } });
```

This will return the first user with an ID of 1, equivalent to `SELECT * FROM users WHERE id = 1 LIMIT 1`.

#### All()

Now for the {@link Model.All} method. This has one parameter, an object with `where`, `limit`, `offset` and `orderBy` properties. These are all optional, and are used to filter the results. See [Query Building](/guides/query-building) for more information on how to use these properties.

```ts
const users = await users.All({
	where: { name: "John Doe" },
	limit: 10,
	offset: 0,
	orderBy: ["id"],
});
```

This will return the first 10 users with a name of "John Doe", ordered by ID, equivalent to `SELECT * FROM users WHERE name = "John Doe" ORDER BY "id" LIMIT 10 OFFSET 0`.

TODO: InsertOne, InsertMany, Update, Delete
