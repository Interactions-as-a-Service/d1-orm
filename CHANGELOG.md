# d1-orm

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
