---
"d1-orm": minor
---

[breaking] Feat: Refactor models to allow multiple unique keys

This change restructures the way that primary keys, auto increment keys and unique keys are provided. This allows for multiple unique keys to be provided for a model. These fields have been moved from the ModelColumn type to the first parameter in the Model constructor.

Refer to [the docs](https://docs.interactions.rest/d1-orm/) for more information.
