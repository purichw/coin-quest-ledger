import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ASSET_EXTENSIONS = new Set(['.png', '.webp', '.svg', '.jpg', '.jpeg']);
const DEFAULT_PREFIX = 'coin-quest-ledger';
const MANIFEST_PATH = path.join(process.cwd(), 'shared', 'cloudinary-assets.js');

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (arg === '--dry-run') acc.dryRun = true;
    else if (arg.startsWith('--prefix=')) acc.prefix = arg.slice('--prefix='.length).replace(/^\/+|\/+$/g, '');
    else if (arg.startsWith('--manifest=')) acc.manifest = arg.slice('--manifest='.length);
    return acc;
  }, { dryRun: false, prefix: DEFAULT_PREFIX, manifest: MANIFEST_PATH });
}

function cloudinaryConfig() {
  if (process.env.CLOUDINARY_URL) {
    const parsed = new URL(process.env.CLOUDINARY_URL);
    return {
      cloudName: parsed.hostname,
      apiKey: decodeURIComponent(parsed.username),
      apiSecret: decodeURIComponent(parsed.password),
    };
  }
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
}

function listAssets(dir = 'assets') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listAssets(full));
    else if (ASSET_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out.sort();
}

function publicIdFor(file, prefix) {
  const withoutExt = file.slice(0, -path.extname(file).length).replaceAll(path.sep, '/');
  return `${prefix}/${withoutExt}`;
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'image/png';
}

function sign(params, apiSecret) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return crypto.createHash('sha1').update(payload + apiSecret).digest('hex');
}

async function upload(file, publicId, config) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  };
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(file)], { type: mimeFor(file) }), path.basename(file));
  form.append('api_key', config.apiKey);
  Object.entries(signed).forEach(([key, value]) => form.append(key, String(value)));
  form.append('signature', sign(signed, config.apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${file}: ${data.error?.message || res.statusText}`);
  return data.secure_url;
}

function writeManifest(target, manifest) {
  const body = `window.POINTY_CLOUDINARY_ASSETS = ${JSON.stringify(manifest, null, 2)};\n`;
  fs.writeFileSync(target, body);
}

const args = parseArgs(process.argv.slice(2));
const assets = listAssets();

if (args.dryRun) {
  assets.forEach(file => console.log(`${file} -> ${publicIdFor(file, args.prefix)}`));
  console.log(`Dry run: ${assets.length} asset(s).`);
  process.exit(0);
}

const config = cloudinaryConfig();
const missing = Object.entries(config).filter(([, value]) => !value).map(([key]) => key);
if (missing.length) {
  console.error(`Missing Cloudinary config: ${missing.join(', ')}`);
  console.error('Set CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>');
  process.exit(1);
}

const manifest = {};
for (const file of assets) {
  const publicId = publicIdFor(file, args.prefix);
  process.stdout.write(`Uploading ${file} ... `);
  const url = await upload(file, publicId, config);
  manifest[file.replaceAll(path.sep, '/')] = url;
  process.stdout.write('done\n');
}

writeManifest(args.manifest, manifest);
console.log(`Uploaded ${assets.length} asset(s).`);
console.log(`Wrote ${args.manifest}`);
