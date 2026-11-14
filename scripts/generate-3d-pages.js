const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sections = ['gioi-thieu','thuong-hieu','san-pham','danh-muc-san-pham','thanh-phan','category','tin-tuc','lien-he','tai-lieu-drcgf','chuyen-khoan','chinh-sach-bao-mat','tim-kiem','cam-on','thu-moi-mai-kami-06-10'];
let count = 0;
function write(relative) {
  const target = path.join(root, '3d', relative);
  fs.mkdirSync(path.dirname(target), {recursive:true});
  const canonical = relative === 'index.html' ? '/' : '/' + relative.replace(/index\.html$/, '');
  fs.writeFileSync(target, template.replace(/(<link rel="canonical" href=")[^"]+/, '$1https://www.drcgf.vn' + canonical));
  count++;
}
function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const item of fs.readdirSync(directory, {withFileTypes:true})) {
    const filename = path.join(directory, item.name);
    if (item.isDirectory()) walk(filename);
    else if (item.name === 'index.html') write(path.relative(root,filename));
  }
}
write('index.html');
for (const section of sections) walk(path.join(root,section));
console.log(`Generated ${count} clean 3D entry pages.`);
