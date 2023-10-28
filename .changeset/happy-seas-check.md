---
"d1-orm": minor
---

This introduces breaking changes by updating to the latest `@cloudflare/workers-types@^4.20231025.0`, including compatability changes for the D1Database `exec` API. Namely, the model methods `CreateTable` and `DropTable` now return a `D1ExecResult` instead of `D1Result`.
