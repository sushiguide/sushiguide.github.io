const i18n = {
  uk: {
    badge:"Незалежна дегустація · 2026",
    mainTitle:"Суші Гід Хмельницький",
    hero:"Чесний гід по суші міста. Зважування, кількість лосося, ціна за 100 г та зважена оцінка за 5 критеріями.",
    allRec:"Всі рекомендації", recYes:"Рекомендую", recMaybe:"Якщо близько", recNo:"Не рекомендую",
    allCat:"Всі категорії", catPremium:"Преміум", catAbove:"Вище середнього", catMid:"Середній", catBudget:"Бюджет",
    sortScore:"Оцінка ↓", sortRating:"Особистий рейтинг ↓", sortPrice:"Ціна/100г ↑", sortFish:"Риба ↓",
    statPlaces:"Закладів", statYes:"Рекомендую", statMaybe:"Якщо близько", statNo:"Не рекомендую",
    empty:"Нічого не знайдено",
    scoreTitle:"Що таке Оцінка?",
    scoreDesc:"Загальний бал зі 100. Ваги нерівні — смак важливіший за все інше. Система адаптована під реалії Хмельницького (переважно самовивіз + гібриди піца/суші).",
    axisA:"Смак", axisAdesc:"риба + рис + загальний смак",
    axisB:"Цінність і чесність", axisBdesc:"ціна за 100 г + реальна вага + кількість лосося",
    axisC:"Формат", axisCdesc:"наскільки заклад спеціалізується на суші",
    axisD:"Сервіс і надійність", axisDdesc:"обслуговування + час + пакування",
    axisE:"Надійність/якість доставки", axisEdesc:"як роли переносять дорогу",
    methodNote:"Дані зібрані особисто (травень–липень 2026). Основний тест — Філадельфія з лососем. Більшість замовлень — самовивіз.",
    footerTitle:"Суші Гід Хмельницький",
    footer:"Незалежна дегустація",
    suggestPlace:"Запропонувати новий заклад",
    details:"Детальніше", openMenu:"Відкрити меню →", yourRating:"Особистий рейтинг",
    taste:"Смак", value:"Цінність", format:"Формат", service:"Сервіс", comment:"Коментар",
    incomplete:"Часткові дані"
  },
  en: {
    badge:"Independent tasting · 2026",
    mainTitle:"Khmelnytskyi Sushi Guide",
    hero:"An honest sushi guide for the city. Weighing, salmon amount, price per 100 g and a weighted score across 5 criteria.",
    allRec:"All recommendations", recYes:"Recommended", recMaybe:"If nearby", recNo:"Not recommended",
    allCat:"All categories", catPremium:"Premium", catAbove:"Above average", catMid:"Average", catBudget:"Budget",
    sortScore:"Score ↓", sortRating:"Personal rating ↓", sortPrice:"Price/100g ↑", sortFish:"Fish ↓",
    statPlaces:"Places", statYes:"Recommended", statMaybe:"If nearby", statNo:"Not recommended",
    empty:"Nothing found",
    scoreTitle:"What is the Score?",
    scoreDesc:"A total score out of 100. Weights are intentional — taste matters most. Adapted to Khmelnytskyi reality (mostly pickup + pizza/sushi hybrids).",
    axisA:"Taste", axisAdesc:"fish + rice + overall taste",
    axisB:"Value & Honesty", axisBdesc:"price per 100 g + real weight + salmon amount",
    axisC:"Format", axisCdesc:"how much the place focuses on sushi",
    axisD:"Service & Reliability", axisDdesc:"service + wait time + packaging",
    axisE:"Reliability / Travel Quality", axisEdesc:"how well the rolls survive the trip",
    methodNote:"Data collected personally (May–July 2026). Main test item — Philadelphia with salmon. Most orders were pickup.",
    footerTitle:"Khmelnytskyi Sushi Guide",
    footer:"Independent tasting",
    suggestPlace:"Suggest a new place",
    details:"Details", openMenu:"Open menu →", yourRating:"Personal rating",
    taste:"Taste", value:"Value", format:"Format", service:"Service", comment:"Comment",
    incomplete:"Partial data"
  }
};


const catMap = {
  uk: {"Преміум":"Преміум","Вище середнього":"Вище середнього","Середній":"Середній","Бюджет":"Бюджет"},
  en: {"Преміум":"Premium","Вище середнього":"Above average","Середній":"Average","Бюджет":"Budget"}
};
const typeMap = {
  uk: {"Суші":"Суші","Азійський":"Азійський","Піца + Суші":"Піца + Суші","Ресторан / Кафе":"Ресторан / Кафе"},
  en: {"Суші":"Sushi","Азійський":"Asian","Піца + Суші":"Pizza + Sushi","Ресторан / Кафе":"Restaurant / Cafe"}
};

let lang = "uk";
function setLang(l) {
  lang = l;
  document.getElementById("btn-uk").classList.toggle("active", l==="uk");
  document.getElementById("btn-en").classList.toggle("active", l==="en");
  document.getElementById("btn-uk").classList.toggle("text-zinc-400", l!=="uk");
  document.getElementById("btn-en").classList.toggle("text-zinc-400", l!=="en");
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (i18n[l][key]) el.textContent = i18n[l][key];
  });
  document.querySelectorAll("select option[data-i18n]").forEach(opt => {
    const key = opt.getAttribute("data-i18n");
    if (i18n[l][key]) opt.textContent = i18n[l][key];
  });
  update();
}



function badge(r){
  if(r==="Так") return `<span class="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">${i18n[lang].recYes}</span>`;
  if(r==="Якщо близько") return `<span class="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">${i18n[lang].recMaybe}</span>`;
  return `<span class="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">${i18n[lang].recNo}</span>`;
}
function cls(r){return r==="Так"?"rec-yes":r==="Якщо близько"?"rec-maybe":"rec-no"}
function scoreColor(s){if(s==null)return "text-zinc-400"; return s>=75?"text-green-600":s>=55?"text-amber-600":"text-red-600"}

function render(data){
  const g=document.getElementById("grid"), e=document.getElementById("empty");
  if(!data.length){g.innerHTML="";e.classList.remove("hidden");return}
  e.classList.add("hidden");
  g.innerHTML=data.map((p,i)=>`
  <article class="card-hover bg-white rounded-xl border shadow-sm overflow-hidden ${cls(p.rec)} ${p.incomplete?'incomplete':''}">
    <div class="p-5">
      <div class="flex justify-between gap-3 mb-2">
        <div>
          <h3 class="font-bold text-lg leading-tight">${p.name}</h3>
          <div class="text-xs text-zinc-500 mt-0.5">${catMap[lang][p.cat] || p.cat}</div>
        </div>
        <div class="text-right shrink-0">
          <div class="text-3xl font-extrabold ${scoreColor(p.score)}">${p.score ?? '—'}</div>
          <div class="text-[10px] text-zinc-400 uppercase tracking-wide">Оцінка</div>
        </div>
      </div>
      <div class="mb-3 flex flex-wrap gap-1.5">
        ${badge(p.rec)}
        ${p.incomplete ? `<span class="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full border border-orange-200">${i18n[lang].incomplete}</span>` : ''}
      </div>
      <div class="grid grid-cols-4 gap-2 text-center text-xs mb-4">
        <div class="bg-zinc-50 rounded-lg py-1.5" title="Смак / Taste"><div class="font-semibold">${p.a ?? '—'}</div><div class="text-zinc-500">${i18n[lang].taste}</div></div>
        <div class="bg-zinc-50 rounded-lg py-1.5" title="Цінність / Value"><div class="font-semibold">${p.b ?? '—'}</div><div class="text-zinc-500">${i18n[lang].value}</div></div>
        <div class="bg-zinc-50 rounded-lg py-1.5" title="Формат закладу"><div class="font-semibold">${p.c ?? '—'}</div><div class="text-zinc-500">${i18n[lang].format}</div></div>
        <div class="bg-zinc-50 rounded-lg py-1.5" title="Сервіс"><div class="font-semibold">${(p.d||0)+(p.e||0)}</div><div class="text-zinc-500">${i18n[lang].service}</div></div>
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 mb-4">
        <span title="Особистий рейтинг"><i class="fa-solid fa-star text-amber-400"></i> ${p.rating}/10</span>
        <span title="Ціна за 100 грам">${p.priceGram ? (p.priceGram*100).toFixed(0) : '—'} ₴/100г</span>
        ${p.salmon ? `<span title="Кількість лосося на рол">~${p.salmon}г</span>` : ''}
        <span title="Час очікування">${p.wait}</span>
      </div>
      <div class="flex gap-2">
        <button onclick="openM(${i})" class="flex-1 bg-zinc-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-zinc-800">${i18n[lang].details}</button>
        ${p.link ? `<a href="${p.link}" target="_blank" class="px-3 py-2.5 border rounded-lg text-sm"><i class="fa-solid fa-external-link"></i></a>` : ''}
      </div>
    </div>
  </article>`).join('');
}

function openM(i){
  const p = getData()[i];
  document.getElementById("mTitle").textContent = p.name;
  document.getElementById("mBody").innerHTML = `
    <div class="flex flex-wrap gap-2 mb-4">${badge(p.rec)}
      <span class="bg-zinc-100 text-xs px-2.5 py-0.5 rounded-full">${catMap[lang][p.cat] || p.cat}</span>
      ${p.type ? `<span class="bg-zinc-100 text-xs px-2.5 py-0.5 rounded-full">${typeMap[lang][p.type] || p.type}</span>` : ''}
      ${p.incomplete ? `<span class="bg-orange-100 text-orange-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-orange-200">${i18n[lang].incomplete}</span>` : ''}
    </div>
    <div class="text-center mb-5">
      <div class="text-5xl font-extrabold ${scoreColor(p.score)}">${p.score ?? '—'}</div>
      <div class="text-sm text-zinc-500">Оцінка / 100</div>
    </div>
    <div class="space-y-3 mb-5 text-sm">
      <div><div class="flex justify-between mb-1"><span>${i18n[lang].axisA}</span><b>${p.a ?? '—'}/40</b></div><div class="bar"><div class="bg-green-500" style="width:${(p.a||0)/40*100}%"></div></div></div>
      <div><div class="flex justify-between mb-1"><span>${i18n[lang].axisB}</span><b>${p.b ?? '—'}/25</b></div><div class="bar"><div class="bg-blue-500" style="width:${(p.b||0)/25*100}%"></div></div></div>
      <div><div class="flex justify-between mb-1"><span>${i18n[lang].axisC}</span><b>${p.c ?? '—'}/15</b></div><div class="bar"><div class="bg-purple-500" style="width:${(p.c||0)/15*100}%"></div></div></div>
      <div><div class="flex justify-between mb-1"><span>${i18n[lang].axisD}</span><b>${p.d ?? '—'}/12</b></div><div class="bar"><div class="bg-amber-500" style="width:${(p.d||0)/12*100}%"></div></div></div>
      <div><div class="flex justify-between mb-1"><span>${i18n[lang].axisE}</span><b>${p.e ?? '—'}/8</b></div><div class="bar"><div class="bg-rose-500" style="width:${(p.e||0)/8*100}%"></div></div></div>
    </div>
    <div class="grid grid-cols-2 gap-2 text-sm mb-4">
      <div class="bg-zinc-50 rounded-lg p-2 text-center"><div class="font-bold">${p.fish ?? '—'}</div><div class="text-xs text-zinc-500">Риба</div></div>
      <div class="bg-zinc-50 rounded-lg p-2 text-center"><div class="font-bold">${p.rice ?? '—'}</div><div class="text-xs text-zinc-500">Рис</div></div>
      <div class="bg-zinc-50 rounded-lg p-2 text-center"><div class="font-bold">${p.priceGram ? (p.priceGram*100).toFixed(0) : '—'}</div><div class="text-xs text-zinc-500">₴/100г</div></div>
      <div class="bg-zinc-50 rounded-lg p-2 text-center"><div class="font-bold">${p.rating}</div><div class="text-xs text-zinc-500">${i18n[lang].yourRating}</div></div>
    </div>
    ${p.comment ? `<div class="bg-zinc-50 rounded-xl p-4 text-sm"><div class="font-semibold mb-1">${i18n[lang].comment}</div><p class="text-zinc-700">${p.comment}</p></div>` : ''}
    ${p.link ? `<a href="${p.link}" target="_blank" class="mt-4 inline-block text-red-600 font-medium text-sm">${i18n[lang].openMenu}</a>` : ''}
  `;
  document.getElementById("modal").classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeM(){document.getElementById("modal").classList.remove("active");document.body.style.overflow=""}
document.getElementById("modal").onclick = e => { if(e.target.id==="modal") closeM(); };

function getData(){
  let d = [...places];
  const r = document.getElementById("fRec").value;
  const c = document.getElementById("fCat").value;
  const s = document.getElementById("fSort").value;
  if(r) d = d.filter(p => p.rec === r);
  if(c) d = d.filter(p => p.cat === c);
  d.sort((a,b) => {
    if(s==="score-desc") return (b.score||0) - (a.score||0);
    if(s==="rating-desc") return (b.rating||0) - (a.rating||0);
    if(s==="pricegram-asc") return (a.priceGram||99) - (b.priceGram||99);
    if(s==="fish-desc") return (b.fish||0) - (a.fish||0);
    return 0;
  });
  return d;
}
function update(){
  const d = getData();
  render(d);
  document.getElementById("stTotal").textContent = places.length;
  document.getElementById("stYes").textContent = places.filter(p=>p.rec==="Так").length;
  document.getElementById("stMaybe").textContent = places.filter(p=>p.rec==="Якщо близько").length;
  document.getElementById("stNo").textContent = places.filter(p=>p.rec==="Ні").length;
}
["fRec","fCat","fSort"].forEach(id => document.getElementById(id).onchange = update);
update();
setLang('uk');