// Loaded via `node -r` before any other module, so .env.local is populated
// before scripts import from lib/ (several of those modules read
// process.env as soon as they're imported, and `import` declarations are
// hoisted above a script's own top-level code, so loading dotenv from
// inside the script itself would run too late).
require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env.local") });
