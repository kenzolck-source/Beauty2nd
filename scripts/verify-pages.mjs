import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/End User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright");

const base = process.env.BASE_URL || "http://localhost:4173";
const outDir = join(process.cwd(), "artifacts", "screenshots");
const errors = [];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});

const routes = [
  ["/", "home"],
  ["/listings", "listings"],
  ["/listing/62", "detail"],
  ["/listings/create", "create"],
  ["/dashboard", "dashboard"],
  ["/admin", "admin"],
  ["/contact", "contact"],
];

for (const [path, name] of routes) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
}

await page.setViewportSize({ width: 390, height: 844 });
for (const [path, name] of [["/", "mobile-home"], ["/listings", "mobile-listings"], ["/listing/62", "mobile-detail"]]) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) errors.push(`${name} has horizontal overflow of ${overflow}px.`);
}

await page.setViewportSize({ width: 1440, height: 980 });

await page.goto(`${base}/listings?search=Sofwave`, { waitUntil: "networkidle" });
const searchText = await page.locator(".market-results").innerText();
if (!searchText.includes("Sofwave")) errors.push("Sofwave search result did not render.");

await page.goto(`${base}/listing/62`, { waitUntil: "networkidle" });
await page.getByText("聯絡賣家詢問").click();
await page.locator('input[name="name"]').fill("測試用戶");
await page.locator('input[name="phone"]').fill("9123 4567");
await page.locator('textarea[name="message"]').fill("請問儀器狀況是否可以安排睇機？");
await page.getByText("發送詢問").last().click();
if (!(await page.getByText("詢問已發送").isVisible())) errors.push("Inquiry success message did not render.");

await page.goto(`${base}/admin/listings`, { waitUntil: "networkidle" });
const adminText = await page.locator(".admin-content").innerText();
if (!adminText.includes("商品管理")) errors.push("Admin listings page did not render.");

await browser.close();

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Visual verification passed. Screenshots saved to ${outDir}`);
