const MODE = 'rating';

const I18N = {
  uk: {
    badge: 'Незалежна дегустація · 2026',
    mainTitle: 'Суші Гід Хмельницький',
    hero: 'Чесний гід по суші міста. Зважування, кількість лосося, ціна за 100 г та оцінка за 5 категоріями.',
    allRec: 'Всі рекомендації', recYes: 'Рекомендую', recMaybe: 'Можна спробувати', recNo: 'Не рекомендую',
    allCat: 'Всі категорії', catPremium: 'Преміум', catAbove: 'Вище середнього', catMid: 'Середній', catBudget: 'Бюджет',
    sortScore: 'За оцінкою', sortName: 'За назвою', sortPrice: 'За ціною',
    fiveCats: 'Оцінка за 5 категоріями',
    shown: 'Показано', of: 'з', placesWord: 'закладів',
    taste: 'Смак', value: 'Цінність', valueFull: 'Цінність і чесність', addons: 'Додатки', service: 'Сервіс', pack: 'Пакування',
    scoreLabel: 'Оцінка',
    price: 'Ціна', weight: 'Вага (факт / заявл.)', p100: 'Ціна за 100 г', salmon: 'Лосось',
    delivery: 'Доставка', noDelivery: 'Немає доставки / лише самовивіз',
    delMin: 'Мін. сума', delFee: 'Ціна', delFree: 'Безкоштовно від',
    fiveTitle: 'Оцінка за 5 категоріями',
    openMenu: 'Меню закладу →',
    footerTitle: 'Суші Гід Хмельницький', footer: 'Незалежна дегустація',
    suggestPlace: 'Запропонувати новий заклад',
    lastUpdated: 'Останнє оновлення',
    incomplete: 'Часткові дані',
    months: ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
  },
  en: {
    badge: 'Independent tasting · 2026',
    mainTitle: 'Khmelnytskyi Sushi Guide',
    hero: 'An honest sushi guide for the city. Weighing, salmon amount, price per 100 g and a score across 5 categories.',
    allRec: 'All recommendations', recYes: 'Recommended', recMaybe: 'Worth a try', recNo: 'Not recommended',
    allCat: 'All categories', catPremium: 'Premium', catAbove: 'Above average', catMid: 'Average', catBudget: 'Budget',
    sortScore: 'By score', sortName: 'By name', sortPrice: 'By price',
    fiveCats: 'Score across 5 categories',
    shown: 'Showing', of: 'of', placesWord: 'places',
    taste: 'Taste', value: 'Value', valueFull: 'Value & honesty', addons: 'Extras', service: 'Service', pack: 'Packaging',
    scoreLabel: 'Score',
    price: 'Price', weight: 'Weight (actual / listed)', p100: 'Price per 100 g', salmon: 'Salmon',
    delivery: 'Delivery', noDelivery: 'No delivery / pickup only',
    delMin: 'Min. order', delFee: 'Fee', delFree: 'Free from',
    fiveTitle: 'Score across 5 categories',
    openMenu: 'Place menu →',
    footerTitle: 'Khmelnytskyi Sushi Guide', footer: 'Independent tasting',
    suggestPlace: 'Suggest a new place',
    lastUpdated: 'Last updated',
    incomplete: 'Partial data',
    months: ['January','February','March','April','May','June','July','August','September','October','November','December']
  }
};

const catMap = {
  uk: {},
  en: {'Преміум':'Premium','Вище середнього':'Above average','Середній':'Average','Бюджет':'Budget'}
};
const typeMap = {
  uk: {},
  en: {'Суші':'Sushi','Азійський':'Asian','Піца + Суші':'Pizza + Sushi','Ресторан / Кафе':'Restaurant / Cafe'}
};

let places = [];
let lang = localStorage.getItem('sg-lang') === 'en' ? 'en' : 'uk';

function t(key) {
  return (I18N[lang] && I18N[lang][key]) || I18N.uk[key] || key;
}

function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang][key]) el.textContent = I18N[lang][key];
  });
  const uk = document.getElementById('btn-uk');
  const en = document.getElementById('btn-en');
  if (uk && en) {
    uk.className = 'px-2.5 py-1 ' + (lang === 'uk' ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-white');
    en.className = 'px-2.5 py-1 ' + (lang === 'en' ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-white');
  }
  document.documentElement.lang = lang === 'en' ? 'en' : 'uk';
}

function setLang(l) {
  lang = l === 'en' ? 'en' : 'uk';
  localStorage.setItem('sg-lang', lang);
  applyStaticI18n();
  const lu = document.getElementById('lastUpdated');
  if (lu && lu.dataset.iso) setLastUpdated(lu.dataset.iso);
  if (places.length) render();
}

async function loadContent() {
  const file = MODE === 'coming-soon'
    ? 'content/coming-soon.html'
    : 'content/rating.html';
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error('Content not found');
    const html = await res.text();
    document.getElementById('app').innerHTML = html;
    applyStaticI18n();
    if (MODE === 'rating') {
      await loadData();
      bindFilters();
    }
  } catch (e) {
    document.getElementById('app').innerHTML = `<div class="text-center py-20 text-red-500">Не вдалося завантажити контент.<br><span class="text-sm text-zinc-400">${e.message}</span></div>`;
  }
}

async function loadData() {
  const res = await fetch('data.json');
  const data = await res.json();
  if (Array.isArray(data)) {
    places = data;
  } else {
    places = data.places || [];
    if (data.lastUpdated) setLastUpdated(data.lastUpdated);
  }
  render();
}

function setLastUpdated(iso) {
  const el = document.getElementById('lastUpdated');
  if (!el || !iso) return;
  const months = t('months');
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    el.textContent = t('lastUpdated') + ': ' + iso;
    return;
  }
  const day = parseInt(m[3], 10);
  const month = months[parseInt(m[2], 10) - 1] || m[2];
  const year = m[1];
  el.dataset.iso = iso;
  if (lang === 'en') {
    el.textContent = `${t('lastUpdated')}: ${month} ${day}, ${year}`;
  } else {
    el.textContent = `${t('lastUpdated')}: ${day} ${month} ${year}`;
  }
}

function getScore(p) {
  const s = p.score != null ? p.score : p.khmelScore;
  return s != null ? Number(s) : null;
}

function scoreColor(s) {
  if (s == null) return 'bg-zinc-200 text-zinc-500';
  if (s >= 80) return 'bg-green-100 text-green-800';
  if (s >= 65) return 'bg-lime-100 text-lime-800';
  if (s >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function recBadge(r) {
  if (r === 'Так') return `<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">${t('recYes')}</span>`;
  if (r === 'Можна спробувати' || r === 'Якщо близько') {
    return `<span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">${t('recMaybe')}</span>`;
  }
  if (r === 'Ні') return `<span class="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">${t('recNo')}</span>`;
  return '';
}

function incompleteBadge(p) {
  if (p.incomplete) return `<span class="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">${t('incomplete')}</span>`;
  return '';
}

function stabilityDot(p) {
  const s = p.stability;
  let color = 'bg-zinc-300';
  if (s === 'Висока') color = 'bg-green-500';
  else if (s === 'Середня') color = 'bg-amber-500';
  else if (s === 'Низька') color = 'bg-red-500';
  return `<span class="inline-block w-2 h-2 rounded-full ${color} shrink-0"></span>`;
}

function deliveryBlock(p) {
  const min = p.deliveryMin;
  const fee = p.deliveryFee;
  const free = p.deliveryFreeFrom;
  const note = p.deliveryNote;
  const hasAny = min != null || fee != null || free != null || note;
  if (!hasAny) return '';
  if ((fee === '—' || fee === '–') && (min === '—' || min === '–' || min == null) && (free === '—' || free === '–' || free == null)) {
    return `<div class="bg-zinc-50 rounded-lg p-3 text-sm mb-5"><div class="font-medium mb-1">${t('delivery')}</div><div class="text-zinc-600">${t('noDelivery')}</div>${note ? `<div class="text-zinc-500 text-xs mt-1">${note}</div>` : ''}</div>`;
  }
  const fmt = (val) => {
    if (val == null || val === '') return '—';
    if (val === '—' || val === '–' || val === 'N/A') return val;
    if (typeof val === 'number') return val + ' грн';
    if (/^\d+([.,]\d+)?$/.test(String(val))) return val + ' грн';
    if (String(val).includes('/')) return String(val) + ' грн';
    return String(val);
  };
  return `<div class="mb-5"><h4 class="font-bold text-sm mb-2">${t('delivery')}</h4><div class="grid grid-cols-3 gap-2 text-sm mb-2"><div class="bg-zinc-50 rounded-lg p-2.5"><div class="text-zinc-500 text-xs">${t('delMin')}</div><div class="font-semibold">${fmt(min)}</div></div><div class="bg-zinc-50 rounded-lg p-2.5"><div class="text-zinc-500 text-xs">${t('delFee')}</div><div class="font-semibold">${fmt(fee)}</div></div><div class="bg-zinc-50 rounded-lg p-2.5"><div class="text-zinc-500 text-xs">${t('delFree')}</div><div class="font-semibold">${fmt(free)}</div></div></div>${note ? `<div class="text-xs text-zinc-500">${note}</div>` : ''}</div>`;
}

function bar(val, max) {
  if (val == null) return '<div class="bar"><div style="width:0%"></div></div>';
  const pct = Math.min(100, (val / max) * 100);
  return `<div class="bar"><div class="bg-green-500" style="width:${pct}%"></div></div>`;
}

function render() {
  const recEl = document.getElementById('filterRec');
  const catEl = document.getElementById('filterCat');
  const sortEl = document.getElementById('sortBy');
  if (!recEl) return;
  const rec = recEl.value;
  const cat = catEl.value;
  const sort = sortEl.value;
  let list = places.filter(p => {
    if (rec && p.recommend !== rec) return false;
    if (cat && p.category !== cat) return false;
    return true;
  });
  list.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'uk');
    if (sort === 'price') return (a.price || 9999) - (b.price || 9999);
    return (getScore(b) || 0) - (getScore(a) || 0);
  });
  document.getElementById('countLabel').textContent = `${t('shown')} ${list.length} ${t('of')} ${places.length} ${t('placesWord')}`;
  document.getElementById('grid').innerHTML = list.map(p => {
    const total = getScore(p);
    const score = total != null ? total.toFixed(0) : '—';
    const a = p.categories.A_taste != null ? p.categories.A_taste.toFixed(0) : '—';
    const b = p.categories.B_value != null ? p.categories.B_value.toFixed(0) : '—';
    const c = p.categories.C_completeness != null ? p.categories.C_completeness.toFixed(1) : '—';
    const d = p.categories.D_service != null ? p.categories.D_service.toFixed(0) : '—';
    const e = p.categories.E_delivery != null ? p.categories.E_delivery.toFixed(0) : '—';
    return `
    <div class="card bg-white rounded-xl border p-5 cursor-pointer" onclick="openModal(${p.id})">
      <div class="flex justify-between items-start gap-3 mb-3">
        <div class="min-w-0">
          <h3 class="font-bold text-lg leading-tight flex items-center gap-2 min-w-0">
            <span class="truncate">${p.name}</span>${stabilityDot(p)}
          </h3>
          <div class="text-xs text-zinc-500 mt-1">${(catMap[lang][p.category] || p.category) || p.type || ''}</div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-3xl font-extrabold ${scoreColor(total)} px-2.5 py-1 rounded-xl">${score}</div>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5 mb-4">
        ${recBadge(p.recommend)}
        ${incompleteBadge(p)}
        ${p.price ? `<span class="text-xs px-2 py-0.5 rounded-full bg-zinc-100">${p.price} грн</span>` : ''}
      </div>
      <div class="grid grid-cols-5 gap-2 text-center text-[11px] text-zinc-500 border-t pt-3">
        <div><div class="font-bold text-zinc-800 text-sm">${a}</div><div>${t('taste')}</div></div>
        <div><div class="font-bold text-zinc-800 text-sm">${b}</div><div>${t('value')}</div></div>
        <div><div class="font-bold text-zinc-800 text-sm">${c}</div><div>${t('addons')}</div></div>
        <div><div class="font-bold text-zinc-800 text-sm">${d}</div><div>${t('service')}</div></div>
        <div><div class="font-bold text-zinc-800 text-sm">${e}</div><div>${t('pack')}</div></div>
      </div>
    </div>`;
  }).join('');
}

function openModal(id) {
  const p = places.find(x => x.id === id);
  if (!p) return;
  document.getElementById('mTitle').innerHTML = `<span class="inline-flex items-center gap-2">${p.name}${stabilityDot(p)}</span>`;
  const cat = p.categories;
  document.getElementById('mBody').innerHTML = `
    <div class="flex items-center gap-3 mb-5">
      <div class="text-4xl font-extrabold ${scoreColor(getScore(p))} px-3 py-1 rounded-xl">
        ${getScore(p) != null ? getScore(p).toFixed(0) : '—'}
      </div>
      <div>
        <div class="font-medium text-lg">${t('scoreLabel')}</div>
        <div class="text-sm text-zinc-500">${(catMap[lang][p.category] || p.category) || ''} · ${(typeMap[lang][p.type] || p.type) || ''}</div>
        <div class="mt-1 flex flex-wrap gap-1.5">${recBadge(p.recommend)}${incompleteBadge(p)}</div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3 text-sm mb-5">
      <div class="bg-zinc-50 rounded-lg p-3">
        <div class="text-zinc-500 text-xs">${t('price')}</div>
        <div class="font-semibold">${p.price ? p.price + ' грн' : '—'}</div>
      </div>
      <div class="bg-zinc-50 rounded-lg p-3">
        <div class="text-zinc-500 text-xs">${t('weight')}</div>
        <div class="font-semibold">${p.actualWeight ?? '—'} / ${p.declaredWeight ?? '—'} г</div>
      </div>
      <div class="bg-zinc-50 rounded-lg p-3">
        <div class="text-zinc-500 text-xs">${t('p100')}</div>
        <div class="font-semibold">${p.pricePer100g != null ? p.pricePer100g + ' грн' : '—'}</div>
      </div>
      <div class="bg-zinc-50 rounded-lg p-3">
        <div class="text-zinc-500 text-xs">${t('salmon')}</div>
        <div class="font-semibold">${p.salmonPct != null ? p.salmonPct + '%' : '—'} ${p.salmonG ? '(' + p.salmonG + ' г)' : ''}</div>
      </div>
    </div>
    ${deliveryBlock(p)}
    <h4 class="font-bold text-sm mb-3">${t('fiveTitle')}</h4>
    <div class="space-y-3 text-sm mb-5">
      ${catRow(t('taste'), cat.A_taste, 50)}
      ${catRow(t('valueFull'), cat.B_value, 20)}
      ${catRow(t('addons'), cat.C_completeness, 5)}
      ${catRow(t('service'), cat.D_service, 15)}
      ${catRow(t('pack'), cat.E_delivery, 10)}
    </div>
    ${p.menu ? `<a href="${p.menu}" target="_blank" class="inline-block mt-1 text-sm text-blue-600 hover:underline">${t('openMenu')}</a>` : ''}
  `;
  document.getElementById('modal').classList.add('open');
}

function catRow(label, val, max) {
  const v = val != null ? (Number.isInteger(val) ? val : val.toFixed(1)) : '—';
  return `<div class="flex items-center gap-3"><div class="w-44 text-zinc-600 shrink-0">${label}</div><div class="flex-1">${bar(val, max)}</div><div class="w-14 text-right font-semibold">${v}<span class="text-zinc-400 font-normal text-xs">/${max}</span></div></div>`;
}

function closeModal() {
  const m = document.getElementById('modal');
  if (m) m.classList.remove('open');
}

function bindFilters() {
  ['filterRec', 'filterCat', 'sortBy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', render);
  });
  document.addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });
}

applyStaticI18n();
loadContent();
