import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const seed = await import("../src/data/seed.js");

const requiredFiles = [
  "index.html",
  "404.html",
  "src/main.js",
  "src/styles.css",
  "assets/hkmaex-logo-mark.svg",
  "assets/hkmaex-logo-image2-clean.png",
  "assets/hero-ocean-dark-image2.png",
  "assets/inspection-premium-image2.png",
  "assets/valuation-premium-image2.png",
  "vendor/react.production.min.js",
  "vendor/react-dom.production.min.js",
  "vendor/htm.umd.js",
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}
if (seed.categories.length !== 9) failures.push(`Expected 9 categories, got ${seed.categories.length}`);
if (seed.listings.length !== 62) failures.push(`Expected 62 listings, got ${seed.listings.length}`);
if (seed.platformStats.totalListings !== 62) failures.push("totalListings should be 62");
if (seed.platformStats.activeListings !== 62) failures.push("activeListings should be 62");
if (seed.platformStats.totalUsers !== 2) failures.push("totalUsers should be 2");
if (seed.listings.some((listing) => !listing.featuredImageUrl.startsWith("/assets/imported/"))) {
  failures.push("All listing featured images should use original imported photos.");
}

const app = await readFile("src/main.js", "utf8");
for (const token of ["HKMAEX", "SellInstrumentPage", "AdminDashboard", "ContactPage", "filterListings", "BrandLogo", "BrandMark", "hero-ocean-dark-image2", "WhatsApp 初步諮詢"]) {
  if (!app.includes(token)) failures.push(`Missing app token ${token}`);
}
if (!app.includes("hkmaex-logo-image2-clean.png")) failures.push("Public app should use the selected IMAGE2 logo PNG.");
if (app.includes("logo-v1_22c42557.png")) failures.push("App should use the redesigned SVG logo, not the old imported logo image.");
if (app.includes("hkmaex-logo-image2.png")) failures.push("Public app source should not use the AI-generated PNG logo.");
if (app.includes("易搜王")) failures.push("Public app source should not include the old brand name.");
if (app.includes("CreateListing")) failures.push("CreateListing flow should be replaced by the sell-instrument SOP page.");
if (app.includes("聯絡賣家詢問")) failures.push("Public detail page should not include the old in-app inquiry action.");
if (app.includes('href="/dashboard"') || app.includes("我的儀表板")) failures.push("Public customer dashboard entry should be removed.");
if (app.includes('value="price-asc"') || app.includes('value="price-desc"')) failures.push("Public listings should not expose price sorting.");

const html = await readFile("index.html", "utf8");
if (!html.includes("HKMAEX") || !html.includes("香港醫美儀器交易所")) failures.push("index.html should use the HKMAEX brand metadata.");
if (html.includes("易搜王") || html.includes("dashboard: true")) failures.push("index.html should not include old brand or dashboard app root.");
if (html.includes('href="/src/') || html.includes('src="/vendor/') || html.includes('src="/src/')) {
  failures.push("index.html should use relative asset paths for GitHub Pages subfolder deployment.");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Smoke test passed: seed data, core files, and route components are present.");
