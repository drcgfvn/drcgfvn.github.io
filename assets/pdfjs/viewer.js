import * as pdfjsLib from './pdf.min.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';

const params = new URLSearchParams(location.search);
const file = params.get('file');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error');
const pageInput = document.getElementById('page-number');
const pageCount = document.getElementById('page-count');
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const zoomOut = document.getElementById('zoom-out');
const zoomIn = document.getElementById('zoom-in');
const zoomValue = document.getElementById('zoom-value');

let pdf = null;
let pageNumber = 1;
let scale = 1;
let rendering = false;
let pendingPage = null;

function updateControls() {
  pageInput.value = pageNumber;
  pageCount.textContent = pdf ? pdf.numPages : '–';
  prev.disabled = !pdf || pageNumber <= 1;
  next.disabled = !pdf || pageNumber >= pdf.numPages;
  zoomValue.textContent = Math.round(scale * 100) + '%';
}

async function renderPage(number) {
  if (!pdf) return;
  if (rendering) {
    pendingPage = number;
    return;
  }
  rendering = true;
  try {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({scale});
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';
    await page.render({canvasContext: context, viewport, transform: ratio === 1 ? null : [ratio,0,0,ratio,0,0]}).promise;
    canvas.hidden = false;
    loading.hidden = true;
    pageNumber = number;
    updateControls();
    document.getElementById('stage').scrollTo({top:0,left:0});
  } catch (error) {
    loading.hidden = true;
    errorBox.hidden = false;
  } finally {
    rendering = false;
    if (pendingPage !== null) {
      const requested = pendingPage;
      pendingPage = null;
      renderPage(requested);
    }
  }
}

async function loadPdf() {
  if (!file) {
    loading.hidden = true;
    errorBox.hidden = false;
    return;
  }
  try {
    const url = new URL(file, location.href);
    if (url.origin !== location.origin) throw new Error('PDF khác tên miền');
    pdf = await pdfjsLib.getDocument({url:url.href}).promise;
    pageInput.max = pdf.numPages;
    updateControls();
    renderPage(1);
  } catch (error) {
    loading.hidden = true;
    errorBox.hidden = false;
  }
}

prev.addEventListener('click', () => renderPage(Math.max(1, pageNumber - 1)));
next.addEventListener('click', () => renderPage(Math.min(pdf.numPages, pageNumber + 1)));
pageInput.addEventListener('change', () => {
  if (!pdf) return;
  const requested = Math.min(pdf.numPages, Math.max(1, Number(pageInput.value) || 1));
  renderPage(requested);
});
zoomOut.addEventListener('click', () => { scale = Math.max(.5, scale - .25); renderPage(pageNumber); });
zoomIn.addEventListener('click', () => { scale = Math.min(3, scale + .25); renderPage(pageNumber); });

loadPdf();
