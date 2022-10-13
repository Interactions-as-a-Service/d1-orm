---
"d1-orm": patch
---

Feat: Allow null items in Infer<Model>

This change checks NOT NULL constraints on the model definition, and allows null when the constraint is not present.
