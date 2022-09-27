---
"d1-orm": patch
---

Chore: Make first() return null on a D1_NORESULTS error, as it's inconsistent with local and remote, and that error is near meaningless.
