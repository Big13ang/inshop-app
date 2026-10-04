# Exact Backend Types Rule

## Mandatory Exact Types from Backend

1. **Never Guess or Use Speculative Types**:
   - You are NEVER allowed to guess API response shapes or data structures.
   - You are NEVER allowed to use union/piped fallback types for responses (e.g. `PaginatedApiResponse<T> | ApiResponse<Obj> | ApiResponse<T[]>`).
   - You are NEVER allowed to write speculative multi-branch runtime parsers that inspect `Array.isArray(...)`, `typeof rawData === 'object'`, or fallback properties (`obj.products || obj.posts`).

2. **Always Read Contracts Directly from Backend**:
   - For any API endpoint or data model, always inspect the backend project directly at `/data/InShop/inshop-back-end/src/...`.
   - Check the controller method, Swagger `@ApiOkResponse`, return statement, and corresponding DTOs under `src/**/dto/*.dto.ts`.
   - Check `/data/InShop/inshop-back-end/docs/frontend-api-reference.md`.
   - Mirror the exact contract in frontend TypeScript interfaces.
