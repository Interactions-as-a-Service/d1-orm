---
"d1-orm": minor
---

Adds a `withRowId` option to the Model class, defaulting to false. When not set to `true`, the `Model.createTableDefinition` will now include a `WITHOUT ROWID` line, which can optimise the performance of a majority of tables.
