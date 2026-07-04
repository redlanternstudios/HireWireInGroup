# /patch — Minimal Single-File Change

For surgical fixes: one file, one change, no reasoning needed.

---

Rory will provide: the file path + exactly what to change.

Rules:
- Touch exactly one file
- Make exactly the change described
- No style improvements
- No refactoring nearby code
- No "I also noticed..."

Output:
1. The changed file (full content or targeted diff)
2. One line: what changed
3. Verification: `npx tsc --noEmit` result

If the fix requires touching a second file → stop. Use /scope instead.
