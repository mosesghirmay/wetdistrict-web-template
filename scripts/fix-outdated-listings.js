#!/usr/bin/env node
/**
 * Finds listings whose unitType is outdated ("hour") and patches them to
 * the current listing type config: listingType="daily", unitType="fixed",
 * transactionProcessAlias="default-booking/release-1".
 *
 * Usage:
 *   node scripts/fix-outdated-listings.js           # dry-run
 *   node scripts/fix-outdated-listings.js --apply   # actually update
 */

const CLIENT_ID     = '587110d0-f5c3-4c4e-b8fd-247cf98563d8';
const CLIENT_SECRET = '5fe4d4dadf2b1d5b7a4302253ad21e735445b8b8';

const INTEG_API = 'https://flex-integ-api.sharetribe.com/v1/integration_api';
const AUTH_URL  = 'https://flex-integ-api.sharetribe.com/v1/auth/token';

const DRY_RUN = !process.argv.includes('--apply');

// ── Target listing type config (current Console configuration) ────────────────
const TARGET = {
  listingType:              'daily',
  transactionProcessAlias:  'default-booking/release-1',
  unitType:                 'fixed',
};

// ── Auth ──────────────────────────────────────────────────────────────────────
async function getToken() {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'integ',
    }).toString(),
  });
  if (!res.ok) throw new Error(`Auth failed (${res.status}): ${await res.text()}`);
  return (await res.json()).access_token;
}

// ── Fetch all listings (paginated) ────────────────────────────────────────────
async function getAllListings(token) {
  const listings = [];
  let page = 1;

  while (true) {
    const url = `${INTEG_API}/listings/query?page=${page}&perPage=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`listings/query failed (${res.status}): ${await res.text()}`);

    const data  = await res.json();
    const items = data.data || [];
    listings.push(...items);

    const total = data.meta?.totalItems ?? '?';
    console.log(`  Page ${page}: ${items.length} listings (${listings.length} / ${total} total)`);

    if (items.length < 100 || listings.length >= (data.meta?.totalItems || 0)) break;
    page++;
  }

  return listings;
}

// ── Patch publicData on a single listing ──────────────────────────────────────
async function patchListing(token, id, publicDataPatch) {
  const res = await fetch(`${INTEG_API}/listings/update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, publicData: publicDataPatch }),
  });
  if (!res.ok) throw new Error(`update failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY_RUN
    ? '🔍  DRY RUN — pass --apply to update listings\n'
    : '🚀  APPLY MODE — updating listings\n'
  );
  console.log(`Target config: listingType="${TARGET.listingType}" alias="${TARGET.transactionProcessAlias}" unitType="${TARGET.unitType}"\n`);

  console.log('Authenticating...');
  const token = await getToken();
  console.log('Authenticated.\n');

  console.log('Fetching all listings...');
  const listings = await getAllListings(token);
  console.log(`\nTotal listings: ${listings.length}\n`);

  const outdated = [];

  for (const listing of listings) {
    const attrs = listing.attributes || {};
    const pd    = attrs.publicData || {};
    const title = attrs.title || '(no title)';
    const state = attrs.state || 'unknown';

    const needsUpdate =
      pd.listingType !== TARGET.listingType ||
      pd.transactionProcessAlias !== TARGET.transactionProcessAlias ||
      pd.unitType !== TARGET.unitType;

    if (needsUpdate) {
      outdated.push(listing);
      console.log(`  ❌ [${state}] ${title}`);
      console.log(`        id:   ${listing.id}`);
      console.log(`        from: listingType="${pd.listingType}" alias="${pd.transactionProcessAlias}" unitType="${pd.unitType}"`);
      console.log(`        to:   listingType="${TARGET.listingType}" alias="${TARGET.transactionProcessAlias}" unitType="${TARGET.unitType}"`);
    } else {
      console.log(`  ✅ [${state}] ${title} — already current`);
    }
  }

  console.log(`\nSummary: ${outdated.length} outdated, ${listings.length - outdated.length} up to date\n`);

  if (outdated.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  if (DRY_RUN) {
    console.log('Dry run complete. Run with --apply to update these listings.');
    return;
  }

  console.log('Updating...\n');
  let ok = 0, fail = 0;

  for (const listing of outdated) {
    const title = listing.attributes?.title || '(no title)';
    try {
      await patchListing(token, listing.id, TARGET);
      console.log(`  ✅  ${title}`);
      ok++;
    } catch (err) {
      console.error(`  ❌  ${title} — ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone. ${ok} updated, ${fail} failed.`);
  if (ok > 0) console.log('✨ These listings should now be editable again.');
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
