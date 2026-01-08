# Changelog

All notable changes to this project will be documented in this file.

## [0.1.3] - 2026-01-08
- Add `appearance` support for implicit and explicit widgets
- Update README examples to document appearance modes

## [0.1.2] - 2025-01-27
- **Fix**: Resolve compatibility issue with Next.js 13+ async `headers()` function
- **Improvement**: `getClientIp()` now handles both sync (Next.js 12) and async (Next.js 13+) `headers()` calls
- **Breaking**: `getClientIp()` is now async and returns `Promise<string | undefined>`

## [0.1.1] - 2025-06-27
- Fix issue with callback invocation in implicit mode
- Fix issue with duplicate script tag in implicit mode

## [0.1.0] - 2025-06-26
- **TypeScript rewrite**: Complete migration of the codebase to TypeScript for improved type safety and maintainability
- Added comprehensive server-side tests with Jest
- Added support for React 19
- Added support for Next.js 15
- Fixed page reload on token expiry
- Supporting timeout callback for widgets

## [0.0.6] - 2024-09-23
- Improved callback handling for explicit and implicit widgets
- Utility functions for reset/get/check updated
- Implicit widget: check for duplicate responseFieldName and load script with helper
- Explicit widget: improved callback invocation
- Documentation updates regarding callbacks
- Version and build updates

## [0.0.05] - 2024-09-22
- Improved IP detection in `verifyTurnstile`
- Improved rendering checks in `resetTurnstile`
- Peer dependency fixes for React and Next.js
- Babel build added for compatibility
- Bugfix: duplicate userIP declaration in `verifyTurnstile`

## [0.0.4] - 2024-09-11
- Initial release: Next.js Cloudflare Turnstile integration
- Supports implicit and explicit widget modes
- SSR-safe utility functions
- Server-side verification helper
- `resetTurnstile()` utility added
- `onError`, `onExpire`, `onSuccess` attributes for widgets

---

> For a full commit history, see the [GitHub repository](https://github.com/davodm/nextjs-turnstile/commits/main). 
