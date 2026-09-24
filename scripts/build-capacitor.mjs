// Post-build: turn the Nitro SSR build into a Capacitor-compatible static shell.
//
// Capacitor always loads from `.output/public` (see capacitor.config.ts).
// This script:
//   1. Detects the Nitro build root by locating its `nitro.json` manifest.
//   2. Reads `serverEntry` / `publicDir` from that manifest (no hardcoded paths).
//   3. Normalizes the static assets into `.output/public` when Nitro emitted them elsewhere.
//   4. Renders "/" through the built server bundle into `.output/public/index.html`.
//
// The application architecture is untouched — the SSR build is still emitted for deployment.

import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetPublicDir = path.join(root, ".output", "public");

// Nitro build roots, most recent convention first.
const BUILD_ROOTS = [".output", "build", "dist"];

function findBuildRoot() {
  for (const candidate of BUILD_ROOTS) {
    const dir = path.join(root, candidate);
    if (existsSync(path.join(dir, "nitro.json"))) return dir;
  }
  return undefined;
}

const buildRoot = findBuildRoot();
if (!buildRoot) {
  console.error(
    "[build-capacitor] No Nitro build found (looked for nitro.json in: " +
      BUILD_ROOTS.join(", ") +
      "). Run `vite build` first.",
  );
  process.exit(1);
}

const manifest = JSON.parse(await readFile(path.join(buildRoot, "nitro.json"), "utf8"));
const serverEntry = path.join(buildRoot, manifest.serverEntry ?? "server/index.mjs");
const sourcePublicDir = path.join(buildRoot, manifest.publicDir ?? "public");

if (!existsSync(serverEntry)) {
  console.error("[build-capacitor] Missing Nitro server entry:", serverEntry);
  process.exit(1);
}
if (!existsSync(sourcePublicDir)) {
  console.error("[build-capacitor] Missing Nitro public dir:", sourcePublicDir);
  process.exit(1);
}

console.log(
  "[build-capacitor] Detected Nitro output at",
  path.relative(root, buildRoot) || ".",
  "(entry:",
  path.relative(buildRoot, serverEntry) + ")",
);

// 1) Ensure the static assets live at .output/public
if (path.resolve(sourcePublicDir) !== path.resolve(targetPublicDir)) {
  await mkdir(targetPublicDir, { recursive: true });
  for (const entry of await readdir(sourcePublicDir)) {
    const src = path.join(sourcePublicDir, entry);
    const dest = path.join(targetPublicDir, entry);
    const s = await stat(src);
    if (s.isDirectory()) {
      await rm(dest, { recursive: true, force: true });
      await cp(src, dest, { recursive: true });
    } else {
      await cp(src, dest);
    }
  }
}

// 2) Render "/" through the Nitro server bundle into a static index.html
const mod = await import(pathToFileURL(serverEntry).href);
const handler = mod.default ?? mod;
if (typeof handler?.fetch !== "function") {
  console.error("[build-capacitor] Server bundle does not export a fetch handler.");
  process.exit(1);
}

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
const env = { ASSETS: { fetch: () => new Response("", { status: 404 }) } };
const response = await handler.fetch(new Request("http://localhost/"), env, ctx);
if (!response.ok) {
  console.error("[build-capacitor] SSR of / returned", response.status);
  process.exit(1);
}
const html = await response.text();

// Asset URLs like /assets/... stay absolute; Capacitor serves the webDir root as /.
await mkdir(targetPublicDir, { recursive: true });
await writeFile(path.join(targetPublicDir, "index.html"), html, "utf8");

console.log("[build-capacitor] Wrote .output/public/index.html (" + html.length + " bytes)");
console.log("[build-capacitor] Generated public .output/public");
console.log("[build-capacitor] Capacitor webDir: .output/public");
