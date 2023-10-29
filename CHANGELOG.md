# d1-orm

## 0.9.0

### Minor Changes

- [#71](https://github.com/Interactions-as-a-Service/d1-orm/pull/71) [`5c168e9`](https://github.com/Interactions-as-a-Service/d1-orm/commit/5c168e91ab72e675435b38efd1a3aef988f92d9f) Thanks [@dtbuchholz](https://github.com/dtbuchholz)! - This introduces breaking changes by updating to the latest `@cloudflare/workers-types@^4.20231025.0`, including compatability changes for the D1Database `exec` API. Namely, the model methods `CreateTable` and `DropTable` now return a `D1ExecResult` instead of `D1Result`.

## 0.8.0

### Minor Changes

- [#69](https://github.com/Interactions-as-a-Service/d1-orm/pull/69) [`2d5cbef`](https://github.com/Interactions-as-a-Service/d1-orm/commit/2d5cbefc2e904f34781f670cc46f9765492c290e) Thanks [@helloimalastair](https://github.com/helloimalastair)! - Adds a `withRowId` option to the Model class, defaulting to false. When not set to `true`, the `Model.createTableDefinition` will now include a `WITHOUT ROWID` line, which can optimise the performance of a majority of tables.

## 0.7.2

### Patch Changes

- [#61](https://github.com/Interactions-as-a-Service/d1-orm/pull/61) [`921aef0`](https://github.com/Interactions-as-a-Service/d1-orm/commit/921aef093b4af2f9932ef71a2315d33fb4f4dea9) Thanks [@Skye-31](https://github.com/Skye-31)! - Chore: use single quotes in the create table definition of a model

## 0.7.1

### Patch Changes

- [`30b38c7`](https://github.com/Interactions-as-a-Service/d1-orm/commit/30b38c7d32e6bca3397703c986222f4e0c51b0c8) Thanks [@Skye-31](https://github.com/Skye-31)! - Fix: Unnecessary double partial in some Model queries

## 0.7.0

### Minor Changes

- [#57](https://github.com/Interactions-as-a-Service/d1-orm/pull/57) [`75f58c0`](https://github.com/Interactions-as-a-Service/d1-orm/commit/75f58c0135aeec838caec4a7d447296cff1dab06) Thanks [@Skye-31](https://github.com/Skye-31)! - Feat: Make `new Model()` option for ORM optional. Add Model.D1Orm getter & Model.SetOrm() to allow people to provide an orm after the constructor has been initialised

## 0.6.0

### Minor Changes

- [#55](https://github.com/Interactions-as-a-Service/d1-orm/pull/55) [`5e30824`](https://github.com/Interactions-as-a-Service/d1-orm/commit/5e308247f77ab8ee05879a438c0a1d5ec3d3646e) Thanks [@Skye-31](https://github.com/Skye-31)! - [breaking] Feat: Refactor models to allow multiple unique keys

  This change restructures the way that primary keys, auto increment keys and unique keys are provided. This allows for multiple unique keys to be provided for a model. These fields have been moved from the ModelColumn type to the first parameter in the Model constructor.

  Refer to [the docs](https://docs.interactions.rest/d1-orm/) for more information.

## 0.5.5

### Patch Changes

- [`fc7cb87`](https://github.com/Interactions-as-a-Service/d1-orm/commit/fc7cb87c677e7b673ac0530baf00cafe7be67c73) Thanks [@Skye-31](https://github.com/Skye-31)! - Feat: Allow null items in Infer<Model>

  This change checks NOT NULL constraints on the model definition, and allows null when the constraint is not present.

## 0.5.4

### Patch Changes

- [`b8e1ce6`](https://github.com/Interactions-as-a-Service/d1-orm/commit/b8e1ce67342044d750a312a1fc6d843bde8d0afa) Thanks [@Skye-31](https://github.com/Skye-31)! - Chore: fix inferred return type for Model.First()

## 0.5.3

### Patch Changes

- [`5d09207`](https://github.com/Interactions-as-a-Service/d1-orm/commit/5d09207b339ffc276282d6b84107f84bcd920520) Thanks [@Skye-31](https://github.com/Skye-31)! - Chore: export some types used by Model so VSC can pick up on them

## 0.5.2

### Patch Changes

- [`b214e74`](https://github.com/Interactions-as-a-Service/d1-orm/commit/b214e74a5c7c56fb593008b87bf819affb52fb47) Thanks [@Skye-31](https://github.com/Skye-31)! - Feat: boolean support

## 0.5.1

### Patch Changes

- [`926d8c6`](https://github.com/Interactions-as-a-Service/d1-orm/commit/926d8c6c5ad304faf215dc0b38bbd7b7ad876d1a) Thanks [@Skye-31](https://github.com/Skye-31)! - Chore: fix Model return types for First() and All()

## 0.5.0

### Minor Changes

- [#44](https://github.com/Interactions-as-a-Service/d1-orm/pull/44) [`101043b`](https://github.com/Interactions-as-a-Service/d1-orm/commit/101043b9ff823598774f9113870d11931f7d1506) Thanks [@Skye-31](https://github.com/Skye-31)! - Feat: Inferred Types!

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

## 0.4.0

### Minor Changes

- [#41](https://github.com/Interactions-as-a-Service/d1-orm/pull/41) [`f8ca119`](https://github.com/Interactions-as-a-Service/d1-orm/commit/f8ca119c0925fe3c813bfce832299129ae99d591) Thanks [@kingmesal](https://github.com/kingmesal)! - Adding insert or replace

## 0.3.3

### Patch Changes

- [`efd6352`](https://github.com/Interactions-as-a-Service/d1-orm/commit/efd635290dfed2c5a3ac12893b2f9b2fced16d16) Thanks [@Skye-31](https://github.com/Skye-31)! - Redo changes in 0.3.2

## 0.3.2

### Patch Changes

- [`de7eb7d`](https://github.com/Interactions-as-a-Service/d1-orm/commit/de7eb7d72f875aa4c3baa996c85b530f3e245eeb) Thanks [@Skye-31](https://github.com/Skye-31)! - Chore: Make first() return null on a D1_NORESULTS error, as it's inconsistent with local and remote, and that error is near meaningless.

## 0.3.1

### Patch Changes

- [`c59b3d8`](https://github.com/Interactions-as-a-Service/d1-orm/commit/c59b3d8d13e6fcfa9254fdb81ae3b7e8901f3bf2) Thanks [@Skye-31](https://github.com/Skye-31)! - Fix autoincrement table definitions

## 0.3.0

### Minor Changes

- [#36](https://github.com/Interactions-as-a-Service/d1-orm/pull/36) [`9ac7269`](https://github.com/Interactions-as-a-Service/d1-orm/commit/9ac726959774d1a577048ccd7404f1c28c50fa93) Thanks [@Skye-31](https://github.com/Skye-31)! - Feat: Composite primary keys

### Patch Changes

- [#34](https://github.com/Interactions-as-a-Service/d1-orm/pull/34) [`f19fbb2`](https://github.com/Interactions-as-a-Service/d1-orm/commit/f19fbb231671d0185f8a42e49a2c86ada99b2feb) Thanks [@Skye-31](https://github.com/Skye-31)! - fix: don't include empty where objects when querying

## 0.2.2

### Patch Changes

- [`b0088b2`](https://github.com/Interactions-as-a-Service/d1-orm/commit/b0088b2884889e86fe871c965be5e154c3af2d99) Thanks [@Skye-31](https://github.com/Skye-31)! - Fix types for Model.First() (should return T, not D1Result<T>)

## 0.2.1

### Patch Changes

- [#27](https://github.com/Interactions-as-a-Service/d1-orm/pull/27) [`1e8e4e5`](https://github.com/Interactions-as-a-Service/d1-orm/commit/1e8e4e54d948d6eac4aff13b24676926fd5f7dce) Thanks [@Skye-31](https://github.com/Skye-31)! - Chore: Make Model#constructor#columns use the provided type of the model, rather than any keys

## 0.2.0

### Minor Changes

- [#21](https://github.com/Interactions-as-a-Service/d1-orm/pull/21) [`b2559ef`](https://github.com/Interactions-as-a-Service/d1-orm/commit/b2559ef2a79ed908b1c5725431af5415490e3201) Thanks [@Skye-31](https://github.com/Skye-31)! - [breaking] feat: Switch to use a QueryBuilder instead of duplicate code in the Model class

  This will be much more expandable in future to support things like advanced where querying, using operators other than AND, joins, etc.

### Patch Changes

- [#26](https://github.com/Interactions-as-a-Service/d1-orm/pull/26) [`bc18cce`](https://github.com/Interactions-as-a-Service/d1-orm/commit/bc18ccea10e332b4d7fa600662cf1358b899c76d) Thanks [@Skye-31](https://github.com/Skye-31)! - Chore: Add a build test

  Also ensure that the lib is built before publishing.

- [#25](https://github.com/Interactions-as-a-Service/d1-orm/pull/25) [`1750a55`](https://github.com/Interactions-as-a-Service/d1-orm/commit/1750a55c77ad6d4fb797cb304309d8b704b271bd) Thanks [@Skye-31](https://github.com/Skye-31)! - Chore: readable guides for interacting with the library
  Closes #22

## 0.1.3

### Patch Changes

- 7ddad51: Chore: start tests

  This initially focuses on just testing Model & ORM validation, with future PRs to be focused on validation of model methods being run

## 0.1.2

### Patch Changes

- f32ff3c: Add typedoc to generate docs, see https://orm.interactions.rest

## 0.1.1

### Patch Changes

- 8173b4c: Chore: Readme with basic usage examples

## 0.1.0

### Minor Changes

- 3f02112: Feat: Start implementing models

  This initial concept looks something like the following.
  The key goals for this PR are to support:

  - Creating table, with a force option, and an alter table option
  - Dropping tables
  - First()
  - All()
  - Update()
  - InsertOne()
  - InsertMany()
  - Delete()
  - Upsert()

  ```ts
  type User = {
    id: number,
    name?: string
  };

  const Users = new Model<User>({
    tableName: 'users',
    D1Orm: myD1Orm
  }, {
    id: {
      type: DataTypes.Integer,
      primaryKey: true,
      notNull: true,
      unique: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.String,
      default: "John Doe"
    }
  });

  Users.First(Options): Promise<D1Result<User>>
  ```
