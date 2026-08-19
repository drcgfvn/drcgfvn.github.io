const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'assets', 'js', 'tai-lieu-data.js');
const RESOURCE_ROOT = path.join(ROOT, 'tai-lieu');
const MANIFEST_DIR = path.join(ROOT, 'assets', 'data');
const MANIFEST_FILE = path.join(MANIFEST_DIR, 'tai-lieu-files.json');

const imageExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);
const fileExt = new Set(['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx', '.zip']);

function encodePart(name){ return encodeURIComponent(name); }

// Quét đệ quy: ảnh/file nằm trong thư mục con của img/files cũng được lấy.
function walk(dir, allowed, rel = '') {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    const nextRel = rel ? path.posix.join(rel, entry.name) : entry.name;
    if (entry.isDirectory()) out.push(...walk(abs, allowed, nextRel));
    else if (entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase())) out.push(nextRel);
  }
  return out.sort((a,b)=>a.localeCompare(b,'vi',{numeric:true,sensitivity:'base'}));
}
function toUrl(slug, sub, relPath) {
  return '../tai-lieu/' + encodePart(slug) + '/' + sub + '/' + relPath.split('/').map(encodePart).join('/');
}

const source = fs.readFileSync(DATA_FILE, 'utf8');
const match = source.match(/window\.DRCGF_RESOURCE_DATA\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (!match) throw new Error('Không đọc được DRCGF_RESOURCE_DATA trong ' + DATA_FILE);
const data = JSON.parse(match[1]);
const manifest = { generatedAt: new Date().toISOString(), resources: {} };
let imageCount=0, fileCount=0;
for (const item of data) {
  const base = path.join(RESOURCE_ROOT, item.slug);
  const imgs = walk(path.join(base, 'img'), imageExt);
  const files = walk(path.join(base, 'files'), fileExt);
  manifest.resources[item.slug] = {
    images: imgs.map(name => toUrl(item.slug, 'img', name)),
    files: files.map(name => toUrl(item.slug, 'files', name))
  };
  imageCount += imgs.length; fileCount += files.length;
}
fs.mkdirSync(MANIFEST_DIR,{recursive:true});
fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest,null,2)+'\n');
console.log(`Đã quét thực tế ${imageCount} ảnh và ${fileCount} tài liệu -> assets/data/tai-lieu-files.json`);
