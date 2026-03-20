## 2024-05-24 - Fix Race Condition in Product Reviews Rating Calculation
**Vulnerability:** Authorized users deleting their reviews would trigger a logic error in `newNumOfReviews` variable evaluation when fetching reviews via `.aggregate()`. The failure triggered `TypeError: Cannot read properties of undefined (reading 'length')` due to not checking if `stats` existed before extracting length when recalculating rating distributions.
**Learning:** Checking for presence of data structures returned by mongoose, specifically aggregations, are paramount before performing property lookups on array structures.
**Prevention:** Always verify object existence / null-checks when executing aggregations prior to accessing array components (e.g. `stats && stats.length > 0`).
