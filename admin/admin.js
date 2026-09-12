// Loads the live content.json into editable form fields, then on Publish sends
// the whole updated object + password to the /publish Netlify Function, which
// verifies the password server-side and commits the file to GitHub.

let CONTENT = null;
let PASSWORD = null;

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
  target[last] = value;
}

function populateStaticFields() {
  document.querySelectorAll('[data-path]').forEach(el => {
    el.value = getPath(CONTENT, el.dataset.path) ?? '';
    el.addEventListener('input', () => setPath(CONTENT, el.dataset.path, el.value));
  });
}

function listingRowTemplate(listing, index) {
  return `
  <div class="border border-gray-200 rounded-md p-4" data-row="${index}">
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs font-medium text-gray-400">#${index + 1}</span>
      <div class="flex items-center gap-2">
        <button data-action="up" data-row="${index}" class="text-xs text-gray-500 hover:text-primary" title="Move up">↑</button>
        <button data-action="down" data-row="${index}" class="text-xs text-gray-500 hover:text-primary" title="Move down">↓</button>
        <button data-action="delete" data-row="${index}" class="text-xs text-red-600 hover:underline" title="Delete">Delete</button>
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label class="text-xs">University name
        <input data-field="name" data-row="${index}" value="${escapeAttr(listing.name)}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs">Powered by (optional)
        <input data-field="poweredBy" data-row="${index}" value="${escapeAttr(listing.poweredBy)}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs sm:col-span-2">Accreditations
        <input data-field="accreditations" data-row="${index}" value="${escapeAttr(listing.accreditations)}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs">Reviews (count)
        <input type="number" min="0" data-field="reviews" data-row="${index}" value="${listing.reviews}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs">Rating (0-5)
        <input type="number" min="0" max="5" step="0.1" data-field="rating" data-row="${index}" value="${listing.rating}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs sm:col-span-2">After-period label (e.g. After 2 years)
        <input data-field="label2" data-row="${index}" value="${escapeAttr(listing.label2)}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs">After-period reviews (count)
        <input type="number" min="0" data-field="reviews2" data-row="${index}" value="${listing.reviews2}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs">After-period rating (0-5)
        <input type="number" min="0" max="5" step="0.1" data-field="rating2" data-row="${index}" value="${listing.rating2}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs">Price (e.g. 40,000)
        <input data-field="price" data-row="${index}" value="${escapeAttr(listing.price)}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs">Price unit
        <select data-field="priceUnit" data-row="${index}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm">
          <option value="Sem" ${listing.priceUnit === 'Sem' ? 'selected' : ''}>Sem</option>
          <option value="Full" ${listing.priceUnit === 'Full' ? 'selected' : ''}>Full</option>
          <option value="Year" ${listing.priceUnit === 'Year' ? 'selected' : ''}>Year</option>
        </select>
      </label>
      <label class="text-xs sm:col-span-2">Logo image path (optional, leave blank for initial box)
        <input data-field="logo" data-row="${index}" value="${escapeAttr(listing.logo)}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
      <label class="text-xs sm:col-span-2">Brochure URL
        <input data-field="brochureUrl" data-row="${index}" value="${escapeAttr(listing.brochureUrl)}" class="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" />
      </label>
    </div>
  </div>`;
}

function escapeAttr(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function renderListingsEditor() {
  const container = document.getElementById('listingsEditor');
  container.innerHTML = CONTENT.listings.map((l, i) => listingRowTemplate(l, i)).join('');

  container.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('input', () => {
      const row = Number(el.dataset.row);
      const field = el.dataset.field;
      const listing = CONTENT.listings[row];
      if (['reviews', 'rating', 'reviews2', 'rating2'].includes(field)) {
        listing[field] = Number(el.value) || 0;
      } else {
        listing[field] = el.value;
      }
    });
  });

  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = Number(btn.dataset.row);
      const action = btn.dataset.action;
      if (action === 'delete') {
        if (confirm(`Delete "${CONTENT.listings[row].name}"?`)) {
          CONTENT.listings.splice(row, 1);
          renderListingsEditor();
        }
      } else if (action === 'up' && row > 0) {
        [CONTENT.listings[row - 1], CONTENT.listings[row]] = [CONTENT.listings[row], CONTENT.listings[row - 1]];
        renderListingsEditor();
      } else if (action === 'down' && row < CONTENT.listings.length - 1) {
        [CONTENT.listings[row + 1], CONTENT.listings[row]] = [CONTENT.listings[row], CONTENT.listings[row + 1]];
        renderListingsEditor();
      }
    });
  });
}

function addListing() {
  CONTENT.listings.push({
    name: 'New University',
    logo: '',
    poweredBy: '',
    accreditations: '',
    reviews: 0,
    rating: 5,
    price: '0',
    priceUnit: 'Sem',
    brochureUrl: '',
    reviews2: 0,
    rating2: 5,
    label2: 'After 2 years'
  });
  renderListingsEditor();
  document.getElementById('listingsEditor').lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function loadContent() {
  const res = await fetch('/content.json', { cache: 'no-store' });
  CONTENT = await res.json();
  populateStaticFields();
  renderListingsEditor();
}

async function publish() {
  const status = document.getElementById('publishStatus');
  const btn = document.getElementById('publishBtn');
  btn.disabled = true;
  status.textContent = 'Publishing…';
  status.className = 'text-sm text-gray-500';

  try {
    const res = await fetch('/.netlify/functions/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: PASSWORD, content: CONTENT })
    });

    if (!res.ok) {
      const text = await res.text();
      status.textContent = `Failed: ${text}`;
      status.className = 'text-sm text-red-600';
      return;
    }

    status.textContent = 'Published! Live site will update in about a minute.';
    status.className = 'text-sm text-green-600';
  } catch (err) {
    status.textContent = `Network error: ${err.message}`;
    status.className = 'text-sm text-red-600';
  } finally {
    btn.disabled = false;
  }
}

function wireLogin() {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('passwordInput').value;
    const errorEl = document.getElementById('loginError');
    errorEl.classList.add('hidden');

    // Verify the password against the server before revealing the editor —
    // a bad password here should never load real content or accept edits.
    try {
      const res = await fetch('/.netlify/functions/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // A harmless probe: real publish requires listings/hero/site, so an
        // incomplete body fails validation *after* the password check, telling
        // us whether the password itself was accepted.
        body: JSON.stringify({ password: pw, content: {} })
      });

      if (res.status === 401) {
        errorEl.textContent = 'Incorrect password.';
        errorEl.classList.remove('hidden');
        return;
      }
      // 400 (bad content shape) or 200 both mean the password passed.
      PASSWORD = pw;
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('editorScreen').classList.remove('hidden');
      await loadContent();
    } catch (err) {
      errorEl.textContent = `Could not reach server: ${err.message}`;
      errorEl.classList.remove('hidden');
    }
  });
}

wireLogin();
document.getElementById('addListingBtn').addEventListener('click', addListing);
document.getElementById('publishBtn').addEventListener('click', publish);
