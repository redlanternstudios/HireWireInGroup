import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const root = process.cwd()
const apiRoot = join(root, "app", "api")
const buildApiRoot = join(root, ".next", "server", "app", "api")
const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]

function walk(dir) {
  return readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const routeFiles = walk(apiRoot).filter(file => file.endsWith("/route.ts"))
const failures = []

for (const routeFile of routeFiles) {
  const routePath = relative(apiRoot, routeFile)
  const builtRoute = join(buildApiRoot, routePath.replace(/\.ts$/, ".js"))
  const source = readFileSync(routeFile, "utf8")
  const exportedMethods = httpMethods.filter(method =>
    new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b|export\\s+const\\s+${method}\\b`).test(source)
  )

  if (exportedMethods.length === 0) {
    failures.push(`${routePath}: no HTTP method export found`)
  }

  if (!existsSync(builtRoute)) {
    failures.push(`${routePath}: missing build artifact at ${relative(root, builtRoute)}`)
  }
}

if (failures.length > 0) {
  console.error(`API route coverage failed for ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`API route coverage passed for ${routeFiles.length} route files.`)
