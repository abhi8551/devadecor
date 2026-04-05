#!/usr/bin/env node
/**
 * Amazon Product Advertising API (PA-API 5.0) — Price Refresh Script
 *
 * Prerequisites:
 *   1. Sign up at https://affiliate-program.amazon.com
 *   2. Request PA-API access from the Associates dashboard
 *   3. Create a .env file in /tools with:
 *        PAAPI_ACCESS_KEY=your_access_key
 *        PAAPI_SECRET_KEY=your_secret_key
 *        PAAPI_PARTNER_TAG=devadecor-20
 *        PAAPI_HOST=webservices.amazon.com
 *        PAAPI_REGION=us-east-1
 *
 * Usage:
 *   cd tools && npm install && node refresh-prices.js
 *
 * What it does:
 *   - Reads ASINs from ../js/app.js
 *   - Calls PA-API GetItems for current prices
 *   - Writes updated prices and PRICES_UPDATED timestamp back to app.js
 *   - Rate-limited to 1 request per second (PA-API TPS limit)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

require('dotenv').config();

const {
  PAAPI_ACCESS_KEY,
  PAAPI_SECRET_KEY,
  PAAPI_PARTNER_TAG,
  PAAPI_HOST = 'webservices.amazon.com',
  PAAPI_REGION = 'us-east-1',
} = process.env;

if (!PAAPI_ACCESS_KEY || !PAAPI_SECRET_KEY || !PAAPI_PARTNER_TAG) {
  console.error('Missing PA-API credentials. Create a .env file — see script header for details.');
  process.exit(1);
}

const APP_JS = path.join(__dirname, '..', 'js', 'app.js');

function extractASINs(src) {
  const re = /asin:\s*'([A-Z0-9]{10})'/g;
  const asins = [];
  let m;
  while ((m = re.exec(src)) !== null) asins.push(m[1]);
  return [...new Set(asins)];
}

function sign(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function getSignatureKey(key, dateStamp, region, service) {
  let k = sign('AWS4' + key, dateStamp);
  k = sign(k, region);
  k = sign(k, service);
  k = sign(k, 'aws4_request');
  return k;
}

function callPAAPI(asins) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      ItemIds: asins,
      Resources: [
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'ItemInfo.Title',
      ],
      PartnerTag: PAAPI_PARTNER_TAG,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com',
    });

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const service = 'ProductAdvertisingAPI';
    const endpoint = '/paapi5/getitems';

    const headers = {
      'content-type': 'application/json; charset=utf-8',
      'content-encoding': 'amz-1.0',
      host: PAAPI_HOST,
      'x-amz-date': amzDate,
      'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
    };

    const signedHeaders = Object.keys(headers).sort().join(';');
    const canonicalRequest = [
      'POST', endpoint, '',
      Object.keys(headers).sort().map(k => k + ':' + headers[k]).join('\n'),
      '', signedHeaders,
      crypto.createHash('sha256').update(payload).digest('hex'),
    ].join('\n');

    const credentialScope = `${dateStamp}/${PAAPI_REGION}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256', amzDate, credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = getSignatureKey(PAAPI_SECRET_KEY, dateStamp, PAAPI_REGION, service);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${PAAPI_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const req = https.request({
      hostname: PAAPI_HOST,
      path: endpoint,
      method: 'POST',
      headers,
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`PA-API ${res.statusCode}: ${body}`));
        resolve(JSON.parse(body));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const src = fs.readFileSync(APP_JS, 'utf-8');
  const asins = extractASINs(src);
  console.log(`Found ${asins.length} ASINs in app.js`);

  const priceMap = {};
  const BATCH = 10;
  for (let i = 0; i < asins.length; i += BATCH) {
    const batch = asins.slice(i, i + BATCH);
    console.log(`  Fetching batch ${Math.floor(i / BATCH) + 1}: ${batch.join(', ')}`);
    try {
      const data = await callPAAPI(batch);
      if (data.ItemsResult && data.ItemsResult.Items) {
        for (const item of data.ItemsResult.Items) {
          const listing = item.Offers?.Listings?.[0];
          if (listing) {
            priceMap[item.ASIN] = {
              price: listing.Price?.Amount,
              comparePrice: listing.SavingBasis?.Amount || null,
            };
          }
        }
      }
    } catch (err) {
      console.error(`  Error for batch: ${err.message}`);
    }
    if (i + BATCH < asins.length) await sleep(1100);
  }

  const updates = Object.keys(priceMap).length;
  if (updates === 0) {
    console.log('No prices fetched. Check credentials and ASIN validity.');
    return;
  }

  let updated = src;
  for (const [asin, prices] of Object.entries(priceMap)) {
    if (prices.price) {
      const priceRe = new RegExp(`(asin:\\s*'${asin}'[^}]*price:\\s*)\\d+(\\.\\d+)?`);
      updated = updated.replace(priceRe, `$1${Math.round(prices.price)}`);
    }
    if (prices.comparePrice) {
      const compRe = new RegExp(`(asin:\\s*'${asin}'[^}]*comparePrice:\\s*)\\d+`);
      updated = updated.replace(compRe, `$1${Math.round(prices.comparePrice)}`);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  updated = updated.replace(/PRICES_UPDATED\s*=\s*'[^']*'/, `PRICES_UPDATED = '${today}'`);

  fs.writeFileSync(APP_JS, updated, 'utf-8');
  console.log(`\nDone — updated ${updates} product prices. PRICES_UPDATED → ${today}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
