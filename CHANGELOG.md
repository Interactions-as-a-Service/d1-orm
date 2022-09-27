# d1-orm

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

- f32ff3c: Add typedoc to generate docs, see https://d1-orm.pages.dev

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
