---
"d1-orm": minor
---

[breaking] feat: Switch to use a QueryBuilder instead of duplicate code in the Model class

This will be much more expandable in future to support things like advanced where querying, using operators other than AND, joins, etc.
