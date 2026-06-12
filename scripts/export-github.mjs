import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const outDir = resolve(root, "docs");
const entries = ["index.html", "404.html", "assets", "src", "vendor"];

function assertInsideWorkspace(path) {
  const rel = relative(root, path);
  if (rel.startsWith("..") || rel === "" || rel.split(sep).includes("..")) {
    throw new Error(`Refusing to write outside workspace: ${path}`);
  }
}

assertInsideWorkspace(outDir);
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const entry of entries) {
  await cp(resolve(root, entry), resolve(outDir, entry), {
    recursive: true,
    force: true,
    verbatimSymlinks: false,
  });
}

await writeFile(resolve(outDir, ".nojekyll"), "");
await writeFile(
  resolve(outDir, "README.txt"),
  [
    "易搜王 GitHub Pages deploy folder",
    "",
    "GitHub Pages settings:",
    "Source: Deploy from a branch",
    "Branch: main",
    "Folder: /docs",
    "",
    "This is a static prototype. Search, favorites, inquiries, listing creation, and admin actions use browser localStorage.",
  ].join("\n"),
  "utf8",
);

console.log(`GitHub Pages export ready: ${outDir}`);
