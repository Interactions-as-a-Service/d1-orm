---
"d1-orm": minor
---

Feat: Inferred Types!

Models no longer require you to specify a definition when you create them. Instead, you can just pass in an object and the model will infer the types for you. See the following example:

```ts
import { Model, DataTypes } from "d1-orm";
import type { Infer } from "d1-orm";

const users = new Model(
	{
		tableName: "users",
		D1Orm: MyD1OrmInstance,
	},
	{
		name: DataTypes.STRING,
		age: DataTypes.NUMBER,
	}
);

type User = Infer<typeof users>;
// type User = {
// 	name: string,
// 	age: number
// }
```
