# Archived Test Files

These test files have been archived because their functionality is now available through app-cli:

## Archived Files & App-CLI Equivalents

### Database & User Testing
- `check-db-users.js` → `npm run app:cli -- --command "db user findMany"`
- User status checks → `npm run app:cli -- --command "db user count"`

### Authentication Testing
- `test-auth.js` → `npm run app:cli -- --command "login <email> <password> <role>"`
- `test-session-debug.js` → `npm run app:cli -- --command "whoami"`
- `test-nextauth-*` → `npm run app:cli -- --command "get /api/auth/session"`

### API Testing
- `test-proposals-tags.js` → `npm run app:cli -- --command "get /api/proposals?limit=5"`
- `test-customers-fix.js` → `npm run app:cli -- --command "get /api/customers?limit=3"`
- `test-products-fix.js` → `npm run app:cli -- --command "get /api/products?limit=3"`

### Schema Validation
- All schema-related tests → `npm run app:cli -- --command "schema check"`

## Benefits of App-CLI Migration

1. **Centralized Testing**: All tests in one interactive tool
2. **Session Management**: Automatic cookie/session handling
3. **Interactive Mode**: Better debugging and exploration
4. **Consistent Interface**: Same commands across all environments
5. **Rich Output**: Better formatting and error reporting
6. **Maintenance**: Single tool to maintain instead of many scripts

## Usage Examples

```bash
# Interactive mode
npm run app:cli

# Direct commands
npm run app:cli -- --command "db user findMany"
npm run app:cli -- --command "login admin@posalpro.com 'password' 'System Administrator'"
npm run app:cli -- --command "schema check"
```

## Files Archived
- `check-db-users.js`
- `test-auth.js`
- `test-proposals-tags.js`
- `test-customers-fix.js`
- `test-products-fix.js`
- `test-simple-proposal.js`
- `test-session-debug.js`
- `test-nextauth-direct.js`
- `test-nextauth-env.js`
- `test-auth-debug.js`
- `test-eye-icon-functionality.js`
