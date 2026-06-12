import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const seed = await import("../src/data/seed.js");

const requiredFiles = [
  "index.html",
  "404.html",
  "src/main.js",
  "src/styles.css",
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
for (const token of ["ListingDetail", "CreateListing", "AdminDashboard", "ContactPage", "filterListings", "BrandLogo", "hero-ocean-dark-image2"]) {
  if (!app.includes(token)) failures.push(`Missing app token ${token}`);
}
if (app.includes("logo-v1_22c42557.png")) failures.push("App should use the redesigned SVG logo, not the old imported logo image.");

const html = await readFile("index.html", "utf8");
if (html.includes('href="/src/') || html.includes('src="/vendor/') || html.includes('src="/src/')) {
  failures.push("index.html should use relative asset paths for GitHub Pages subfolder deployment.");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Smoke test passed: seed data, core files, and route components are present.");
