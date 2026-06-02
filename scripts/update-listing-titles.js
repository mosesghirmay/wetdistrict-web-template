#!/usr/bin/env node
/**
 * Updates all priceVariant names that say "Juneteenth Yacht Party" or
 * "Memorial Day Yacht Party" to "Juneteenth Yacht Party | Fri 6.19"
 *
 * Dry run (no changes): node scripts/update-listing-titles.js
 * Apply changes:        node scripts/update-listing-titles.js --apply
 */

const CLIENT_ID = '587110d0-f5c3-4c4e-b8fd-247cf98563d8';
const CLIENT_SECRET = '5fe4d4dadf2b1d5b7a4302253ad21e735445b8b8';
const INTEG_API = 'https://flex-integ-api.sharetribe.com/v1/integration_api';
const AUTH_URL = 'https://flex-integ-api.sharetribe.com/v1/auth/token';

const APPLY = process.argv.includes('--apply');
const NEW_NAME = 'Juneteenth Yacht Party | Fri 6.19';

function shouldRename(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.includes('juneteenth yacht party') || lower.includes('memorial day yacht party');
}

async function getToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'integ',
  });
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Auth failed (${res.status}): ${await res.text()}`);
  return (await res.json()).access_token;
}

async function getAllListings(token) {
  const listings = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${INTEG_API}/listings/query?page=${page}&perPage=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Query failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    listings.push(...data.data);
    if (data.data.length < 100) break;
    page++;
  }
  return listings;
}

async function updateListing(token, id, publicData) {
  const res = await fetch(`${INTEG_API}/listings/update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, publicData }),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status}): ${await res.text()}`);
}

(async () => {
  console.log(APPLY ? '🚀 Applying changes...\n' : '🔍 Dry run — pass --apply to save changes\n');
  const token = await getToken();
  const listings = await getAllListings(token);
  console.log(`Fetched ${listings.length} listings\n`);

  let updatedCount = 0;

  for (const listing of listings) {
    const variants = listing.attributes?.publicData?.priceVariants;
    if (!Array.isArray(variants)) continue;

    const needsChange = variants.some(v => shouldRename(v.name));
    if (!needsChange) continue;

    const updatedVariants = variants.map(v =>
      shouldRename(v.name) ? { ...v, name: NEW_NAME } : v
    );

    console.log(`  [${listing.id.uuid}] "${listing.attributes.title}"`);
    variants.forEach((v, i) => {
      if (shouldRename(v.name)) {
        console.log(`    variant[${i}]: "${v.name}" → "${NEW_NAME}"`);
      }
    });

    if (APPLY) {
      await updateListing(token, listing.id, { priceVariants: updatedVariants });
      console.log(`    ✅ saved`);
    }
    updatedCount++;
  }

  if (updatedCount === 0) {
    console.log('No matching variants found.');
  } else {
    console.log(`\n${APPLY ? `Updated ${updatedCount} listing(s).` : `${updatedCount} listing(s) would be updated. Run with --apply to save.`}`);
  }
})().catch(err => { console.error(err); process.exit(1); });
