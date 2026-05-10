import { readFileSync } from "node:fs"
import assert from "node:assert/strict"
import { test } from "bun:test"

const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8").replaceAll("\r\n", "\n")

test("release workflow is triggered by published GitHub Releases with Trusted Publisher permissions", () => {
  assert.match(workflow, /^on:\n\s+release:\n\s+types:\s+\[published\]/m)
  assert.match(workflow, /^permissions:\n\s+contents:\s+read\n\s+id-token:\s+write/m)
})

test("release workflow does not configure manual npm tokens", () => {
  assert.doesNotMatch(workflow, /NODE_AUTH_TOKEN|NPM_TOKEN|secrets\./)
})

test("release workflow installs Node 24 and Bun before running Bun tests", () => {
  assert.match(workflow, /uses:\s+actions\/setup-node@v4/)
  assert.match(workflow, /node-version:\s+24/)
  assert.match(workflow, /registry-url:\s+https:\/\/registry\.npmjs\.org/)
  assert.match(workflow, /run:\s+npm install -g npm@latest/)
  assert.match(workflow, /uses:\s+oven-sh\/setup-bun@v2/)
  assert.match(workflow, /run:\s+bun install --frozen-lockfile/)
  assert.match(workflow, /run:\s+bun test/)
  assert.match(workflow, /run:\s+rm -f \.npmrc/)
  assert.match(workflow, /env:\n\s+BUN_CONFIG_NO_VERIFY:\s+true/)
})

test("release workflow dry-runs the package and only publishes unpublished versions", () => {
  assert.match(workflow, /run:\s+npm pack --dry-run --json/)
  assert.match(workflow, /name:\s+Check if version already published[\s\S]*id:\s+npm[\s\S]*npm view "\$\{NAME\}@\$\{VERSION\}" version[\s\S]*published=true[\s\S]*published=false/)
  assert.match(workflow, /name:\s+Publish\n\s+if:\s+steps\.npm\.outputs\.published != 'true'\n\s+run:\s+npm publish --access public/)
})
