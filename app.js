/* =====================================================
   FANTASÍA — app.js
   Catálogo de exhibición con contacto por WhatsApp.
   Configuración en config.js
   ===================================================== */

const CSV_URL = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/export?format=csv&gid=${CONFIG.SHEET_GID}`;

let allProducts    = [];
let filtered       = [];
let activeCategory = 'Todos';

document.addEventListener('DOMContentLoaded', () => {
  // Mostrar aviso si no fue aceptado antes en esta sesion
  if (!sessionStorage.getItem('fantasia_notice_ok')) {
    document.getElementById('noticeOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  loadProducts();
});

function acceptNotice() {
  sessionStorage.setItem('fantasia_notice_ok', '1');
  document.getElementById('noticeOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ── CARGA DESDE GOOGLE SHEETS ───────────────────────────
async function loadProducts() {
  showLoading(true);
  document.getElementById('errorState').style.display  = 'none';
  document.getElementById('productsGrid').style.display = 'none';

  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    allProducts = parseCSV(csv);
    if (allProducts.length === 0) throw new Error('La hoja está vacía o sin datos válidos.');
    buildCategoryFilters();
    filterProducts();
    showLoading(false);
    document.getElementById('productsGrid').style.display = 'grid';
  } catch (err) {
    showLoading(false);
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMsg').textContent = err.message;
    console.error('[Fantasía] Error al cargar:', err);
  }
}

// ── CONVERSOR DE LINKS DE GOOGLE DRIVE ─────────────────
function resolveImageUrl(url) {
  if (!url) return '';
  let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  return url;
}

// ── PARSEO CSV ──────────────────────────────────────────
// Columnas en Google Sheets (fila 1 = encabezados):
// nombre | categoria | precio | rating | descripcion | imagen | badge | tallas | disponible
function parseCSV(csv) {
  const lines  = csv.trim().split('\n');
  const header = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  const idx    = k => header.indexOf(k);

  return lines.slice(1).map((line, i) => {
    const cols       = parseLine(line);
    const disponible = (cols[idx('disponible')] || 'si').toLowerCase();
    if (disponible === 'no' || disponible === 'false') return null;

    return {
      id:          i + 1,
      nombre:      cols[idx('nombre')]      || '',
      categoria:   cols[idx('categoria')]   || 'General',
      precio:      parseFloat((cols[idx('precio')] || '0').replace(',', '.')) || 0,
      rating:      parseFloat((cols[idx('rating')] || '0').replace(',', '.')) || 0,
      descripcion: cols[idx('descripcion')] || '',
      imagen:      resolveImageUrl(cols[idx('imagen')] || ''),
      badge:       cols[idx('badge')]       || '',
      tallas:      (cols[idx('tallas')] || '').split('|').map(t => t.trim()).filter(Boolean),
    };
  }).filter(p => p && p.nombre);
}

function parseLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  result.push(cur.trim());
  return result;
}

// ── FILTROS Y ORDEN ─────────────────────────────────────
function setCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterProducts();
}

function filterProducts() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  filtered = allProducts.filter(p => {
    const matchCat = activeCategory === 'Todos' || p.categoria === activeCategory;
    const matchQ   = !q || p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  sortProducts();
}

function sortProducts() {
  const val  = document.getElementById('sortSelect')?.value || 'default';
  const list = [...filtered];
  if (val === 'price-asc')  list.sort((a, b) => a.precio - b.precio);
  if (val === 'price-desc') list.sort((a, b) => b.precio - a.precio);
  if (val === 'rating')     list.sort((a, b) => b.rating - a.rating);
  if (val === 'name')       list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  renderProducts(list);
}

// ── RENDERIZADO ─────────────────────────────────────────
function renderProducts(list) {
  const grid  = document.getElementById('productsGrid');
  const count = document.getElementById('catalogCount');
  count.textContent = `${list.length} disfraz${list.length !== 1 ? 'ces' : ''} disponible${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:4rem">No se encontraron disfraces.</p>';
    return;
  }
  grid.innerHTML = list.map(p => cardHTML(p)).join('');
}

function cardHTML(p) {
  const badgeHTML = p.badge
    ? `<span class="card-badge badge-${p.badge.toLowerCase()}">${p.badge}</span>`
    : '';
  const stars  = p.rating > 0 ? `★ ${p.rating.toFixed(1)}` : '';
  const imgSrc = p.imagen || 'https://via.placeholder.com/400x530/1a1628/7c3aed?text=Sin+imagen';

  return `
    <div class="product-card" onclick="openModal(${p.id})">
      <div class="card-image-wrap">
        ${badgeHTML}
        <img src="${imgSrc}" alt="${p.nombre}" loading="lazy"
          onerror="this.src='https://via.placeholder.com/400x530/1a1628/7c3aed?text=Sin+imagen'"/>
        <div class="card-add-overlay">
          <button class="card-add-btn" onclick="event.stopPropagation(); sendWhatsApp(${p.id})">
            Consultar por WhatsApp
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-category">
          <span>${p.categoria.toUpperCase()}</span>
          ${stars ? `<span class="card-rating">${stars}</span>` : ''}
        </div>
        <div class="card-name">${p.nombre}</div>
        <div class="card-price">${CONFIG.CURRENCY_SYMBOL}${p.precio.toFixed(2)}</div>
      </div>
    </div>`;
}

// ── FILTROS DE CATEGORÍA DINÁMICOS ─────────────────────
function buildCategoryFilters() {
  const cats      = ['Todos', ...new Set(allProducts.map(p => p.categoria))];
  const container = document.getElementById('categoryFilters');
  container.innerHTML = cats.map((c, i) =>
    `<button class="filter-btn ${i === 0 ? 'active' : ''}" onclick="setCategory('${c}', this)">${c}</button>`
  ).join('');
}

// ── MODAL DETALLE ───────────────────────────────────────
function openModal(id) {
  const p      = allProducts.find(x => x.id === id);
  if (!p) return;
  const imgSrc = p.imagen || 'https://via.placeholder.com/400x530/1a1628/7c3aed?text=Sin+imagen';

  const tallas = p.tallas.length
    ? `<div class="modal-tags">${p.tallas.map(t => `<span class="modal-tag">${t}</span>`).join('')}</div>`
    : '';

  document.getElementById('modalContent').innerHTML = `
    <img class="modal-img" src="${imgSrc}" alt="${p.nombre}"
      onerror="this.src='https://via.placeholder.com/400x530/1a1628/7c3aed?text=Sin+imagen'"/>
    <div class="modal-info">
      <span class="modal-category">${p.categoria}</span>
      <h2 class="modal-name">${p.nombre}</h2>
      ${p.rating > 0 ? `<div class="modal-rating">★★★★★ ${p.rating.toFixed(1)} / 5.0</div>` : ''}
      <div class="modal-price"><span class="modal-price-label">Alquiler</span> ${CONFIG.CURRENCY_SYMBOL}${p.precio.toFixed(2)}</div>
      <p class="modal-desc">${p.descripcion || 'Sin descripción.'}</p>
      ${tallas}
      <button class="modal-add-btn" onclick="sendWhatsApp(${p.id})">
        Consultar por WhatsApp
      </button>
    </div>`;

  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('productModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.getElementById('productModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ── WHATSAPP ────────────────────────────────────────────
function sendWhatsApp(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  const mensaje = `${CONFIG.WHATSAPP_MENSAJE}*${p.nombre}*\n` +
    `Categoria: ${p.categoria}\n` +
    `Alquiler: ${CONFIG.CURRENCY_SYMBOL}${p.precio.toFixed(2)}\n` +
    (p.imagen ? `Foto: ${p.imagen}` : '');

  const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

// ── HELPERS ─────────────────────────────────────────────
function showLoading(on) {
  document.getElementById('loadingState').style.display = on ? 'block' : 'none';
}
