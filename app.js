// Renders the entire page from content.json. No content is hardcoded here —
// editing content.json (or, later, the /admin editor) is the only way to change
// what visitors see.

let CONTENT = null;

function starIcon(fill, gradientId) {
  // fill: 'full' | 'half' | 'empty'
  const color = fill === 'empty' ? '#d1d5db' : '#facc15';
  if (fill === 'half') {
    return `<svg class="w-4 h-4" viewBox="0 0 24 24"><defs><linearGradient id="${gradientId}"><stop offset="50%" stop-color="${color}"/><stop offset="50%" stop-color="#d1d5db"/></linearGradient></defs><path fill="url(#${gradientId})" d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 19.771l-7.416 3.642 1.48-8.279L0 9.306l8.332-1.151z"/></svg>`;
  }
  return `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="${color}"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 19.771l-7.416 3.642 1.48-8.279L0 9.306l8.332-1.151z"/></svg>`;
}

// `key` must be unique per star row on the page — a card renders two rows, and
// duplicate gradient ids would make every half-star resolve to the first one.
function starRow(rating, key) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let html = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) html += starIcon('full');
    else if (i === full && half) html += starIcon('half', `half-${key}`);
    else html += starIcon('empty');
  }
  return html;
}

// One rating line: stars, score, an optional review count, and an optional
// trailing "(label)" — e.g. "★ 4.8/5 (After 2 years)" with reviews omitted.
// Five stars from `lg` up; a single star below that, where space is tight.
function ratingLine(rating, reviews, key, label) {
  const value = rating ?? 0;
  const showReviews = reviews !== null && reviews !== undefined && reviews !== '';
  return `
    <div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 lg:gap-2">
      <span class="hidden lg:flex shrink-0">${starRow(value, key)}</span>
      <span class="flex lg:hidden shrink-0">${starIcon(value > 0 ? 'full' : 'empty')}</span>
      <span class="font-semibold text-sm lg:text-base whitespace-nowrap">${value}<span class="font-normal">/5</span></span>
      ${showReviews ? `<span class="text-gray-600 text-xs lg:text-sm whitespace-nowrap">${reviews} reviews</span>` : ''}
      ${label ? `<span class="text-gray-600 text-xs lg:text-sm whitespace-nowrap">(${label})</span>` : ''}
    </div>`;
}

function logoBox(listing) {
  if (listing.logo) {
    return `<img src="${listing.logo}" alt="${listing.name}" class="w-10 h-10 object-contain rounded" />`;
  }
  const initial = (listing.name || '?').trim().charAt(0).toUpperCase();
  return `<div class="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center font-semibold">${initial}</div>`;
}

function cardTemplate(listing, index) {
  return `
  <div class="rounded-lg overflow-hidden border border-gray-200 mb-0 pb-3 sm:pb-4 space-y-3 bg-cardbg shadow-[0_4px_12px_rgba(0,86,210,0.24)]" data-index="${index}">
    <div class="grid grid-cols-12 bg-white rounded-lg px-2 md:px-4 py-3">

      <div class="col-span-4 sm:col-span-3 lg:col-span-2 text-center flex flex-col items-center justify-center gap-2">
        ${logoBox(listing)}
        <span class="text-[10px] sm:text-xs">${listing.name}${listing.poweredBy ? `<br><span class="text-gray-400">${listing.poweredBy}</span>` : ''}</span>
      </div>

      <div class="hidden lg:flex col-span-3 items-center justify-center ps-2 pe-6">
        <div class="space-y-2 sm:space-y-3">
          <p class="text-xs lg:text-sm text-gray-600 mb-1">Accredited by:</p>
          <p class="line-clamp-1 font-semibold text-sm lg:text-base">${listing.accreditations}</p>
        </div>
      </div>

      <div class="border-l border-r sm:border-none col-span-8 sm:col-span-6 lg:col-span-5 flex flex-col justify-center gap-1.5 ps-2 lg:ps-4">
        ${ratingLine(listing.rating, listing.reviews, `${index}-a`, '')}
        ${ratingLine(listing.rating2, null, `${index}-b`, listing.label2 || '')}
      </div>

      <a href="tel:${(CONTENT.site.callNowNumber || '').replace(/\s+/g, '')}" class="hidden sm:flex col-span-3 lg:col-span-2 items-center justify-end ps-4 lg:ps-6">
        <span class="text-xs lg:text-sm font-medium text-primary underline whitespace-nowrap">Talk to our expert</span>
      </a>
    </div>

    <div class="lg:hidden px-2 md:px-4 -mt-1 text-center">
      <p class="text-xs text-gray-600">Accredited by:</p>
      <p class="font-semibold text-xs sm:text-sm">${listing.accreditations}</p>
    </div>

    <div class="col-span-12 flex flex-col sm:flex-row items-center justify-between gap-3 px-2 md:px-4">
      <a href="tel:${(CONTENT.site.callNowNumber || '').replace(/\s+/g, '')}" class="sm:hidden text-xs font-medium text-primary underline">Talk to our expert</a>

      <div class="flex w-full sm:w-auto items-center gap-2 sm:gap-3">
        <button class="apply-now inline-flex flex-1 sm:flex-none sm:w-48 items-center justify-center gap-2 border border-primary text-primary text-xs sm:text-sm font-medium rounded-md px-2 sm:px-3 py-2 h-10 hover:bg-primary/5" data-index="${index}">
          Download Brochure
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        </button>

        <button class="apply-now inline-flex flex-1 sm:flex-none sm:w-48 items-center justify-center border border-primary text-primary text-xs sm:text-sm font-medium rounded-md px-2 sm:px-3 py-2 h-10 hover:bg-primary/5" data-index="${index}">
          LMS Portal
        </button>
      </div>

      <div class="flex items-center gap-3">
        <span class="flex flex-col items-center leading-tight">
          <span class="font-semibold whitespace-nowrap">₹ ${listing.price}</span>
          <span class="text-[10px] lg:text-xs font-normal text-gray-500 whitespace-nowrap">${listing.priceUnit === 'Sem' ? 'Semester Fee' : listing.priceUnit === 'Full' ? 'Full Fee' : listing.priceUnit + ' Fee'}</span>
        </span>
        <button class="apply-now bg-primary text-primary-foreground text-sm font-medium rounded-md px-5 py-2 hover:bg-primary/90" data-index="${index}">
          Apply Now
        </button>
      </div>
    </div>
  </div>`;
}

function renderListings(list) {
  const container = document.getElementById('listings');
  const noResults = document.getElementById('noResults');
  if (list.length === 0) {
    container.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');
  container.innerHTML = list.map((l, i) => cardTemplate(l, i)).join('');

  container.querySelectorAll('.apply-now').forEach(btn => {
    btn.addEventListener('click', () => openModal(list[Number(btn.dataset.index)].name));
  });
}

function renderStatic() {
  const { site, hero } = CONTENT;
  document.getElementById('brandInitial').textContent = (site.brandName || '?').charAt(0).toUpperCase();
  const brandLogo = document.getElementById('brandLogo');
  const showLogo = () => {
    brandLogo.classList.remove('hidden');
    document.getElementById('brandInitial').classList.add('hidden');
  };
  // Handlers are attached before `src` is assigned, so a cached image that loads
  // immediately still fires onload; the `complete` check covers the case where
  // the browser resolved it even faster than that.
  brandLogo.onload = showLogo;
  brandLogo.onerror = () => brandLogo.classList.add('hidden');
  if (site.brandLogo) {
    brandLogo.src = site.brandLogo;
    if (brandLogo.complete && brandLogo.naturalWidth > 0) showLogo();
  }
  document.getElementById('brandName').textContent = site.brandName;
  document.getElementById('brandTagline').textContent = site.brandTagline || '';
  document.getElementById('callNowBtn').href = `tel:${(site.callNowNumber || '').replace(/\s+/g, '')}`;
  document.getElementById('copyrightText').textContent = site.copyright;

  document.getElementById('heroBadge').textContent = hero.badge;
  document.getElementById('heroHeading').textContent = hero.heading;
  document.getElementById('heroSubheading').textContent = hero.subheading;
  document.getElementById('searchInput').placeholder = hero.searchPlaceholder || 'Search';

  document.getElementById('formTitle').textContent = CONTENT.form.title;
  document.getElementById('formSubtitle').textContent = CONTENT.form.subtitle;
}

function openModal(universityName) {
  document.getElementById('formForUniversity').textContent = universityName;
  document.querySelector('#leadForm input[name="university"]').value = universityName;
  document.getElementById('formStatus').textContent = '';
  document.getElementById('leadForm').classList.remove('hidden');
  document.getElementById('leadModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('leadModal').classList.add('hidden');
}

function wireSearch() {
  const input = document.getElementById('searchInput');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const filtered = !q ? CONTENT.listings : CONTENT.listings.filter(l =>
      l.name.toLowerCase().includes(q) || l.accreditations.toLowerCase().includes(q)
    );
    renderListings(filtered);
  });
}

function wireModal() {
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('leadModal').addEventListener('click', (e) => {
    if (e.target.id === 'leadModal') closeModal();
  });

  document.getElementById('leadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById('formStatus');
    const endpoint = CONTENT.form.endpoint;

    if (!endpoint) {
      status.textContent = 'Form endpoint not configured yet — see content.json > form.endpoint.';
      status.className = 'text-sm mt-3 text-amber-600';
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    // Apps Script's redirect chain can take several seconds to resolve. Since
    // `no-cors` mode makes the response body unreadable anyway (we can't check
    // success/failure from it), don't block the UI on it — fire the request and
    // show success immediately; the submission completes in the background.
    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    }).catch(() => {}); // network errors are silent; nothing meaningful to show the user

    status.textContent = CONTENT.form.successMessage || 'Submitted. Thank you!';
    status.className = 'text-sm mt-3 text-green-600';
    form.reset();
    setTimeout(closeModal, 1500);
  });
}

async function init() {
  const res = await fetch('content.json');
  CONTENT = await res.json();
  renderStatic();
  renderListings(CONTENT.listings);
  wireSearch();
  wireModal();
}

init();
