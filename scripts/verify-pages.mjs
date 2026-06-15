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
  ["/listings/create", "sell"],
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

await page.goto(`${base}/`, { waitUntil: "networkidle" });
const homeCardWhatsappCount = await page.locator(".section .listing-grid .listing-bottom a.whatsapp").count();
if (homeCardWhatsappCount !== 0) errors.push("Homepage latest listing cards should not show WhatsApp CTAs.");
const homeCardImageConditionCount = await page.locator(".section .listing-grid .listing-image .condition").count();
if (homeCardImageConditionCount !== 0) errors.push("Homepage latest listing card images should not show top-left condition tags.");
const homeDetailLinks = await page.locator(".section .listing-grid .listing-bottom a").allTextContents();
if (!homeDetailLinks.some((text) => text.includes("查看詳情"))) errors.push("Homepage latest listing cards should guide users to detail pages.");

await page.goto(`${base}/listings?search=Sofwave`, { waitUntil: "networkidle" });
const searchText = await page.locator(".market-results").innerText();
if (!searchText.includes("Sofwave")) errors.push("Sofwave search result did not render.");
const conditionOptions = await page.locator(".filters select").allTextContents();
if (!conditionOptions.join(" ").includes("接近全新") || !conditionOptions.join(" ").includes("九成九新")) {
  errors.push("Condition filter should include 接近全新 and 九成九新.");
}

await page.goto(`${base}/listing/62`, { waitUntil: "networkidle" });
const detailBody = await page.locator("body").innerText();
if (detailBody.includes("HK$") || detailBody.includes("購買年份") || detailBody.includes("所在地區")) {
  errors.push("Public detail page should not display price, purchase year, or region.");
}
if (!detailBody.includes("持專業認可牌照的工程人員完成檢查、清潔翻新及基本功能測試")) {
  errors.push("Detail assurance sentence did not render.");
}
const detailWhatsapp = await page.locator(".detail-actions a.whatsapp").getAttribute("href");
if (!detailWhatsapp?.includes("wa.me/85291234567") || !detailWhatsapp.includes(encodeURIComponent("你好，我想查詢 HKMAEX 上的儀器"))) {
  errors.push("Detail WhatsApp CTA does not include the expected phone number and prefilled message.");
}

await page.goto(`${base}/listings/create`, { waitUntil: "networkidle" });
const sellText = await page.locator("body").innerText();
for (const phrase of ["WhatsApp 初步諮詢", "專業上門檢查", "回收或代售方案", "清潔翻新處理", "檢測報告建立", "專業估價", "上架 HKMAEX"]) {
  if (!sellText.includes(phrase)) errors.push(`Sell SOP missing: ${phrase}`);
}
if (sellText.includes("售價") || sellText.includes("提交刊登")) errors.push("Sell page should not show the old listing form.");

await page.goto(`${base}/admin/listings`, { waitUntil: "networkidle" });
const adminText = await page.locator(".admin-content").innerText();
if (!adminText.includes("商品管理")) errors.push("Admin listings page did not render.");

await browser.close();

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Visual verification passed. Screenshots saved to ${outDir}`);
