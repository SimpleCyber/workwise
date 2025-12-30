const fs = require("fs");
const path = require("path");
const envPath = path.resolve(process.cwd(), ".env.local");
const content = fs.readFileSync(envPath, "utf8");
const lines = content.split("\n");
const uriLine = lines.find((l) => l.trim().startsWith("GOOGLE_REDIRECT_URI"));
console.log("URI CONFIG:", uriLine ? uriLine.trim() : "NOT FOUND");
