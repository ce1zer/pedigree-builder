# Deprecations and Updates Report

This document outlines all deprecations, outdated dependencies, security vulnerabilities, and recommended updates found in the codebase.

**Last Updated:** January 2025

## 🔴 Critical Security Issues

### 1. Multer Security Vulnerabilities (CRITICAL)
**Location:** `server/package.json`  
**Current Version:** `^1.4.5-lts.1`  
**Latest Secure Version:** `^2.0.2`  
**Status:** ⚠️ **CRITICAL - Multiple CVEs**

**Vulnerabilities:**
- **CVE-2025-47935**: Resource exhaustion and memory leaks (fixed in 2.0.0)
- **CVE-2025-47944**: DoS via malformed multipart uploads (fixed in 2.0.0)
- **CVE-2025-48997**: DoS via empty string field names (fixed in 2.0.1)
- **CVE-2025-7338**: DoS via malformed requests causing crashes (fixed in 2.0.2)

**Impact:** High - Server is vulnerable to DoS attacks and memory leaks  
**Recommendation:** **UPGRADE IMMEDIATELY** to `multer@^2.0.2`

**Usage:** Used in `server/index.js` for file upload handling

**Fix:**
```bash
cd server
npm install multer@^2.0.2
```

**Note:** Multer 2.x may have breaking changes. Review [migration guide](https://github.com/expressjs/multer/blob/master/CHANGELOG.md) if needed.

### 2. Puppeteer Security Vulnerabilities (HIGH)
**Location:** `server/package.json` and `client/package.json`  
**Current Version:** `^24.26.1`  
**Latest Version:** `^24.32.1`  
**Status:** ⚠️ **HIGH - Security vulnerabilities**

**Vulnerabilities:**
- High severity via `@puppeteer/browsers` and `tar-fs` dependency
- Affects versions `18.2.0 - 22.13.0` (indirect dependency)
- Also includes `js-yaml` moderate severity vulnerability

**Impact:** High - Potential security issues in browser automation  
**Recommendation:** Update to latest version

**Fix:**
```bash
# Server
cd server
npm install puppeteer@^24.32.1

# Client
cd client
npm install puppeteer@^24.32.1
```

## 📦 Package Updates Available

### Client Dependencies

| Package | Current | Latest | Status | Notes |
|---------|---------|--------|--------|-------|
| `@supabase/supabase-js` | ^2.76.1 | 2.87.1 | ⚠️ Update available | Minor updates |
| `axios` | ^1.12.2 | 1.13.2 | ⚠️ Update available | Patch updates |
| `lucide-react` | ^0.546.0 | 0.560.0 | ⚠️ Update available | Icon library updates |
| `react` | 19.2.0 | 19.2.1 | ⚠️ Update available | Patch release |
| `react-dom` | 19.2.0 | 19.2.1 | ⚠️ Update available | Patch release |
| `react-easy-crop` | ^5.5.3 | 5.5.6 | ⚠️ Update available | Minor updates |
| `react-hook-form` | ^7.65.0 | 7.68.0 | ⚠️ Update available | Minor updates |
| `sharp` | ^0.34.4 | 0.34.5 | ⚠️ Update available | Patch release |
| `uuid` | ^11.0.5 | 13.0.0 | ⚠️ Major update | See note below |
| `puppeteer` | ^24.26.1 | 24.32.1 | ⚠️ Security update | See security section |

### Server Dependencies

| Package | Current | Latest | Status | Notes |
|---------|---------|--------|--------|-------|
| `@supabase/supabase-js` | ^2.76.1 | 2.87.1 | ⚠️ Update available | Minor updates |
| `dotenv` | ^16.3.1 | 17.2.3 | ⚠️ Major update | Breaking changes possible |
| `express` | ^4.18.2 | 5.2.1 | ⚠️ Major update | Breaking changes - review carefully |
| `multer` | ^1.4.5-lts.1 | 2.0.2 | 🔴 **CRITICAL** | See security section |
| `puppeteer` | ^24.26.1 | 24.32.1 | ⚠️ Security update | See security section |
| `sharp` | ^0.34.4 | 0.34.5 | ⚠️ Update available | Patch release |
| `uuid` | ^11.0.5 | 13.0.0 | ⚠️ Major update | See note below |

### UUID Package Update

**Current:** `^11.0.5`  
**Latest:** `13.0.0` (released September 2025)

**Status:** Major version update available  
**Impact:** Version 13.0.0 introduces support for RFC9562 UUIDs

**Recommendation:** 
- Review [changelog](https://github.com/uuidjs/uuid/blob/main/CHANGELOG.md) for breaking changes
- Consider using native `crypto.randomUUID()` (available in Node.js 15.6.0+ and modern browsers) as an alternative
- Current usage: `server/index.js` uses `uuid` for generating filenames

**Alternative (Native Crypto):**
```javascript
// Replace: import { v4 as uuidv4 } from 'uuid';
// With: const uuidv4 = () => crypto.randomUUID();
```

## ✅ Already Resolved

### TypeScript Target
**Status:** ✅ **GOOD** - Already updated to `ES2020`  
**Location:** `client/tsconfig.json`  
No action needed.

### Next.js 16 Compatibility
**Status:** ✅ **GOOD** - Code correctly uses async params pattern

The codebase correctly implements Next.js 16's async params requirement:
- ✅ Route handlers use `{ params }: { params: Promise<{ id: string }> }`
- ✅ Params are awaited: `const { id } = await params;`

**No action needed** - this is correctly implemented.

### React 19 Compatibility
**Status:** ✅ **GOOD** - No deprecated patterns found

The codebase uses modern React patterns:
- ✅ No `propTypes` usage (using TypeScript instead)
- ✅ No `defaultProps` (using ES6 default parameters)
- ✅ No legacy Context API
- ✅ No string refs
- ✅ Using `next/navigation` (correct for App Router)

**No action needed** - code is React 19 compatible.

### ESLint Configuration
**Status:** ✅ **GOOD** - Using modern ESLint 9 flat config format

The `eslint.config.mjs` correctly uses the new ESLint 9 configuration format.

### Next.js Configuration
**Status:** ✅ **GOOD** - Configuration looks correct

The `next.config.ts` properly uses:
- `output: 'standalone'` for deployment
- `serverExternalPackages` for Supabase

## 📋 Recommended Action Plan

### Priority 1 (CRITICAL - Fix Immediately)
1. 🔴 **UPGRADE MULTER** - `server/package.json`: `^1.4.5-lts.1` → `^2.0.2`
   - Multiple CVEs affecting current version
   - Review breaking changes in Multer 2.x migration guide

### Priority 2 (HIGH - Update Soon)
2. ⚠️ **UPDATE PUPPETEER** - Both client and server: `^24.26.1` → `^24.32.1`
   - Security vulnerabilities in dependencies
3. ⚠️ **UPDATE SUPABASE CLIENT** - Both client and server: `^2.76.1` → `^2.87.1`
   - Minor updates available

### Priority 3 (Important - Review and Update)
4. ⚠️ **UPDATE REACT** - Client: `19.2.0` → `19.2.1` (patch release)
5. ⚠️ **UPDATE SHARP** - Both: `^0.34.4` → `^0.34.5` (patch release)
6. ⚠️ **REVIEW UUID UPDATE** - Both: `^11.0.5` → `^13.0.0` (major version)
   - Test thoroughly or consider native `crypto.randomUUID()`

### Priority 4 (Nice to Have)
7. 💡 Update other minor dependencies (axios, lucide-react, react-hook-form, etc.)
8. 💡 Review Express 5.x upgrade (major version, breaking changes)
9. 💡 Review dotenv 17.x upgrade (major version, breaking changes)

## 🔧 Quick Fix Commands

```bash
# CRITICAL: Fix Multer security vulnerabilities
cd server
npm install multer@^2.0.2

# HIGH: Update Puppeteer (security)
cd server
npm install puppeteer@^24.32.1
cd ../client
npm install puppeteer@^24.32.1

# Update Supabase client
cd server
npm install @supabase/supabase-js@^2.87.1
cd ../client
npm install @supabase/supabase-js@^2.87.1

# Update React (patch)
cd client
npm install react@19.2.1 react-dom@19.2.1

# Update Sharp (patch)
cd server
npm install sharp@^0.34.5
cd ../client
npm install sharp@^0.34.5

# Review UUID update (major version - test first!)
cd server
npm install uuid@^13.0.0
cd ../client
npm install uuid@^13.0.0
```

## 🔍 Security Audit Results

### Client
- ✅ **No vulnerabilities found** (as of last audit)

### Server
- ⚠️ **High severity**: puppeteer (via @puppeteer/browsers and tar-fs)
- ⚠️ **Moderate severity**: js-yaml (indirect dependency)
- 🔴 **CRITICAL**: multer (multiple CVEs - see above)

## 📚 References

- [Multer Security Advisories](https://github.com/expressjs/multer/security/advisories)
- [Multer 2.x Migration Guide](https://github.com/expressjs/multer/blob/master/CHANGELOG.md)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [UUID Package on npm](https://www.npmjs.com/package/uuid)
- [UUID v13 Release Notes](https://github.com/uuidjs/uuid/releases)
- [Node.js crypto.randomUUID()](https://nodejs.org/api/crypto.html#cryptorandomuuidoptions)
- [Express 5.x Migration Guide](https://github.com/expressjs/express/blob/master/History.md)

---

**Report Generated:** January 2025  
**Codebase Version:** As of current git state  
**Next Review:** After critical security updates are applied
