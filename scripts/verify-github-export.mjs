import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/End User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright");

const docs = resolve(process.cwd(), "docs");
const basePath = "/yisouwang-github";
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);

function resolveDocFile(url) {
  const parsed = new URL(url, "http://localhost");
  if (!parsed.pathname.startsWith(basePath)) return null;
  let rel = parsed.pathname.slice(basePath.length);
  if (!rel || rel === "/") rel = "/index.html";
  const clean = normalize(decodeURIComponent(rel)).replace(/^(\.\.[/\\])+/, "");
  const candidate = resolve(docs, clean.slice(1));
  if (candidate.startsWith(docs) && existsSync(candidate) && statSync(candidate).isFile()) {
    return { file: candidate, status: 200 };
  }
  return { file: join(docs, "404.html"), status: 404 };
}

const server = createServer((req, res) => {
  const result = resolveDocFile(req.url || "/");
  if (!result) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(result.status, {
    "Content-Type": mime.get(extname(result.file).toLowerCase()) || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(result.file).pipe(res);
});

await new Promise((resolveListen) => server.listen(0, resolveListen));
const port = server.address().port;
const origin = `http://localhost:${port}`;
const errors = [];

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
    errors.push(`console: ${message.text()}`);
  }
});
page.on("response", (response) => {
  if (response.status() < 400) return;
  const url = new URL(response.url());
  const path = url.pathname;
  const expectedSpaFallback =
    path === `${basePath}/listings` ||
    path === `${basePath}/listings/create` ||
    path.startsWith(`${basePath}/listing/`) ||
    path.startsWith(`${basePath}/admin`) ||
    path === `${basePath}/about` ||
    path === `${basePath}/contact`;
  if (!expectedSpaFallback) errors.push(`http ${response.status()}: ${response.url()}`);
});

await page.goto(`${origin}${basePath}/`, { waitUntil: "networkidle" });
if (!(await page.locator("body").innerText()).includes("香港醫美儀器交易所")) {
  errors.push("GitHub root route did not render homepage.");
}

await page.goto(`${origin}${basePath}/listings`, { waitUntil: "networkidle" });
await page.waitForURL(`**${basePath}/listings`);
const listingsText = await page.locator("body").innerText();
if (!listingsText.includes("全部儀器") || !listingsText.includes("62 件商品")) {
  errors.push("GitHub direct listings route did not render after 404 redirect.");
}
if (listingsText.includes("價格由低至高") || listingsText.includes("價格由高至低")) {
  errors.push("GitHub listings route should not expose price sorting.");
}
if ((await page.locator('img[src*="/yisouwang-github/assets/imported/"]').count()) < 1) {
  errors.push("Listing images were not resolved under the GitHub Pages subpath.");
}

await page.goto(`${origin}${basePath}/listing/62`, { waitUntil: "networkidle" });
await page.waitForURL(`**${basePath}/listing/62`);
const detailText = await page.locator("body").innerText();
if (!detailText.includes("商品描述")) errors.push("GitHub direct detail route did not render after 404 redirect.");
if (detailText.includes("HK$") || detailText.includes("購買年份") || detailText.includes("所在地區")) {
  errors.push("GitHub detail route should not expose price, purchase year, or region.");
}

await page.goto(`${origin}${basePath}/listings/create`, { waitUntil: "networkidle" });
await page.waitForURL(`**${basePath}/listings/create`);
const sellText = await page.locator("body").innerText();
if (!sellText.includes("WhatsApp 初步諮詢") || !sellText.includes("上架 HKMAEX")) {
  errors.push("GitHub direct sell route did not render the SOP page.");
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}${basePath}/listings`, { waitUntil: "networkidle" });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
if (overflow > 2) errors.push(`GitHub mobile listings has horizontal overflow of ${overflow}px.`);

await browser.close();
await new Promise((resolveClose) => server.close(resolveClose));

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`GitHub Pages export verification passed at ${origin}${basePath}/`);
