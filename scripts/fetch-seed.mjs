import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { basename, join } from "node:path";

const base = "https://yisouwang-t7efbd3v.manus.space";
const root = process.cwd();
const importedDir = join(root, "assets", "imported");
const vendorDir = join(root, "vendor");
const dataDir = join(root, "src", "data");
const heroSource =
  "C:/Users/End User/.codex/generated_images/019eb268-0d0a-7fb0-b2c4-e320a73f7f44/ig_03d10f6c7b8a30e5016a2994b75e688191838ba12c1b313c7e.png";

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchJson(path) {
  const text = await fetchText(`${base}${path}`);
  return JSON.parse(text).result.data.json;
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, buffer);
}

function localAssetPath(remotePath) {
  if (!remotePath) return "";
  if (remotePath.startsWith("http")) return remotePath;
  return `/assets/imported/${basename(remotePath)}`;
}

function normalizeListing(listing) {
  const images = (listing.images || []).map((image) => ({
    ...image,
    imageUrl: localAssetPath(image.imageUrl),
  }));

  return {
    ...listing,
    price: Number(listing.price),
    featuredImageUrl: localAssetPath(listing.featuredImageUrl),
    images,
  };
}

async function main() {
  await mkdir(importedDir, { recursive: true });
  await mkdir(vendorDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });

  const input = encodeURIComponent(JSON.stringify({ json: { page: 1, pageSize: 100, sortBy: "newest" } }));
  const [categories, listingPayload, platformStats] = await Promise.all([
    fetchJson("/api/trpc/categories.list"),
    fetchJson(`/api/trpc/listings.list?input=${input}`),
    fetchJson("/api/trpc/listings.platformStats"),
  ]);

  const listings = listingPayload.items.map(normalizeListing);
  const uniqueAssets = new Set();
  for (const listing of listingPayload.items) {
    if (listing.featuredImageUrl?.startsWith("/")) uniqueAssets.add(listing.featuredImageUrl);
    for (const image of listing.images || []) {
      if (image.imageUrl?.startsWith("/")) uniqueAssets.add(image.imageUrl);
    }
  }
  uniqueAssets.add("/manus-storage/logo-v1_22c42557.png");

  for (const assetPath of uniqueAssets) {
    await download(`${base}${assetPath}`, join(importedDir, basename(assetPath)));
  }

  await Promise.all([
    download("https://unpkg.com/react@18/umd/react.production.min.js", join(vendorDir, "react.production.min.js")),
    download("https://unpkg.com/react-dom@18/umd/react-dom.production.min.js", join(vendorDir, "react-dom.production.min.js")),
    download("https://unpkg.com/htm@3.1.1/dist/htm.umd.js", join(vendorDir, "htm.umd.js")),
    copyFile(heroSource, join(root, "assets", "hero-image2.png")),
  ]);

  const source = `export const categories = ${JSON.stringify(categories, null, 2)};\n\nexport const listings = ${JSON.stringify(listings, null, 2)};\n\nexport const platformStats = ${JSON.stringify(platformStats, null, 2)};\n`;
  await writeFile(join(dataDir, "seed.js"), source, "utf8");

  console.log(JSON.stringify({
    categories: categories.length,
    listings: listings.length,
    importedAssets: uniqueAssets.size,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
