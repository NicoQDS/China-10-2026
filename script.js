/* =========================================================
   SCRIPT.JS — data + behavior for the China 2026 trip map/planner
   =========================================================
   How this file is organized (top to bottom):

   1. CONTENUTI — all the trip DATA: photo URLs (IMG), small
      "template" functions that turn data into HTML strings
      (figs, days, checklist, hotelCard, foodCard, arrivalCard),
      the per-city checklists, and the big CONTENT object that has
      one entry per city (Beijing, Pingyao, Xi'an, ...) with the
      full HTML for that city's side panel.

   2. MAPPA — sets up the Leaflet map: the list of stop cities
      (STOPS), side-trip pins (SIDE_TRIPS), in-town attraction pins
      (IN_CITY_TRIPS), confirmed-hotel pins (HOTEL_PINS), and the
      travel-leg lines connecting each city (LEGS).

   3. Event handling at the bottom: opening/closing the side panel,
      the checklist's "remember what's checked" localStorage logic,
      the quote-request popup, and the ACTIONS dispatch table that
      every clickable element in the generated HTML hooks into via
      a `data-action="..."` attribute (see the big comment above
      the ACTIONS table near the end of this file for how that works).

   IMPORTANT: this whole file relies on the page's HTML already
   existing before it runs (it does things like
   document.getElementById("map") immediately, at the top level).
   That's why in index.html this file is loaded with a plain
   <script src="script.js"></script> placed at the very end of
   <body>, AFTER all the HTML — by the time the browser gets to this
   script, everything above it on the page has already been parsed.
   ========================================================= */

/* Photos for each activity — hosted on Wikipedia/Wikimedia Commons
   (freely licensed). Each key here (e.g. "wangfujing") is referenced
   by name inside the CONTENT city data below, wherever an activity
   or day lists an image — see the figs() function just below. */
const IMG = {
  wangfujing:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Beijing_Wangfujing_20170806.jpg/960px-Beijing_Wangfujing_20170806.jpg",
  tiananmen:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Tiananmen_Square_%2854137047250%29.jpg/960px-Tiananmen_Square_%2854137047250%29.jpg",
  forbidden_city:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/The_Forbidden_City_-_View_from_Coal_Hill.jpg/960px-The_Forbidden_City_-_View_from_Coal_Hill.jpg",
  temple_heaven:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Temple_of_Heaven_20160323_01.jpg/960px-Temple_of_Heaven_20160323_01.jpg",
  mutianyu:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Great_Wall_of_China_July_2006.JPG/960px-Great_Wall_of_China_July_2006.JPG",
  hutong:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Old_districts_%27hutong%27_in_Beijing.jpg/960px-Old_districts_%27hutong%27_in_Beijing.jpg",
  pingyao:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Pingyao_Shilou_2013.08.25_07-01-33.jpg/960px-Pingyao_Shilou_2013.08.25_07-01-33.jpg",
  rishengchang:
    "https://upload.wikimedia.org/wikipedia/commons/c/c8/Rishengzhang_Piaohao_%28%E6%97%A5%E5%8D%87%E6%98%8C%E7%A5%A8%E8%99%9F%29_-_Qing_Dynasty.jpg",
  xian_bell:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Xi%27an_Bell_Tower_2024.10.jpg/960px-Xi%27an_Bell_Tower_2024.10.jpg",
  terracotta:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/51714-Terracota-Army.jpg/960px-51714-Terracota-Army.jpg",
  xian_wall:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/City_wall_of_Xi%27an_51550-Xian_%2827959363326%29.jpg/960px-City_wall_of_Xi%27an_51550-Xian_%2827959363326%29.jpg",
  goose_pagoda:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Giant_Wild_Goose_Pagoda.jpg/960px-Giant_Wild_Goose_Pagoda.jpg",
  muslim_quarter:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Xi%27an_Muslim_Quarter.jpg/960px-Xi%27an_Muslim_Quarter.jpg",
  kuanzhai:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Shops_-_Kuanzhai_Alleys_-_Chengdu%2C_China_-_DSC05305.jpg/960px-Shops_-_Kuanzhai_Alleys_-_Chengdu%2C_China_-_DSC05305.jpg",
  peoples_park:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Monument_to_the_Martyrs_of_the_Railway_Protection_Movement_-_Chengdu%2C_China_-_DSC05329.jpg/960px-Monument_to_the_Martyrs_of_the_Railway_Protection_Movement_-_Chengdu%2C_China_-_DSC05329.jpg",
  panda_base:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Chengdu_Research_Base_Eingang.jpg/960px-Chengdu_Research_Base_Eingang.jpg",
  jinli: "https://upload.wikimedia.org/wikipedia/commons/d/de/Jingli.jpeg",
  liziba:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/%E6%9D%8E%E5%AD%90%E5%9D%9D%E7%AB%99%E8%BD%BB%E8%BD%A8%E7%A9%BF%E6%A5%BC_0023.png/960px-%E6%9D%8E%E5%AD%90%E5%9D%9D%E7%AB%99%E8%BD%BB%E8%BD%A8%E7%A9%BF%E6%A5%BC_0023.png",
  ciqikou:
    "https://upload.wikimedia.org/wikipedia/commons/e/e3/%E4%BA%BA%E5%A4%B4%E6%94%92%E5%8A%A8%E7%9A%84%E7%A3%81%E5%99%A8%E5%8F%A3.jpg",
  hongyadong:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/202308_Hongya_Cave_at_night_from_Qiansimen_Bridge.jpg/960px-202308_Hongya_Cave_at_night_from_Qiansimen_Bridge.jpg",
  glass_bridge:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/ZhangjiajieGlassByHighestBridges.jpg/960px-ZhangjiajieGlassByHighestBridges.jpg",
  zjj_park:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/1_tianzishan_wulingyuan_zhangjiajie_2012.jpg/960px-1_tianzishan_wulingyuan_zhangjiajie_2012.jpg",
  tianzi:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/China_Tianzi_Gebirge.JPG/960px-China_Tianzi_Gebirge.JPG",
  furong_zhen:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Veduta_di_Furong_02.jpg/960px-Veduta_di_Furong_02.jpg",
  tianmen:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Tianmen_38330-Zhangjiajie_%2849047525877%29.jpg/960px-Tianmen_38330-Zhangjiajie_%2849047525877%29.jpg",
  sun_moon_pagodas:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Sun_and_Moon_Pagodas_Guilin_November_2017_HDR_panorama.jpg/960px-Sun_and_Moon_Pagodas_Guilin_November_2017_HDR_panorama.jpg",
  li_river:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/87318-Li-River.jpg/960px-87318-Li-River.jpg",
  yulong_river:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Yulong.JPG/960px-Yulong.JPG",
  xianggong:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Xianggong_%2849937294373%29.jpg/960px-Xianggong_%2849937294373%29.jpg",
  longsheng:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/LongshengRiceTerrace.jpg/960px-LongshengRiceTerrace.jpg",
  xingping:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Li_River_at_Xingping_1.jpg/960px-Li_River_at_Xingping_1.jpg",
  bund: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/The_Bund_2.jpg/960px-The_Bund_2.jpg",
  wuhou:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Gateway_-_Wuhou_Shrine_-_Chengdu,_China_-_DSC05423.jpg",
  west_street:
    "https://commons.wikimedia.org/wiki/Special:FilePath/West_Street_-Yangshuo-Guilin_-_China_-_panoramio.jpg",
};

/**
 * figs(imgs) — turns a list of [imageKey, caption] pairs into the little
 * photo-grid HTML block used under each day in the itinerary.
 * `imgs` looks like: [["forbidden_city", "Città Proibita"], ["temple_heaven", "Tempio del Cielo"]]
 * Each imageKey is looked up in the IMG dictionary above to get the real URL.
 */
function figs(imgs) {
  return (
    `<div class="day-imgs">` +
    imgs
      .map(
        ([k, c]) =>
          `<figure><img src="${IMG[k]}" loading="lazy" alt="${c}"><figcaption>${c}</figcaption></figure>`,
      )
      .join("") +
    `</div>`
  );
}

/**
 * slugDate(date) — turns a display date like "23 ott (ven)" into a
 * URL/id-safe slug like "23-ott". Used to build unique element ids for
 * each day's activities (see activitiesList() below) so that other code
 * could scroll to or reference one specific activity if needed.
 */
function slugDate(date) {
  const m = date.match(/^(\d+)\s+(\w+)/);
  return m
    ? `${m[1]}-${m[2].toLowerCase()}`
    : date.toLowerCase().replace(/\W+/g, "-");
}

/**
 * activitiesList(items, idPrefix) — renders one day's list of activities
 * as stacked cards, one per activity (e.g. "Città Proibita (mattina)"
 * card, then "Tempio del Cielo (pomeriggio)" card below it).
 *
 * Each item in `items` can have:
 *   - label (required): what the activity is
 *   - detail: short parenthetical, e.g. "(mattina)"
 *   - bookBy: a booking-deadline reminder shown on its own line
 *   - desc: an optional plain-text (no colored box) description
 *     paragraph, rendered before the photos — background/context on the
 *     activity rather than a logistics callout (that's what note is for)
 *   - imgs: an optional list of [imageKey, caption] pairs (same shape
 *     figs() takes) rendered as a small photo grid inside this specific
 *     activity's card — so a photo always sits with the activity it
 *     depicts instead of in one combined block for the whole day.
 *   - note: an optional fully-formed colored callout block, rendered
 *     as-is inside this specific activity's card (e.g. the Terracotta
 *     Army ticket info is a note on the "Esercito di Terracotta"
 *     activity). Wrap the content yourself in a `<div class="note">`
 *     (yellow), `<div class="note-green">`, or `<div class="note-grey">`
 *     — see the matching classes in style.css. A note can contain more
 *     than one such div if it needs two different-colored callouts.
 *
 * idPrefix is used to give each activity row a unique id like
 * "day-activity-xian-28-ott-0" (city + date + position in the list).
 */
function activitiesList(items, idPrefix) {
  return (
    `<div class="day-activities">` +
    items
      .map((a, i) => {
        const id = idPrefix ? ` id="${idPrefix}-${i}"` : "";
        const desc = a.desc ? `<div class="day-desc">${a.desc}</div>` : "";
        const imgs = a.imgs ? figs(a.imgs) : "";
        const note = a.note || "";
        return `<div class="day-activity"${id}><b>${a.label}</b>${a.detail ? ` <span class="day-detail">(${a.detail})</span>` : ""}${a.bookBy ? `<div class="day-book-by">🎫 ${a.bookBy}</div>` : ""}${desc}${imgs}${note}</div>`;
      })
      .join("") +
    `</div>`
  );
}

/**
 * days(items, cityKey) — renders a whole city's "Programma" section:
 * one .day-card per day, each with its date header, activity list
 * (via activitiesList above — each activity carries its own photos),
 * optional food note, and an optional day-level note.
 *
 * `items` is an array of day objects like:
 *   { date: "28 ott (mer)", activities: [...], note: "..." }
 * (photos live on the individual activity objects as `imgs`, not here —
 * see activitiesList()'s doc comment).
 * `cityKey` (e.g. "xian") is only used to build unique element ids —
 * pass null/undefined if you don't need ids for that day list.
 */
function days(items, cityKey) {
  return items
    .map((d, di) => {
      const idPrefix = cityKey
        ? `day-activity-${cityKey}-${slugDate(d.date)}`
        : null;
      return `
    <div class="day-card">
<div class="day-card-head">
  <div class="day-date">${d.date}</div>
</div>
${activitiesList(d.activities, idPrefix)}
${d.food ? `<div class="day-food">${d.food}</div>` : ""}
${d.note || ""}
    </div>`;
    })
    .join("");
}

/**
 * checklist(key, items) — renders a checklist card (checkbox + label per item).
 *
 * Each item can be a plain string (defaults to unchecked), or an object
 * { text, done } to start it pre-checked (e.g. once something is booked).
 * `key` (e.g. "beijing") is combined with the item's position to build the
 * data-ck id ("beijing-0", "beijing-1", ...) that the checkbox-persistence
 * code near the bottom of this file uses to remember what's checked in
 * localStorage — see loadCk()/saveCk() further down.
 */
function checklist(key, items) {
  return (
    `<div class="checklist-card"><div class="checklist">` +
    items
      .map((t, i) => {
        const item = typeof t === "string" ? { text: t, done: false } : t;
        const id = key + "-" + i;
        return `<label><input type="checkbox" data-ck="${id}"${item.done ? " checked" : ""}><span>${item.text}</span></label>`;
      })
      .join("") +
    `</div></div>`
  );
}

/**
 * escapeAttr(s) — makes a string safe to put inside an HTML attribute
 * (e.g. data-copy="..."). Without this, an address containing a `"` or
 * `&` could break out of the attribute and corrupt the HTML.
 */
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * hotelCard(h) — renders the hotel info box shown in each city panel.
 *
 * `h` fields (all optional except name):
 *   name, nameCn, sub  — hotel name, an optional Chinese-script name
 *                         shown next to it (not bold, so it doesn't
 *                         compete with the name), + a small subtitle line
 *   address            — shows an address line with a "copy" button
 *                         (data-action="copy-address", handled by the
 *                         ACTIONS dispatch table near the bottom of this file)
 *   website            — adds a "Sito web" link
 *   checkIn, checkOut  — shown as a small check-in/check-out row
 *   paras              — array of extra HTML paragraphs (cost, cancellation
 *                         policy, free-text notes — anything else worth saying)
 *   link               — adds a "Voucher PDF" download link
 */
function hotelCard(h) {
  const address = h.address
    ? `
    <div class="hotel-address">
<span>${h.address}</span>
<button class="copy-btn" data-action="copy-address" data-copy="${escapeAttr(h.address)}">📋 Copia</button>
    </div>`
    : "";
  const website = h.website
    ? `<div class="hotel-website">🌐 <a href="${h.website}" target="_blank">Sito web</a></div>`
    : "";
  const dates =
    h.checkIn || h.checkOut
      ? `
    <div class="hotel-dates">
${h.checkIn ? `<div><span class="hotel-date-label">Check-in:</span>${h.checkIn}</div>` : ""}
${h.checkIn && h.checkOut ? `<span class="hotel-date-sep">·</span>` : ""}
${h.checkOut ? `<div><span class="hotel-date-label">Check-out:</span>${h.checkOut}</div>` : ""}
    </div>`
      : "";
  return `<div class="hotel-card">
    <div class="hotel-head">
<div>
  <div class="hotel-name">${h.name}${h.nameCn ? ` <span class="hotel-name-cn">${h.nameCn}</span>` : ""}</div>
  ${h.sub ? `<div class="hotel-sub">${h.sub}</div>` : ""}
</div>
    </div>
    ${address}
    ${website}
    ${dates}
    ${(h.paras || []).map((p) => `<p>${p}</p>`).join("")}
    ${h.link ? `<a class="hotel-link" href="${h.link}" target="_blank">📄 Voucher PDF</a>` : ""}
  </div>`;
}

/**
 * foodCard(dishes) — renders the "Piatti da provare" (dishes to try) box.
 * `dishes` is an array of { name, detail, noBullet } — noBullet just
 * removes the bullet point for entries meant to read as a sub-item.
 */
function foodCard(dishes) {
  return `<div class="food-card">
    <div class="food-head">Piatti da provare</div>
    <ul>
${dishes.map((d) => `<li${d.noBullet ? ` class="no-bullet"` : ""}><b>${d.name}</b>${d.detail ? ` — ${d.detail}` : ""}</li>`).join("")}
    </ul>
  </div>`;
}

/**
 * arrivalCard(rows) — renders a simple label/value table, used for every
 * Arrivo/Partenza block and the international flights section.
 * `rows` is an array of [label, value] pairs, e.g.:
 *   [["Mezzo", "🚄 Treno alta velocità"], ["Partenza", "Pechino Ovest, 26 ott, ~10:30"], ...]
 */
function arrivalCard(rows) {
  return (
    `<div class="flight-leg">` +
    rows
      .map((r) => `<div class="flight-row"><span>${r[0]}</span>${r[1]}</div>`)
      .join("") +
    `</div>`
  );
}

/* One checklist array per city, passed to checklist() (see above) wherever
   that city's panel is built below. Each is reused in TWO places: inside
   the city's own panel, and again inside the combined "Checklist di
   viaggio" panel — same const, same array, so ticking a box in either
   place is really the same checkbox (same data-ck id) and stays in sync. */
const BEIJING_CHECKLIST = [
  '<b>🧭 Guida.</b> Prenotare la guida turistica <button class="mini-btn" data-action="go-to-beijing-guida">Vedi guida →</button>',
  "<b>🧭 Guida.</b> Verificare che i biglietti per le attrazioni siano inclusi nel tour guidato",
  '<b>🚄 Treno.</b> Prenotare treno per Pingyao <span style="color:var(--train)">(prenotabile tra il 26 set e l\'11 ott 2026)</span>',
];

const PINGYAO_CHECKLIST = [
  { text: "<b>🏨 Hotel.</b> Prenotare Hotel", done: true },
  "<b>🎫 Pingyao Ancient City Pass.</b> Comprare biglietto cumulativo di 3 giorni (~125 CNY / 16€), serve a visitare le 22 attrazioni di Pingyao",
  '<b>🚄 Treno.</b> Prenotare treno Pingyao–Xi\'an (partenza 17:00) <span style="color:var(--train)">(prenotabile tra il 27 set e il 12 ott 2026)</span>',
  "<b>💵 Contanti.</b> Portare un po' di contanti piccoli (banconote da 10/20 CNY) come riserva — bancarelle e taxi preferiscono Alipay/WeChat ma non tutti li accettano",
];

const XIAN_CHECKLIST = [
  { text: "<b>🏨 Hotel.</b> Prenotare Hotel", done: true },
  {
    text: "<b>🏺 Terracotta.</b> Prenotare in anticipo i biglietti dell'Esercito di Terracotta — importante soprattutto in weekend/festivi",
    done: true,
  },
  "<b>🧱 Mura.</b> Prenotare in anticipo l'ingresso alle Mura se si viaggia in weekend/festivi",
  '<b>🚄 Treno.</b> Prenotare treno Xi\'an–Chengdu (partenza 8:07) <span style="color:var(--train)">(prenotabile tra il 29 set e il 14 ott 2026)</span>',
];

const CHENGDU_CHECKLIST = [
  "<b>🏨 Hotel.</b> Prenotare Hotel",
  '<b>🐼 Panda.</b> Biglietti della Base dei Panda <span style="color:var(--train)">(apre 14 giorni prima, dal 16 ott 2026)</span>',
  '<b>🚄 Treno.</b> Prenotare treno Chengdu–Chongqing (partenza ~8:37) <span style="color:var(--train)">(prenotabile tra l\'1 e il 16 ott 2026)</span>',
];

const CHONGQING_CHECKLIST = [
  "<b>🏨 Hotel.</b> Prenotare Hotel",
  "<b>🚁 Droni.</b> Confermare che lo spettacolo di droni di Nanbin Rd sia ancora in programma il sabato sotto data (dipende dal meteo, si cancella con pioggia/vento forte) — tenere la crociera Liangjiang come riserva",
  '<b>🚄 Treno.</b> Prenotare treno Chongqing–Zhangjiajie (partenza 08:50) <span style="color:var(--train)">(prenotabile tra il 2 e il 17 ott 2026)</span>',
];

const ZHANGJIAJIE_CHECKLIST = [
  "<b>🏨 Hotel.</b> Prenotare Hotel",
  "<b>🏞️ Parco.</b> Prenotare in anticipo ingresso al parco + biglietti dell'ascensore Bailong",
  "<b>🌉 Ponte.</b> Prenotare il biglietto del Ponte di Vetro del Grand Canyon di Zhangjiajie",
  "<b>🚡 Funivia.</b> Prenotare in anticipo il biglietto della funivia del Tianmen Mountain — molto richiesta",
  '<b>🚄 Treno.</b> Confermare i biglietti dell\'alta velocità Zhangjiajie Ovest → Guilin, incluso il cambio a Changsha Sud <span style="color:var(--train)">(prenotabile tra il 4 e il 19 ott 2026)</span>',
];

const GUILIN_CHECKLIST = [
  "<b>🏨 Hotel.</b> Prenotare lo stesso hotel di Guilin per entrambe le notti (3 e 5 nov) se possibile, e confermare che custodiscano le valigie grandi durante la notte a Yangshuo",
  "<b>🚢 Crociera.</b> Prenotare in anticipo il biglietto della crociera sul fiume Li — ricontrollare i livelli dell'acqua sotto data; la zattera da Xingping è il piano B",
  "<b>🚗 Autista.</b> Prenotare l'autista privato per l'intera giornata del 5 nov (pickup a Yangshuo ~5:45 → Xianggong → Longsheng → Guilin) — concordare in anticipo tutto il percorso e il prezzo",
  "<b>🌄 Xianggong.</b> Verificare che il punto panoramico di Xianggong Mountain apra per l'alba (di norma sì — piccolo biglietto d'ingresso, ~60 CNY)",
  "<b>✈️ Volo.</b> Prenotare il volo serale Guilin → Shanghai (~18:30–19:30 su PVG) appena aprono gli orari di nov 2026",
];

/**
 * CONTENT — the heart of the whole page. One entry per city panel (plus
 * "flights", "checklist" and "money" for the non-city panels reachable
 * from the topbar). Each entry has:
 *   title, cn    — panel heading (cn = the Chinese name, shown smaller)
 *   dates        — shown under the title (e.g. "23–25 ott · 3 notti")
 *   body         — a big HTML string built from the helper functions
 *                  above (checklist, arrivalCard, days, hotelCard,
 *                  foodCard...) plus some hand-written HTML for the
 *                  one-off sections (Guida, Attività particolari, etc.)
 *
 * openPanel(key) (near the bottom of this file) is what actually reads
 * CONTENT[key] and injects .body into the page when you click a city.
 */
const CONTENT = {
  beijing: {
    title: "Beijing",
    cn: "北京",
    dates: "23–25 ott · 3 notti",
    body: `
<h3>Checklist</h3>
${checklist("beijing", BEIJING_CHECKLIST)}
<hr class="section-sep">
<h3>Arrivo</h3>
${arrivalCard([
  ["Mezzo", "✈️ Volo, Air China CA750"],
  ["Partenza", "Milano MXP, 22 ott, 20:00"],
  ["Durata", "10h10m"],
  ["Arrivo", "Pechino Daxing (PKX), 23 ott, 12:10"],
])}
<h3>Programma</h3>
${days(
  [
    {
      date: `23 ott (ven) <span class="day-date-sub">1/2 giornata</span>`,
      activities: [
        {
          label: "Wangfujing, via Qianmen, piazza Tienanmen",
          detail: "",
          desc:
            "Wangfujing è la via pedonale più famosa della città, piena di negozi e street food (compresi gli spiedini di scorpione)." +
            "<br>Via Qianmen (845m, a sud della piazza) è una strada pedonale ricostruita in stile tardo Qing con negozi e ristoranti d'epoca." +
            "<br>Piazza Tienanmen, una delle piazze più grandi al mondo, ospita il Museo Nazionale, la Sala Commemorativa di Mao e la porta Zhengyangmen." +
            "<br>",
          imgs: [
            ["wangfujing", "Wangfujing"],
            ["tiananmen", "Piazza Tienanmen"],
          ],
        },
      ],
    },
    {
      date: "24 ott (sab)",
      activities: [
        {
          label: "Città Proibita",
          detail: "mattina",
          desc: "Città Proibita — palazzo imperiale costruito tra il 1406 e il 1420 dall'imperatore Yongle, cuore del potere cinese per quasi 500 anni sotto le dinastie Ming e Qing (14 imperatori Ming, 10 Qing). Con 720.000 m² è il più grande complesso di palazzi imperiali al mondo, patrimonio UNESCO; dal 1925 è il Palace Museum. Il nome deriva dal divieto d'accesso imposto ai comuni sudditi.",
          imgs: [["forbidden_city", "Città Proibita"]],
        },
        {
          label: "Tempio del Cielo",
          detail: "pomeriggio",
          desc: "Tempio del Cielo — complesso di culto costruito nel 1420 dall'imperatore Yongle (stesso della Città Proibita), dove gli imperatori Ming e Qing celebravano riti per il buon raccolto e chiedevano favori al Cielo. Copre 2.730.000 m², quattro volte la Città Proibita; patrimonio UNESCO dal 1998 come capolavoro di architettura e paesaggio, simbolo del rapporto Terra-Cielo nella cosmogonia cinese.",
          imgs: [["temple_heaven", "Tempio del Cielo"]],
        },
      ],
    },
    {
      date: "25 ott (dom)",
      activities: [
        {
          label: "Grande Muraglia — Mutianyu",
          detail: "partenza dall'hotel ~6:30",
          desc: "Grande Muraglia — sezione Mutianyu, tra le meglio conservate, costruita nel VI secolo (dinastia Qi settentrionale) e ricostruita nel 1569 sotto i Ming come barriera difensiva nord per la capitale. A differenza di altre sezioni, ha merlature su entrambi i lati del cammino. Aperta al pubblico dal 1988.",
          imgs: [["mutianyu", "Grande Muraglia a Mutianyu"]],
          note:
            `<div class="note"><b>Tempistica Grande Muraglia:</b> arrivare all'apertura (~8:00) per battere i gruppi organizzati (picco di folla 10–14); messa dopo 2 notti di sonno per ammorbidire il jet lag sulla sveglia presto.</div>` +
            `<div class="note-grey"><b>Tratto di Muraglia:</b> scelta Mutianyu rispetto a Badaling (meno affollata, meglio conservata, ha comunque funivia/slittino) e a Jinshanling (troppo lontana — ~2,5h a tratta).</div>`,
        },
      ],
    },
    {
      date: "26 ott (lun)",
      activities: [
        {
          label: "Giro negli hutong",
          detail: "se c'è tempo",
          desc: "Hutong — vicoli storici con case a corte (siheyuan), risalenti alla dinastia Yuan (1271–1368); il nome viene dal mongolo \"hottog\" (pozzo d'acqua). Nel 1949 Pechino ne contava oltre 6.000, oggi ridotti a circa 1.000 grazie a 25 zone di tutela storica istituite nel 2005.",
          imgs: [["hutong", "Hutong di Pechino"]],
        },
      ],
    },
  ],
  "beijing",
)}
<h3>Partenza</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Pechino Ovest, 26 ott, ~10:30"],
  ["Durata", "~4h"],
  ["Arrivo", "Pingyao Gucheng, 26 ott, ~14:00–14:30"],
])}
<h3>Hotel</h3>
${hotelCard({
  name: "JianGuo Hidden Hotel",
  nameCn: "建國·璞隱酒店（北京天安門王府井店)",
  sub: "Beijing Tian An Men Wangfujing store",
  address: "No. 19 Jinyu Hutong, Dongcheng District, Beijing, China",
  website:
    "https://us.trip.com/hotels/beijing-hotel-detail-80943188/jianguo-hidden-hotel-beijing-wangfujing-store/",
  checkIn: "23 ott, dopo le 14:00",
  checkOut: "26 ott, entro le 12:00 (3 notti)",
  paras: [
    "<i>Costo:</i> €241,41 da pagare.",
    '<span class="hotel-sub">Cancellazione gratuita fino alle 18:00 del 23 ott, poi non rimborsabile.</span>',
    "In pieno Wangfujing/Dongcheng centrale — 10–15 min a piedi da Città Proibita e piazza Tienanmen, buoni collegamenti metro per il Tempio del Cielo e la stazione, Wangfujing Snack Street sotto casa.",
  ],
})}
<h3>Cibo</h3>
${foodCard([
  {
    name: "Anatra alla pechinese",
    detail: "il piatto essenziale di Pechino",
  },
  {
    name: "Da Dong",
    detail:
      "catena upscale che ha reinventato l'anatra alla pechinese in chiave moderna: pelle sottilissima e croccante, molto meno grassa del classico, presentazione curata; prenotazione consigliata",
    noBullet: true,
  },
  {
    name: "Siji Minfu",
    detail:
      "istituzione locale senza fronzoli, prezzo onesto rispetto ai big; la coda è la norma nelle ore di punta ma scorre veloce; vicino a Dongcheng",
    noBullet: true,
  },
  {
    name: "Quanjude (全聚德)",
    detail:
      'il nome più famoso e storico, dal 1864; forno "a sospensione" (挂炉) per pelle particolarmente croccante; sede principale su Qianmen Street',
    noBullet: true,
  },
  {
    name: "Bianyifang (便宜坊)",
    detail:
      'ancora più antico di Quanjude, dal 1416; maestro del forno "chiuso" (焖炉), che dà una carne più tenera',
    noBullet: true,
  },
  {
    name: "Hua Jiayi Yuan (花家怡园)",
    detail:
      "ambiente immersivo in un siheyuan (cortile tradizionale), ottimo taglio al tavolo in sala; l'anatra in sé è più standard rispetto agli specialisti",
    noBullet: true,
  },
  {
    name: "Hot pot di montone alla pechinese",
    detail:
      "Donglaishun; premio sostanzioso dopo una camminata, lo stile con salsa di sesamo è diverso dall'hot pot piccante del Sichuan che arriverà a Chengdu/Chongqing",
  },
  {
    name: "Spiedini e tanghulu",
    detail:
      "Wangfujing Snack Street; informale, senza prenotazione, perfetto per una serata d'arrivo a basso sforzo",
  },
  {
    name: "Haidilao",
    detail:
      "catena di hotpot nota non tanto per il piatto quanto per il servizio esagerato: manicure gratis mentre si aspetta il tavolo, spettacolo di tirata dei noodles al tavolo, snack e bevande a volontà, sconti a sorpresa per chi festeggia il compleanno; consigliato prenotare, soprattutto nel weekend",
  },
  {
    name: "中8楼 (Middle 8)",
    detail:
      "cucina yunnanese, tra le poche di questa regione a Pechino: sapori diversi dal resto della Cina (erbe di montagna, funghi selvatici, note agrodolci e piccanti non da peperoncino secco ma da spezie fresche), ambiente curato in stile etnico; buona alternativa se ci si stanca dei sapori del nord",
  },
  {
    name: "Yaoji Chaogan (姚记炒肝)",
    detail:
      "storica bottega di chao gan (fegato di maiale saltato in salsa densa d'amido) e baozi al vapore, specialità pechinese old-school da mangiare in piedi al bancone; vicino a Houhai/Yandaixie Street, prezzo bassissimo, esperienza più autentica che turistica",
  },
  {
    name: "Lu Zhu Huo Shao (卤煮火烧)",
    detail:
      "stufato di frattaglie e intestino di maiale con pane, da 门框胡同卤煮 vicino a Dashilar/Qianmen",
  },
  {
    name: "Dolci Daoxiangcun (稻香村)",
    detail: 'wandouhuang, aiwowo, lüdagun ("l\'asino che rotola")',
  },
])}
<h3 id="beijing-guida">Guida</h3>
<div class="card card-quote-wrap">
  <button class="mini-btn quote-btn" data-action="open-quote-modal" title="Richiedi preventivo" aria-label="Richiedi preventivo">✉️</button>
  <p>Da discutere con il compagno/a di viaggio — trovate via <a href="https://www.reddit.com/r/travelchina/comments/1dkj0nz/reputable_tour_groups_for_custom_tour_packages/" target="_blank">Reddit r/travelchina</a></p>
  <p><b>Nota:</b> richieste di preventivo:</p>
  <div class="quote-cards">
    <div class="quote-card">
      <a href="https://www.chinadiscovery.com/forms/thankyou.html" target="_blank">chinadiscovery.com</a>
      <span class="quote-card-date">11 ago 2026</span>
      <div class="quote-card-price">$346 <span class="quote-card-price-sub">a persona · $692 totale (2 pax)</span></div>
    </div>
    <div class="quote-card">
      <a href="https://www.asiaodysseytravel.com/" target="_blank">asiaodysseytravel.com</a>
      <span class="quote-card-date">11 ago 2026</span>
      <div class="quote-card-price">$282 <span class="quote-card-price-sub">a persona · $564 totale (2 pax)</span></div>
      <ul class="quote-card-links">
        <li><a href="https://www.asiaodysseytravel.com/beijing-tours/2-days-beijing-world-heritage-tour.html" target="_blank">2-Days Beijing World Heritage Tour</a></li>
        <li><a href="https://www.asiaodysseytravel.com/beijing-tours/1-day-beijing-tour.html" target="_blank">1-Day Beijing Tour</a></li>
      </ul>
    </div>
    <div class="quote-card">
      <a href="https://www.chinaculturetour.com/" target="_blank">chinaculturetour.com</a>
      <span class="quote-card-date">11 ago 2026</span>
      <div class="quote-card-price">$324 <span class="quote-card-price-sub">a persona · $648 totale (2 pax)</span></div>
    </div>
    <div class="quote-card">
      <a href="https://www.dgvtravel.com/" target="_blank">dgvtravel.com</a>
      <span class="quote-card-date">11 ago 2026 (via mail)</span>
      <div class="quote-card-pending">In attesa di risposta</div>
    </div>
  </div>
</div>
<h3>Attività particolari (promemoria)</h3>
<div class="card">
  <ul>
    <li><b>Spettacolo:</b> teatro Deyunshe (德云社) di crosstalk (xiangsheng) — forma d'arte genuinamente locale, pubblico quasi tutto del posto, solo in mandarino (conta l'atmosfera/energia più delle battute)</li>
    <li><b>Qualcosa di strano:</b> Lu Zhu Huo Shao (卤煮火烧) — stufato di frattaglie e intestino di maiale con pane, vero piatto popolare pechinese, per es. da 门框胡同卤煮 vicino a Dashilar/Qianmen</li>
    <li><b>Fuori dai giri turistici:</b> parco Ritan all'alba — gente del posto che fa tai chi, porta a spasso uccellini in gabbia, gioca a xiangqi, si esercita con spada/ventaglio</li>
    <li><b>Dolce curioso:</b> Daoxiangcun (稻香村), pasticceria centenaria — wandouhuang (dolce di farina di piselli), aiwowo (dolce di riso glutinoso), lüdagun ("l'asino che rotola")</li>
  </ul>
</div>
<h3>Saltati, di proposito</h3>
<div class="card">
  <p>Palazzo d'Estate (ridondante con la Città Proibita, richiede una mezza giornata a sé), Tempio dei Lama, distretto artistico 798 — non c'è spazio in 2,5 giorni senza sacrificare quanto sopra.</p>
  <p><b>Possibile esperienza guidata alternativa (non ancora prenotata):</b> <a href="https://www.getyourguide.com/pechino-l186/tour-privato-della-grande-muraglia-di-mutianyu-con-autista-inglese-t875282?ranking_uuid=8626a31c-46a3-4506-a9dc-09d94e9227df&amp;referral_redirect=1&amp;q=Mutianyu&amp;date_from=2026-10-25" target="_blank">Tour privato Grande Muraglia di Mutianyu con autista in inglese</a> su GetYourGuide — pickup in hotel, biglietti d'ingresso e navetta inclusi, ~90 min (75 km) fino al parcheggio di Mutianyu, ritrovo con l'autista alle 7:30 in hotel. È un autista in inglese, non una guida con narrazione lungo il percorso — da valutare come alternativa più economica alla guida privata già in programma.</p>
</div>`,
  },

  pingyao: {
    title: "Pingyao",
    cn: "平遥",
    dates: "26–27 ott · 1 notte",
    body: `
<h3>Checklist</h3>
${checklist("pingyao", PINGYAO_CHECKLIST)}
<hr class="section-sep">
<h3>Arrivo</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Pechino Ovest, 26 ott, ~10:30"],
  ["Durata", "~4h"],
  ["Arrivo", "Pingyao Gucheng, 26 ott, ~14:00–14:30"],
])}
<h3>Programma</h3>
${days(
  [
    {
      date: "26 ott (lun)",
      activities: [
        {
          label: "Via Ming-Qing e Tempio del Dio della Città",
          detail: "Chenghuangmiao",
          desc: "Via Ming-Qing — strada principale della città vecchia di Pingyao (patrimonio UNESCO), con edifici e negozi in stile Ming-Qing. Il Tempio del Dio della Città (Chenghuangmiao) è un tempio taoista con tre cortili e decorazioni intagliate risalenti a Ming e Qing.",
          imgs: [["pingyao", "Centro storico di Pingyao — via Ming-Qing"]],
        },
      ],
    },
    {
      date: "27 ott (mar)",
      activities: [
        {
          label: "Mura + Yamen",
          detail: "inizio ~8:30 per battere i gruppi",
          desc: "Mura di Pingyao — cinta muraria di 6 km ricostruita nel 1370, con 72 torrette. Lo Yamen è il più grande e meglio conservato ufficio di governo distrettuale antico della Cina, sede-tribunale-prigione del magistrato locale.",
          note: `<div class="note">La camminata sulle Mura è messa come prima cosa al mattino apposta per battere i gruppi organizzati, dato che l'accesso è incluso nel biglietto cumulativo e si affolla in fretta appena arrivano i pullman.</div>`,
        },
        {
          label: "Banca Rishengchang",
          detail: "la prima banca cinese",
          desc: "Banca Rishengchang (\"Alba Prosperosa\") — fondata nel 1823, prima banca cinese, nata da una piccola tintoria e diventata leader nei trasferimenti di denaro con filiali in 35 città e succursali fino in Europa e Stati Uniti. Oggi è un museo del sistema finanziario storico cinese.",
          imgs: [
            ["rishengchang", "Banca Rishengchang — la prima banca cinese"],
          ],
        },
        {
          label: "Torre della Città",
          desc: "Torre della Città — probabilmente del XIV secolo, unico edificio a più piani della città vecchia, alta 18,5 m. Fulcro del commercio in epoca Ming-Qing, con murales raffiguranti il Romanzo dei Tre Regni.",
        },
        {
          label: "Tempio di Confucio o shopping",
          detail: "opzionale, se c'è tempo",
          desc: "Tempio di Confucio — fondato nel 627-649 (dinastia Tang), tra i meglio conservati in Cina. La Sala Dacheng, ricostruita nel 1163, è la più antica sala confuciana esistente al mondo. Fino al 1370 ospitava gli esami imperiali; ha formato 12 primi ministri Ming-Qing.",
        },
      ],
    },
  ],
  "pingyao",
)}
<h3>Partenza</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Pingyao, 27 ott, ~17:00"],
  ["Durata", "~3h"],
  ["Arrivo", "Xi'an Nord, 27 ott, ~19:55"],
])}
<h3>Hotel</h3>
${hotelCard({
  name: "Qigongguan Inn",
  nameCn: "祁公馆(平遥店)",
  sub: "Camera Jiwenzhai Changongzhegui, letto king-size",
  address: "No. 13 Zhuanquanmen Lane, 031100 Pingyao, Shanxi, Cina",
  website:
    "https://it.trip.com/hotels/detail/?hotelId=2992785&checkIn=2026-10-26&checkOut=2026-10-27&locale=it-IT",
  checkIn: "26 ott, dopo le 14:00",
  checkOut: "27 ott, entro le 12:00 (1 notte)",
  paras: [
    "<i>Costo:</i> €44,26 prepagati.",
    '<span class="hotel-sub">Cancellazione gratuita fino alle 20:00 del 26 ott, poi penale di €13,28; non rimborsabile dopo le 21:00 del 26 ott.</span>',
    "Un hotel tradizionale a corte di epoca Qing con kang (letto in mattoni riscaldato) fa parte dell'esperienza — colazione per 2 inclusa il 27 ott. I taxi non possono entrare dentro le mura, quindi verificare con l'hotel se offrono il pickup con navetta elettrica dalla porta più vicina. Incluso: esperienza di stampa su pietra e transfer da per stazione (da prnotare con un giorno di anticipo)",
  ],
})}
<h3>Cibo</h3>
${foodCard([
  {
    name: "Manzo di Pingyao",
    detail: "piatto locale tipico, su via Ming-Qing",
  },
  { name: "Noodles tirati a mano", detail: "su via Ming-Qing" },
])}`,
  },

  xian: {
    title: "Xi'an",
    cn: "西安",
    dates: "27–28 ott · 2 notti",
    body: `
<h3>Checklist</h3>
${checklist("xian", XIAN_CHECKLIST)}
<hr class="section-sep">
<h3>Arrivo</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Pingyao, 27 ott, ~17:00"],
  ["Durata", "~3h"],
  ["Arrivo", "Xi'an Nord, 27 ott, ~19:55"],
])}
<h3>Programma</h3>
${days(
  [
    {
      date: "27 ott (mar)",
      activities: [{ label: "Check-in" }],
    },
    {
      date: "28 ott (mer)",
      activities: [
        {
          label: "Esercito di Terracotta",
          detail: "Didi dall'hotel ~7:30, il sito apre alle 8:30",
          desc: "Esercito di Terracotta — circa 8.000 guerrieri, 130 carri, 520 cavalli e 150 cavalli da guerra in argilla, sepolti in tre fosse vicino al mausoleo di Qin Shi Huang, primo imperatore della Cina unificata (221 a.C.), morto nel 210 a.C. Furono creati intorno al 210-209 a.C. per accompagnare e proteggere l'imperatore nell'aldilà; ogni statua ha volto, armi e posa individuali, probabilmente ispirati a soldati reali. Dimenticato per oltre 2.000 anni, fu scoperto per caso nel marzo 1974 da alcuni contadini che scavavano un pozzo nel villaggio di Xiyang; gli scavi ufficiali iniziarono a luglio dello stesso anno, seguiti dal ritrovamento delle Fosse 2 e 3 nel 1976. È considerato una delle maggiori scoperte archeologiche del XX secolo.",
          note:
            `<div class="note-green">` +
            `<p><b>Esercito di Terracotta — tour con guida in inglese (ingresso incluso)</b></p>` +
            `<p>28 ott, Emperor Qinshihuang's Mausoleum Site Museum — tour guidato in inglese dei Pit 1/2/3, pranzo non incluso. Ingresso: 08:50–09:00 (fascia alternativa 10:20–10:30).</p>` +
            `<p><i>Costo:</i> €56,20 per 2 persone, pagato (prenotazione n. 1688900421702146, PIN 7712).</p>` +
            `<p><b>Ritrovo:</b> Parcheggio 1 dell'Esercito di Terracotta, sotto la statua di Qin Shi Huang, distretto di Lintong — la guida tiene una bandiera rossa "Silk Road Holiday". Nessuna metro diretta (trasferimento ~2h); consigliato Didi/taxi (~1h dal centro, traffico scorrevole al mattino).</p>` +
            `<p><b>Da sapere:</b> ingresso con verifica passaporto (real-name entry — dati del passaporto devono corrispondere); in caso di ritardo si può entrare da soli col passaporto e riunirsi al gruppo nell'ordine Pit 2 → Pit 1 → Pit 3; nessun rimborso per ritardi o uscite anticipate dal gruppo; la guida non risponde al telefono durante il tour.</p>` +
            `</div>`,
          imgs: [["terracotta", "Esercito di Terracotta"]],
        },
        {
          label: "Pranzo nel Quartiere Musulmano",
          desc: "Quartiere Musulmano — nato lungo la Via della Seta con l'insediamento di mercanti arabi e persiani in epoca Tang, poi diventati la comunità Hui (musulmana cinese). Oggi conta circa 60.000 abitanti, oltre metà Hui, cuore della cultura islamica cinese e famoso per il food street con specialità come Yangrou Paomo e noodles Biangbiang.",
          imgs: [["muslim_quarter", "Quartiere Musulmano"]],
        },
        {
          label: "Giro in bici sulle Mura",
          detail: "dal South Gate",
          desc: "Mura di Xi'an — costruite tra il 1370 e il 1378 sotto i Ming. Lunghe 13,74 km con 18 porte, tra le cinte murarie meglio conservate della Cina, percorribili in bici.",
          imgs: [["xian_wall", "Giro in bici sulle Mura"]],
        },
        {
          label: "Torri della Campana e del Tamburo",
          detail: "esterni, sul percorso",
          desc: "Torre della Campana e del Tamburo — costruite nel 1384 e 1380 sotto i primi Ming, senza chiodi di ferro. Segnalavano il tempo alla città: la campana l'alba, il tamburo il tramonto. Tra le meglio conservate della Cina, sono simboli del centro storico di Xi'an.",
          imgs: [["xian_bell", "Torre della Campana di Xi'an"]],
        },
        {
          label: "Grande Pagoda dell'Oca Selvatica + spettacolo di fontane",
          detail: "se restano tempo ed energie",
          desc: "Grande Pagoda dell'Oca Selvatica — costruita nel 652 dal monaco Xuanzang per custodire le scritture buddhiste portate dall'India dopo un viaggio di 19 anni lungo la Via della Seta. Ricostruita nel 704, alta 64,5 m su 7 piani in mattoni. Patrimonio UNESCO; lo spettacolo di fontane si tiene nella piazza antistante la sera.",
          imgs: [["goose_pagoda", "Grande Pagoda dell'Oca Selvatica"]],
        },
      ],
    },
  ],
  "xian",
)}
<h3>Partenza</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Xi'an, 29 ott, 8:07"],
  ["Durata", "~3,5h"],
  ["Arrivo", "Chengdu Est, 29 ott, ~11:40 stimato"],
])}
<h3>Hotel</h3>
${hotelCard({
  name: "Center Hotel (Xi'an Bell Tower)",
  nameCn: "西安钟楼森德酒店",
  sub: "Camera con letto matrimoniale di lusso leggero",
  address: "No. 619 East Street, Beilin District, Xi'an, Shaanxi, Cina",
  website:
    "https://it.trip.com/hotels/detail/?hotelId=36148464&checkIn=2026-10-27&checkOut=2026-10-29&locale=it-IT",
  checkIn: "27 ott, dopo le 14:00",
  checkOut: "29 ott, entro le 13:00 (2 notti)",
  paras: [
    "<i>Costo:</i> €80,88 già pagato.",
    '<span class="hotel-sub">Cancellazione gratuita fino alle 18:00 del 27 ott, poi penale di €40,44; non rimborsabile dopo le 18:00 del 27 ott.</span>',
    "Colazione per 2 inclusa il 28 ott. Direttamente sulla Linea 2, corsa senza cambi dalla stazione di Xi'an Nord dove arriva il treno da Pingyao, e a pochi passi dal Quartiere Musulmano, dalle Torri della Campana/del Tamburo e dall'ingresso Sud delle Mura.",
  ],
})}
<h3>Cibo</h3>
${foodCard([
  {
    name: "Yangrou Paomo",
    detail: "zuppa di montone e pane, nel Quartiere Musulmano",
  },
  { name: "Noodles Biangbiang", detail: "nel Quartiere Musulmano" },
])}
<h3>Attività particolari (promemoria)</h3>
<div class="card">
  <ul>
    <li><b>Tappa alternativa:</b> Grande Moschea (Huajue Xiang) — architettura sino-islamica, più tranquilla delle vie del cibo del Quartiere Musulmano che la circondano</li>
    <li><b>Serata alternativa:</b> cena con spettacolo di danze della dinastia Tang — alternativa teatrale al solo spettacolo delle fontane</li>
  </ul>
</div>`,
  },

  chengdu: {
    title: "Chengdu",
    cn: "成都",
    dates: "29–30 ott · 2 notti",
    body: `
<h3>Checklist</h3>
${checklist("chengdu", CHENGDU_CHECKLIST)}
<hr class="section-sep">
<h3>Arrivo</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Xi'an, 29 ott, 8:07"],
  ["Durata", "~3,5h"],
  ["Arrivo", "Chengdu Est, 29 ott, ~11:40 stimato"],
])}
<h3>Programma</h3>
${days(
  [
    {
      date: "29 ott (gio)",
      activities: [
        {
          label: "Linea 2 fino all'hotel",
          bookBy:
            "Prenotare tra il 29 set e il 14 ott 2026 (finestra 15–30 gg prima della partenza)",
        },
        {
          label: "Vicoli antichi di Kuanzhai Xiangzi",
          detail: "pomeriggio",
          desc: "Kuanzhai Xiangzi — tre vicoli storici e 45 cortili, tra i complessi meglio conservati della Chengdu di epoca Qing. Nato nel 1718 come guarnigione manciù, oggi zona di cibo e cultura.",
          imgs: [["kuanzhai", "Vicoli antichi di Kuanzhai Xiangzi"]],
        },
        {
          label: "Cultura del tè al Parco del Popolo",
          detail: "casa da tè Heming",
          desc: "Casa da tè Heming — nel cuore del Parco del Popolo, aperta nel 1923, tra le teahouse più iconiche di Chengdu. Rito locale: sedie di bambù, tè al gelsomino nel gaiwan, versato con teiere dal lungo becco (arte tramandata da generazioni) — modo tradizionale di vivere la città al rallentatore.",
          imgs: [["peoples_park", "Parco del Popolo"]],
        },
      ],
    },
    {
      date: "30 ott (ven)",
      activities: [
        {
          label: "Base dei Panda Giganti",
          detail: "partenza ~7:00, ora del pasto",
          imgs: [["panda_base", "Base dei Panda Giganti"]],
        },
        {
          label: "Tempio Wuhou + via antica Jinli",
          detail: "opzionali, da saltare se stanchi",
          imgs: [["jinli", "Via antica Jinli"]],
        },
        {
          label: "Scultura del panda arrampicato",
          detail: "Chunxi Road/IFS",
        },
        {
          label: "SKP + spettacolo di luci delle torri di bambù",
          detail: "sera",
        },
      ],
    },
  ],
  "chengdu",
)}
<h3>Partenza</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Chengdu, 31 ott, ~8:37"],
  ["Durata", "~1,5–2h"],
  ["Arrivo", "31 ott, ~10:10–10:40 stimato"],
])}
<div class="note">La Base dei Panda è la prima cosa in programma perché i panda sono più attivi nella finestra del pasto mattutino, e la fascia d'ingresso del mattino è anche la prima a esaurirsi.</div>
<h3>Hotel</h3>
${hotelCard({
  name: "Vicino a piazza Tianfu / Chunxi Road",
  paras: [
    "All'incrocio delle linee metro 1 e 2, e la stazione di Chengdu Est (dove arriva il treno da Xi'an) è collegata direttamente con la Linea 2 in ~15 minuti senza cambi.",
  ],
})}
<h3>Cibo</h3>
${foodCard([
  { name: "Noodles Dan Dan", detail: "a Kuanzhai Xiangzi" },
  { name: "Ravioli Zhong", detail: "a Kuanzhai Xiangzi" },
  {
    name: "Hotpot del Sichuan",
    detail:
      "Shu Daoxia o Haidilao vicino a Chunxi Road; chiedere la pentola metà piccante/metà delicata se non si vuole tutto infuocato",
  },
  {
    name: "Cena moderna",
    detail: "dentro il centro commerciale SKP, vicino a Chunxi Road",
  },
])}
<h3>Guida</h3>
<p>Non serve — fai-da-te con metro/Didi; l'ingresso alla Base dei Panda si prenota online in anticipo.</p>
<h3>Attività particolari (promemoria)</h3>
<div class="card">
  <ul>
    <li><b>Serata alternativa:</b> spettacolo di cambio maschere dell'Opera del Sichuan (Bian Lian) al teatro Shufeng Yayun — le maschere cambiano colore in una frazione di secondo con un colpo di ventaglio</li>
  </ul>
</div>
<h3>Saltati, di proposito</h3>
<div class="card">
  <p>Tempio Wuhou — segnalato come opzionale/bassa priorità; prima cosa da tagliare se il giorno 2 si allunga o il gruppo è stanco, dato che la via Jinli lì fuori copre un terreno simile.</p>
</div>`,
  },

  chongqing: {
    title: "Chongqing",
    cn: "重庆",
    dates: "31 ott · 1 notte",
    body: `
<h3>Checklist</h3>
${checklist("chongqing", CHONGQING_CHECKLIST)}
<hr class="section-sep">
<h3>Arrivo</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Chengdu, 31 ott, ~8:37"],
  ["Durata", "~1,5–2h"],
  ["Arrivo", "31 ott, ~10:10–10:40 stimato"],
])}
<h3>Programma</h3>
${days(
  [
    {
      date: "31 ott (sab)",
      activities: [
        {
          label: "Bagagli in hotel",
          bookBy:
            "Prenotare tra l'1 e il 16 ott 2026 (finestra 15–30 gg prima della partenza)",
        },
        {
          label: "Stazione di Liziba",
          detail: "il treno che attraversa il palazzo, con la Linea 2",
          imgs: [["liziba", "Liziba — il treno che attraversa il palazzo"]],
        },
        {
          label: "Città vecchia di Ciqikou",
          imgs: [["ciqikou", "Città vecchia di Ciqikou"]],
        },
        {
          label: "Passerella di vetro The Crystal",
          detail: "Raffles City",
        },
        { label: "Cena hotpot", detail: "Jiefangbei" },
        {
          label: "Spettacolo di droni",
          detail: "terrazza Nanbin Rd/Changjiahui, Linea 6, ~20:30 il sabato",
        },
        {
          label: "Hongyadong illuminata",
          detail: "per chiudere la serata",
          imgs: [["hongyadong", "Hongyadong di notte"]],
        },
      ],
    },
  ],
  "chongqing",
)}
<h3>Partenza</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Chongqing, 1 nov, 08:50"],
  ["Durata", "~2,5h"],
  ["Arrivo", "Zhangjiajie Ovest, 1 nov, ~11:20 stimato"],
])}
<div class="note">L'ordine è: prima Liziba (serve la luce del giorno per la foto) → pranzo in città vecchia → passerella di vetro → cena hotpot → spettacolo di droni (inizio fisso ~20:30, dipende dal meteo) → Hongyadong per ultima perché è illuminata a qualsiasi ora e chiude la serata sulla riva opposta rispetto a dove finisce lo spettacolo dei droni. Il viaggio capita di sabato (31 ott), che è quando lo spettacolo di droni va normalmente in scena — da riconfermare sotto data.</div>
<h3>Hotel</h3>
${hotelCard({
  name: "Vicino a Jiefangbei / Xiaoshizi",
  paras: [
    "Sulle linee metro 1/2; essendo una tappa di una sola notte, stare a 5 minuti dalla metro permette di mollare i bagagli e ripartire subito senza perdere ritmo.",
  ],
})}
<h3>Cibo</h3>
${foodCard([
  { name: "Suanla Fen (noodles agropiccanti)", detail: "a Ciqikou" },
  { name: "Bingfen (dolce gelatinoso)", detail: "a Ciqikou" },
  {
    name: "Hotpot di Chongqing",
    detail: "pentola divisa Yuanyang, a Jiefangbei",
  },
])}
<h3>Guida</h3>
<p>Non serve — completamente fai-da-te con metro/Didi.</p>
<h3>Attività particolari (promemoria)</h3>
<div class="card">
  <ul>
    <li><b>Alternativa:</b> crociera sul fiume Liangjiang (~20€/150 CNY) — guardare lo spettacolo di droni dall'acqua invece che dalla piattaforma affollata</li>
  </ul>
</div>
<div class="warn"><b>Avviso fatica:</b> questo tratto accumula tre sveglie all'alba di fila — Base dei Panda ~7:00 (30 ott), il treno delle ~8:37 da Chengdu (31 ott) e il treno delle 08:50 per Zhangjiajie (1 nov) — e la serata di Chongqing arriva alle ~22:30 a Hongyadong. La stazione di Chongqing Est è a 30–40 min da Jiefangbei, quindi l'1 nov significa uscire dall'hotel alle ~7:15 dopo poco sonno. Dosare la serata di Chongqing di conseguenza (Hongyadong è la cosa naturale da accorciare).</div>
`,
  },

  zhangjiajie: {
    title: "Zhangjiajie",
    cn: "张家界",
    dates: "1–2 nov · 2 notti",
    body: `
<h3>Checklist</h3>
${checklist("zhangjiajie", ZHANGJIAJIE_CHECKLIST)}
<hr class="section-sep">
<h3>Arrivo</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità"],
  ["Partenza", "Chongqing, 1 nov, 08:50"],
  ["Durata", "~2,5h"],
  ["Arrivo", "Zhangjiajie Ovest, 1 nov, ~11:20 stimato"],
])}
<h3>Programma</h3>
${days(
  [
    {
      date: "1 nov (dom)",
      activities: [
        {
          label: "Didi per Wulingyuan e check-in",
          bookBy:
            "Prenotare tra il 2 e il 17 ott 2026 (finestra 15–30 gg prima della partenza)",
        },
        {
          label: "Ponte di Vetro del Grand Canyon di Zhangjiajie",
          detail: "pomeriggio",
          imgs: [["glass_bridge", "Ponte di Vetro del Grand Canyon"]],
        },
      ],
    },
    {
      date: "2 nov (lun)",
      activities: [
        {
          label: "Parco nazionale, giornata intera",
          detail: "al cancello presto per battere le code",
        },
        {
          label: "Ascensore Bailong",
          detail:
            "fino a Yuanjiajie — pilastri di Avatar + Primo Ponte Sotto il Cielo",
          imgs: [["zjj_park", "Yuanjiajie — i pilastri di Avatar"]],
        },
        {
          label: "Tianzi Mountain + Galleria delle Dieci Miglia",
          detail: "pomeriggio",
          imgs: [["tianzi", "Tianzi Mountain"]],
        },
        {
          label: "Furong Zhen",
          detail:
            "puntata serale in alta velocità, 20–25min, città-cascata illuminata",
          bookBy:
            "Prenotare tra il 3 e il 18 ott 2026 (finestra 15–30 gg prima della partenza)",
          imgs: [["furong_zhen", "Furong Zhen, la città-cascata"]],
        },
      ],
    },
    {
      date: "3 nov (mar)",
      activities: [
        {
          label: "Check-out",
          detail: "~6:45, bagagli nel deposito della funivia",
        },
        {
          label: "Funivia Tianmen Mountain",
          detail: "in coda entro le ~7:30, apertura",
          imgs: [["tianmen", "Tianmen Mountain"]],
        },
        { label: "Glass Skywalk + passerelle a strapiombo" },
        {
          label: "Grotta di Tianmen",
          detail: "scale mobili + 999 gradini",
        },
        {
          label: "Stop tassativo giù dalla montagna",
          detail: "entro le 11:30",
        },
        {
          label: "Didi per Zhangjiajie Ovest",
          detail: "~30min",
          bookBy:
            "Prenotare tra il 4 e il 19 ott 2026 (finestra 15–30 gg prima della partenza) — tratta collo di bottiglia, prenotare appena possibile",
        },
      ],
    },
  ],
  "zhangjiajie",
)}
<h3>Partenza</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità (cambio a Changsha Sud)"],
  ["Partenza", "Zhangjiajie, 3 nov, 13:07"],
  ["Durata", "~6h"],
  ["Arrivo", "3 nov, ~19:00–19:30 stimato"],
])}
<div class="note">Il giorno del parco (2 nov) inizia al cancello per battere la coda dell'ascensore Bailong. Furong Zhen è aggiunta come extra serale leggero con un breve salto in alta velocità, dato che è a soli 20–25 minuti ed è illuminata di notte — i bagagli restano all'hotel di Wulingyuan quindi è un'andata e ritorno veloce.</div>
<div class="warn"><b>Tempistica Tianmen (3 nov):</b> il giro completo ci sta nella finestra 7:30–11:30 — ma per un pelo, e solo partendo all'apertura. Inizio novembre in un giorno feriale è bassa stagione, quindi le code dovrebbero essere gestibili; comunque questo si incastra direttamente col treno collo-di-bottiglia del viaggio, quindi trattare le 11:30 come non negoziabili. Se la mattina va lunga (coda in funivia, ritardo per meteo), l'ordine dei sacrifici è: saltare la discesa dei 999 gradini (usare scale mobili + navetta), poi accorciare le passerelle a strapiombo — il Glass Skywalk e la Grotta di Tianmen sono i due da tenere.</div>
<h3>Hotel</h3>
${hotelCard({
  name: "Wulingyuan",
  paras: [
    "La cittadina base proprio ai piedi del parco, evita il pendolarismo quotidiano verso l'area panoramica.",
  ],
})}
<h3>Cibo</h3>
${foodCard([
  { name: "San Guo Zhi", detail: "stufato in coccio, cucina Tujia" },
  { name: "La Rou", detail: "pancetta affumicata, cucina Tujia" },
  { name: "Tofu di riso", detail: "a Furong Zhen" },
  { name: "Cena", detail: "su via antica Xibu, con passeggiata serale" },
])}
<h3>Guida</h3>
<p>Non serve — fai-da-te con le navette interne del parco + Didi per i trasferimenti.</p>`,
  },

  guilin: {
    title: "Guilin e Yangshuo",
    cn: "桂林 · 阳朔",
    dates: "3–6 nov · 3 notti",
    body: `
<h3>Checklist</h3>
${checklist("guilin", GUILIN_CHECKLIST)}
<hr class="section-sep">
<h3>Arrivo</h3>
${arrivalCard([
  ["Mezzo", "🚄 Treno alta velocità (cambio a Changsha Sud)"],
  ["Partenza", "Zhangjiajie, 3 nov, 13:07"],
  ["Durata", "~6h"],
  ["Arrivo", "3 nov, ~19:00–19:30 stimato"],
])}
<h3>Programma</h3>
${days(
  [
    {
      date: "3 nov (mar)",
      activities: [
        {
          label: "Check-in",
          imgs: [["sun_moon_pagodas", "Pagode del Sole e della Luna"]],
        },
      ],
    },
    {
      date: "4 nov (mer)",
      activities: [
        {
          label: "Crociera sul fiume Li",
          detail:
            "Guilin → Yangshuo, ~4h, pranzo a buffet a bordo, vista sulla banconota da 20 yuan",
          imgs: [["li_river", "Crociera sul fiume Li"]],
        },
        {
          label: "Campagna di Yangshuo / fiume Yulong",
          detail: "in bici o su zattera di bambù",
          imgs: [["yulong_river", "Fiume Yulong"]],
        },
      ],
    },
    {
      date: "5 nov (gio)",
      activities: [
        {
          label: "Xianggong Mountain all'alba",
          detail: "pickup a Yangshuo ~5:45, alba ~6:55 sull'ansa del fiume Li",
          imgs: [
            ["xianggong", "Alba sull'ansa del fiume Li — Xianggong Mountain"],
          ],
        },
        {
          label: "Risaie di Longsheng",
          detail:
            "~3–3,5h di strada, pranzo nel villaggio, camminata fino alle ~15:00",
          imgs: [["longsheng", "Risaie di Longsheng"]],
        },
        { label: "Rientro a Guilin", detail: "~17:00–17:30, check-in" },
        {
          label: "Pagode del Sole e della Luna",
          detail: "illuminate la sera",
        },
      ],
    },
    {
      date: "6 nov (ven)",
      activities: [
        {
          label: "Ultima mattina rilassata",
          detail: "sveglia con calma",
        },
        { label: "Parco delle Sette Stelle", detail: "opzionale" },
        {
          label: "Pranzo tardi e shopping di souvenir",
          detail: "salsa di peperoncino, caramelle di giuggiola",
        },
        { label: "Aeroporto", detail: "entro le ~16:30" },
      ],
    },
  ],
  "guilin",
)}
<h3>Partenza</h3>
${arrivalCard([
  ["Mezzo", "✈️ Volo"],
  ["Partenza", "Guilin, 6 nov, ~18:30–19:30 stimato"],
  ["Durata", "~2h15m"],
  ["Arrivo", "Shanghai PVG, 6 nov, ~21:00–21:45 stimato"],
])}
<div class="note">Il 5 nov è un unico grande arco con un solo autista per tutta la giornata: Xianggong (~45min da Yangshuo) e Longsheng (~2–2,5h a nord-ovest di Guilin) stanno su lati opposti di Guilin, quindi il percorso è Yangshuo → Xianggong → oltre Guilin → Longsheng → Guilin — circa 5,5–6h di guida totali. L'alba è <i>il</i> momento per Xianggong: il sole sorge alle ~6:55 a inizio novembre e lo scatto classico è la nebbia mattutina sull'ansa del fiume Li — anche se la nebbia fitta è un rischio reale senza piano B a quell'ora (se è tutto coperto, si prosegue dritti per Longsheng). A inizio novembre il riso di Longji è già raccolto, quindi aspettarsi terrazze a strati marroni/a specchio d'acqua più che dorate. Il vantaggio: il giorno del volo non ha nessun trasferimento lungo — la mattina del 6 nov diventa un vero cuscinetto. Nota: è un'altra sveglia alle ~5:30, incorniciata dalla giornata rilassata di crociera prima e dalla mattina libera dopo.</div>
<div class="note"><b>Volo Guilin → Shanghai (6 nov):</b> verificato — KWL→PVG ha ~6 partenze dirette al giorno (China Eastern, Juneyao, Spring, Air China, Shanghai Airlines) distribuite dalle ~07:00 alle ~22:35, ~2h15m di volo. <b>Puntare a una partenza serale attorno alle 18:30–19:30 su PVG</b> (arrivo ~21:00–21:45, hotel entro le ~23:00): abbastanza presto per andare a dormire a un'ora decente a Shanghai, e con Longsheng spostato al 5 nov il giorno della partenza è del tutto senza fretta — nessun rischio di lunghi trasferimenti tra la sveglia e il gate. Gli orari di nov 2026 non sono ancora caricati — prenotare appena disponibili.</div>
<div class="note"><b>Piano B crociera fiume Li:</b> ott/nov è la stagione secca del Guangxi; l'acqua bassa può accorciare la crociera o sostituirne una parte con un bus. In quel caso, il piano B per il 4 nov è: Didi/bus per Xingping (~1h da Guilin), zattera di bambù sul tratto Xingping → Murale dei Nove Cavalli — che include il vero punto panoramico della banconota da 20 yuan — poi si prosegue su strada fino a Yangshuo. Stessi paesaggi chiave, barche adatte all'acqua bassa.</div>
<h3>Hotel</h3>
${hotelCard({
  name: "Guilin centrale + Yangshuo (soggiorno spezzato)",
  paras: [
    "Guilin centrale per entrambe le notti a Guilin (vicino a Due Fiumi e Quattro Laghi/Pagode del Sole e della Luna va bene sia per l'arrivo che per il ritorno); centro di Yangshuo o campagna lungo il fiume per la notte lì.",
  ],
})}
<h3>Cibo</h3>
${foodCard([
  {
    name: "Mifen (noodles di riso di Guilin)",
    detail: "informale, aperto fino a tardi",
  },
  {
    name: "Pranzo a buffet",
    detail: "a bordo della crociera sul fiume Li",
  },
  { name: "Beer Fish", detail: "su West Street, Yangshuo" },
  {
    name: "Pranzo",
    detail:
      "nel villaggio di Longsheng, tra una camminata e l'altra tra le terrazze",
  },
  {
    name: "Cucina Guangxi",
    detail: "vicino alle Pagode del Sole e della Luna, Guilin",
  },
])}
<h3>Guida</h3>
<p>Non serve — fai-da-te con Didi/taxi e il biglietto della crociera sul fiume Li; l'unica cosa da prenotare è un autista privato per l'intera giornata del 5 nov (pickup a Yangshuo prima dell'alba → alba a Xianggong → Longsheng → rientro a Guilin).</p>
<h3>Saltati, di proposito</h3>
<div class="card">
  <p>Collina della Proboscide d'Elefante e Grotta del Flauto di Canna — le due tappe più da pullman turistico di Guilin, tolte per fare spazio all'arco Xianggong-all'alba + Longsheng del 5 nov; il Parco delle Sette Stelle resta come riempitivo opzionale della mattina libera del 6 nov.</p>
</div>
<div class="note"><b>Bagagli:</b> le valigie grandi non hanno posto sulla barca della crociera (realisticamente solo bagaglio a mano). Visto che comunque torniamo a Guilin il 5 nov, lasciare le valigie grandi all'hotel di Guilin e portare una borsa da una notte a testa a Yangshuo — chiedere all'hotel di custodirle già in fase di prenotazione (richiesta standard, soprattutto se riprenotiamo lo stesso hotel per entrambe le notti di Guilin).</div>`,
  },

  shanghai: {
    title: "Shanghai",
    cn: "上海",
    dates: "6–8 nov · 2 notti",
    body: `
<div class="warn"><b>DA FARE — non ancora studiata.</b> La guida ha solo un titolo segnaposto per Shanghai ("24 ore a Shanghai") senza contenuto. Mancano ancora: cosa visitare/saltare e perché, zona hotel, cibo, checklist.</div>
<p>Arrivo la sera del 6 nov col volo da Guilin (~21:00–21:45 su PVG, hotel entro le ~23:00); il 7 nov è una giornata libera prima di andare a PVG per il volo notturno delle 01:45 dell'8 nov.</p>
<img class="hero-img" src="${IMG.bund}" loading="lazy" alt="Il Bund, Shanghai">
<p style="font-size:10.5px;color:var(--muted);margin-top:2px">Il Bund — il candidato ovvio per la giornata libera, una volta studiata</p>`,
  },

  flights: {
    title: "Voli internazionali",
    body: `
<div class="flight-legs">
  <div class="flight-leg-wrap">
    <h4 class="flight-leg-title">Andata</h4>
    <div class="flight-leg">
      <div class="flight-row"><span>Compagnia</span><b>Air China</b></div>
      <div class="flight-row"><span>Volo</span><b>CA750</b></div>
      <div class="flight-row"><span>Tratta</span><b>Milano MXP (T1) → Pechino PKX (Daxing)</b></div>
      <div class="flight-row"><span>Data</span><b>gio 22 ott 2026</b></div>
      <div class="flight-row"><span>Partenza</span><b>20:00</b></div>
      <div class="flight-row"><span>Arrivo</span><b>12:10 (+1 giorno)</b></div>
      <div class="flight-row"><span>Durata</span><b>10h10m</b></div>
      <div class="flight-row"><span>Bagaglio</span><b>1 bagaglio in stiva/pax (gratis)</b></div>
    </div>
  </div>
  <div class="flight-leg-wrap">
    <h4 class="flight-leg-title">Ritorno</h4>
    <div class="flight-leg">
      <div class="flight-row"><span>Compagnia</span><b>Air China</b></div>
      <div class="flight-row"><span>Volo</span><b>CA967</b></div>
      <div class="flight-row"><span>Tratta</span><b>Shanghai PVG (T2) → Milano MXP (T1)</b></div>
      <div class="flight-row"><span>Data</span><b>dom 8 nov 2026</b></div>
      <div class="flight-row"><span>Partenza</span><b>01:45</b></div>
      <div class="flight-row"><span>Arrivo</span><b>07:15</b></div>
      <div class="flight-row"><span>Durata</span><b>12h30m</b></div>
      <div class="flight-row"><span>Bagaglio</span><b>1 bagaglio in stiva/pax (gratis)</b></div>
    </div>
  </div>
</div>`,
  },

  checklist: {
    title: "Checklist di viaggio",
    body: `
<h3>Generale</h3>
${checklist("trip", [
  {
    text: "<b>🛂 Visto.</b> I passaporti italiani rientrano attualmente nella finestra di esenzione dal visto (soggiorni di 30 giorni).",
    done: true,
  },
  {
    text: "<b>🪪 Passaporti.</b> Scadenza passaporti, ok per entrambi",
    done: true,
  },
  "<b>🔒 VPN.</b> Configurare una VPN prima della partenza — Google, Maps, WhatsApp, Instagram sono bloccati in Cina; molto più difficile installarla una volta lì",
  "<b>💳 APP.</b> Configurare Alipay (o WeChat Pay) collegato a una carta straniera — la Cina è in gran parte cashless, molti esercenti non accettano né carte straniere né contanti",
  "<b>🗺️ APP.</b> Scaricare DiDi (app taxi) e Amap/Baidu Maps — Google Maps è inaffidabile/bloccato",
  "<b>📶 eSIM.</b> Procurare eSIM cinese o confermare il roaming dati",
  "<b>🛡️ Assicurazione.</b> 10% di sconto con Columbus",
])}
<h3>Beijing</h3>
${checklist("beijing", BEIJING_CHECKLIST)}
<h3>Pingyao</h3>
${checklist("pingyao", PINGYAO_CHECKLIST)}
<h3>Xi'an</h3>
${checklist("xian", XIAN_CHECKLIST)}
<h3>Chengdu</h3>
${checklist("chengdu", CHENGDU_CHECKLIST)}
<h3>Chongqing</h3>
${checklist("chongqing", CHONGQING_CHECKLIST)}
<h3>Zhangjiajie</h3>
${checklist("zhangjiajie", ZHANGJIAJIE_CHECKLIST)}
<h3>Guilin</h3>
${checklist("guilin", GUILIN_CHECKLIST)}`,
  },

  money: {
    title: "Riepilogo spese",
    body: `
<div class="card" style="display:flex;justify-content:space-between;align-items:center">
  <b>Totale stimato</b>
  <div style="text-align:right">
    <div style="font-size:20px;font-weight:700">€ 3.628,90</div>
    <div style="font-size:11px;color:var(--muted)">€ 1.814,45 a persona</div>
  </div>
</div>

<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Voli</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Andata e ritorno</span><b class="cost-certain">€ 1.493,56</b></div>
  </div>
</div>
<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Pechino</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Albergo Pechino</span><b class="cost-certain">€ 241,00</b></div>
    <div class="flight-row"><span>Guida turistica</span><b class="cost-expected">€ 584,00</b></div>
    <div class="flight-row"><span>Treno Pechino–Pingyao</span><b class="cost-expected">€ 60,00</b></div>
  </div>
</div>
<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Pingyao</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Risciò e lanterne rosse</span><b class="cost-expected">€ 32,00</b></div>
    <div class="flight-row"><span>Albergo Pingyao</span><b class="cost-certain">€ 44,26</b></div>
    <div class="flight-row"><span>Treno Pingyao–Xi'an</span><b class="cost-expected">€ 40,00</b></div>
  </div>
</div>
<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Xi'an</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Albergo Xi'an</span><b class="cost-certain">€ 80,88</b></div>
    <div class="flight-row"><span>Esercito di Terracotta (tour + ingresso, 2 pers.)</span><b class="cost-certain">€ 56,20</b></div>
    <div class="flight-row"><span>Treno Xi'an–Chengdu</span><b class="cost-expected">€ 60,00</b></div>
  </div>
</div>
<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Chengdu</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Albergo Chengdu</span><b class="cost-expected">€ 66,00</b></div>
    <div class="flight-row"><span>Riserva Panda</span><b class="cost-expected">€ 14,00</b></div>
    <div class="flight-row"><span>Treno Chengdu–Chongqing</span><b class="cost-expected">€ 40,00</b></div>
  </div>
</div>
<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Chongqing</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Albergo Chongqing</span><b class="cost-expected">€ 56,00</b></div>
    <div class="flight-row"><span>Treno Chongqing–Zhangjiajie</span><b class="cost-expected">€ 60,00</b></div>
  </div>
</div>
<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Zhangjiajie</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Grand Canyon di Zhangjiajie (Ponte di Vetro)</span><b class="cost-expected">€ 32,00</b></div>
    <div class="flight-row"><span>Albergo Zhangjiajie</span><b class="cost-expected">€ 38,00</b></div>
    <div class="flight-row"><span>Parco Nazionale di Zhangjiajie / Ascensore Bailong</span><b class="cost-expected">€ 100,00</b></div>
    <div class="flight-row"><span>Montagna Tianzi / Ten-Mile Gallery / Furong</span><b class="cost-expected">€ 10,00</b></div>
    <div class="flight-row"><span>Treno Zhangjiajie–Guilin</span><b class="cost-expected">€ 120,00</b></div>
  </div>
</div>
<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Guilin</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Monte Tianmen e Glass Skywalk</span><b class="cost-expected">€ 70,00</b></div>
    <div class="flight-row"><span>Albergo Guilin</span><b class="cost-expected">€ 37,00</b></div>
  </div>
</div>
<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Yangshuo</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Crociera panoramica sul Fiume Li</span><b class="cost-expected">€ 120,00</b></div>
    <div class="flight-row"><span>Campagna di Yangshuo e Fiume Yulong</span><b class="cost-expected">€ 40,00</b></div>
    <div class="flight-row"><span>Albergo Yangshuo</span><b class="cost-expected">€ 62,00</b></div>
  </div>
</div>
<div class="flight-leg-wrap">
  <h4 class="flight-leg-title">Guilin</h4>
  <div class="flight-leg">
    <div class="flight-row"><span>Monte Xianggong</span><b class="cost-expected">€ 15,00</b></div>
    <div class="flight-row"><span>Terrazze di riso di Longsheng</span><b class="cost-expected">€ 20,00</b></div>
    <div class="flight-row"><span>Albergo Guilin</span><b class="cost-expected">€ 37,00</b></div>
  </div>
</div>`,
  },
};

/* =========================================================
   MAPPA — building the Leaflet map and everything on it.
   Uses the Leaflet library (loaded via CDN in index.html, global `L`).
   ========================================================= */

// Create the map, centered roughly on central China, and add the base
// map tiles (the actual street/terrain imagery) from a free CARTO tile server.
const map = L.map("map", { zoomControl: true }).setView([31.0, 111.5], 5);
map.zoomControl.setPosition("bottomright");

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  },
).addTo(map);

// STOPS — every city where we actually sleep a night (or, for Yangshuo,
// a notable waypoint). Each gets a big numbered pin on the map (drawn
// further down) that opens that city's panel (CONTENT[key]) on click.
// Note Guilin appears twice (n:7 and n:8-labelled "Yangshuo") because the
// Guilin stay is split around a night in Yangshuo — both pins open the
// same "guilin" panel (see `key: "guilin"` on both).
const STOPS = [
  {
    key: "beijing",
    n: 1,
    name: "Beijing",
    ll: [39.9042, 116.4074],
    dates: "23–25 ott",
  },
  {
    key: "pingyao",
    n: 2,
    name: "Pingyao",
    ll: [37.2009, 112.1747],
    dates: "26 ott",
  },
  {
    key: "xian",
    n: 3,
    name: "Xi'an",
    ll: [34.3416, 108.9398],
    dates: "27–28 ott",
  },
  {
    key: "chengdu",
    n: 4,
    name: "Chengdu",
    ll: [30.5728, 104.0668],
    dates: "29–30 ott",
  },
  {
    key: "chongqing",
    n: 5,
    name: "Chongqing",
    ll: [29.563, 106.5516],
    dates: "31 ott",
  },
  {
    key: "zhangjiajie",
    n: 6,
    name: "Zhangjiajie",
    ll: [29.3455, 110.543],
    dates: "1–2 nov",
  },
  {
    key: "guilin",
    n: 7,
    name: "Guilin",
    ll: [25.2744, 110.29],
    dates: "3 e 5 nov (soggiorno spezzato)",
  },
  {
    key: "guilin",
    n: 8,
    name: "Yangshuo",
    ll: [24.7786, 110.4966],
    dates: "4 nov",
  },
  {
    key: "shanghai",
    n: 9,
    name: "Shanghai",
    ll: [31.2304, 121.4737],
    dates: "6–7 nov",
  },
];

// SIDE_TRIPS — day-excursions away from a base city (Great Wall, Terracotta
// Army, etc). These get the small brown/side-pin dot (always visible,
// any zoom level) with a popup showing a photo + short description.
const SIDE_TRIPS = [
  {
    name: "Grande Muraglia a Mutianyu",
    ll: [40.4319, 116.5704],
    img: "mutianyu",
    txt: "Gita da Pechino — 25 ott, partenza 6:30 con guida/transfer privato; funivia in salita, slittino in discesa.",
  },
  {
    name: "Esercito di Terracotta (Lintong)",
    ll: [34.3841, 109.2785],
    img: "terracotta",
    txt: "Gita da Xi'an — 28 ott, Didi alle ~7:30 per battere i pullman turistici; il sito apre alle 8:30.",
  },
  {
    name: "Ponte di Vetro del Grand Canyon",
    ll: [29.4079, 110.7573],
    img: "glass_bridge",
    txt: "Zhangjiajie — pomeriggio dell'1 nov, subito dopo l'arrivo e il check-in a Wulingyuan.",
  },
  {
    name: "Furong Zhen",
    ll: [28.9855, 109.8266],
    img: "furong_zhen",
    txt: "Puntata serale da Zhangjiajie — 2 nov, 20–25min in alta velocità; città-cascata illuminata, cena a base di tofu di riso, rientro con uno degli ultimi treni.",
  },
  {
    name: "Tianmen Mountain",
    ll: [29.05, 110.479],
    img: "tianmen",
    txt: "Mattina del 3 nov prima del treno per Guilin — funivia all'apertura delle 7:30, stop tassativo giù dalla montagna entro le 11:30.",
  },
  {
    name: "Xianggong Mountain",
    ll: [24.8385, 110.4116],
    img: "xianggong",
    txt: "Alba del 5 nov — l'autista passa a Yangshuo ~5:45, in cima per l'alba delle ~6:55 sull'ansa del fiume Li; poi dritti verso Longsheng.",
  },
  {
    name: "Xingping (piano B crociera)",
    ll: [24.881, 110.494],
    img: "xingping",
    txt: "Piano B per il 4 nov se l'acqua del fiume Li è bassa: zattera di bambù sul tratto Xingping → Murale dei Nove Cavalli (include il punto panoramico della banconota da 20 yuan).",
  },
  {
    name: "Risaie di Longsheng",
    ll: [25.7515, 110.0914],
    img: "longsheng",
    txt: "Mezzogiorno del 5 nov — ~3–3,5h di strada da Xianggong, pranzo nel villaggio e camminata tra le terrazze fino alle ~15:00, rientro a Guilin ~17:00–17:30. A inizio nov il riso è già raccolto: terrazze a strati marroni/a specchio d'acqua più che dorate.",
  },
];

// Draw the big numbered pins for STOPS: clicking one opens that city's
// panel directly (no data-action needed here — Leaflet's own .on("click", ...)
// handles it, since these markers are created in JS, not injected HTML).
// A second, non-interactive marker draws the always-visible text label
// next to each pin.
STOPS.forEach((s) => {
  const icon = L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div class="stop-pin">${s.n}</div>`,
  });
  L.marker(s.ll, { icon, zIndexOffset: 500 })
    .addTo(map)
    .bindTooltip(`<b>${s.name}</b><br>${s.dates}`, {
      direction: "top",
      offset: [0, -12],
    })
    .on("click", () => openPanel(s.key));

  const labelIcon = L.divIcon({
    className: "",
    iconSize: [0, 0],
    iconAnchor: [-12, -6],
    html: `<div class="stop-label">${s.name}</div>`,
  });
  L.marker(s.ll, {
    icon: labelIcon,
    zIndexOffset: 500,
    interactive: false,
  }).addTo(map);
});

// side-trip pins
SIDE_TRIPS.forEach((s) => {
  const icon = L.divIcon({
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div class="side-pin"></div>`,
  });
  L.marker(s.ll, { icon })
    .addTo(map)
    .bindTooltip(`<b>${s.name}</b>`, {
      direction: "top",
      offset: [0, -8],
    })
    .bindPopup(
      `<img class="side-img" src="${IMG[s.img]}" loading="lazy" alt="${s.name}"><b>${s.name}</b><br>${s.txt}`,
      { maxWidth: 250 },
    );
});

// IN_CITY_TRIPS — smaller landmarks *inside* a city (as opposed to a
// day-trip out of it). Same look as SIDE_TRIPS, but only shown once you've
// zoomed in past IN_CITY_MIN_ZOOM (see syncInCityLayer() below) — at the
// whole-country zoom level they'd just clutter the map.
const IN_CITY_TRIPS = [
  {
    name: "Città Proibita",
    ll: [39.9163, 116.3972],
    img: "forbidden_city",
    txt: "Reggia imperiale Ming-Qing, cuore della città vecchia — a due passi da Tian'anmen.",
  },
  {
    name: "Tempio del Cielo",
    ll: [39.8822, 116.4066],
    img: "temple_heaven",
    txt: "Dove gli imperatori pregavano per il buon raccolto; grande parco intorno.",
  },
  {
    name: "Hutong (Nanluoguxiang)",
    ll: [39.9368, 116.4034],
    img: "hutong",
    txt: "Vicoli storici pechinesi, negozietti e street food.",
  },
  {
    name: "Wangfujing",
    ll: [39.9139, 116.4177],
    img: "wangfujing",
    txt: "Via pedonale dello shopping, snack di strada (anche i più esotici).",
  },
  {
    name: "Via Ming-Qing",
    ll: [37.2013, 112.1743],
    img: "pingyao",
    txt: "L'asse storico di Pingyao dentro le mura — negozi tradizionali, lanterne rosse accese la sera.",
  },
  {
    name: "Banca Rishengchang",
    ll: [37.2018, 112.1734],
    img: "rishengchang",
    txt: "La prima banca cinese (istituto di cambio), nata qui nell'Ottocento.",
  },
  {
    name: "Torre della Campana",
    ll: [34.2583, 108.9426],
    img: "xian_bell",
    txt: "Simbolo del centro di Xi'an, illuminata di notte.",
  },
  {
    name: "Grande Moschea",
    ll: [34.2626, 108.937],
    img: "muslim_quarter",
    txt: "Moschea in stile cinese nel cuore del Quartiere Musulmano.",
  },
  {
    name: "Kuanzhai Xiangzi",
    ll: [30.6702, 104.0611],
    img: "kuanzhai",
    txt: "Tre vicoli storici ristrutturati, tè e street food.",
  },
  {
    name: "Base dei Panda",
    ll: [30.7304, 104.1467],
    img: "panda_base",
    txt: "Centro di ricerca e allevamento panda giganti — meglio la mattina presto.",
  },
  {
    name: "Jinli",
    ll: [30.652, 104.0475],
    img: "jinli",
    txt: "Via storica dello shopping, accanto al Tempio di Wuhou.",
  },
  {
    name: "Tempio di Wuhou",
    ll: [30.6459, 104.0454],
    img: "wuhou",
    txt: "Santuario dedicato a Zhuge Liang e ai regni dei Tre Regni.",
  },
  {
    name: "Ciqikou",
    ll: [29.5622, 106.4571],
    img: "ciqikou",
    txt: "Antico villaggio fluviale sul fiume Jialing.",
  },
  {
    name: "Hongya Cave",
    ll: [29.5602, 106.5716],
    img: "hongyadong",
    txt: "Complesso a terrazze incastonato nella collina, spettacolare di sera.",
  },
  {
    name: "West Street",
    ll: [24.777, 110.4956],
    img: "west_street",
    txt: "Via pedonale principale di Yangshuo, bar e negozi verso il fiume Li.",
  },
  {
    name: "Il Bund",
    ll: [31.2397, 121.4906],
    img: "bund",
    txt: "Lungofiume storico, skyline di Pudong sull'altra sponda.",
  },
];

// inCityLayer groups the IN_CITY_TRIPS + HOTEL_PINS markers together so
// they can be shown/hidden as one unit once the map is zoomed in enough
// (see syncInCityLayer() below).
const IN_CITY_MIN_ZOOM = 9;
const inCityLayer = L.layerGroup();
IN_CITY_TRIPS.forEach((s) => {
  const icon = L.divIcon({
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div class="side-pin"></div>`,
  });
  L.marker(s.ll, { icon })
    .bindTooltip(`<b>${s.name}</b>`, {
      direction: "top",
      offset: [0, -8],
    })
    .bindPopup(
      `<img class="side-img" src="${IMG[s.img]}" loading="lazy" alt="${s.name}"><b>${s.name}</b><br>${s.txt}`,
      { maxWidth: 250 },
    )
    .addTo(inCityLayer);
});

// HOTEL_PINS — hotels that are actually booked & paid (as opposed to
// just planned). Rendered with the magenta .hotel-pin dot, added to the
// same inCityLayer as IN_CITY_TRIPS so they appear/disappear at the same
// zoom level. Add a city's hotel here once its booking is confirmed.
const HOTEL_PINS = [
  {
    name: "Hotel Beijing — JianGuo Hidden Hotel",
    ll: [39.9157554457871, 116.4128893175064],
    txt: "No. 19 Jinyu Hutong, Dongcheng District — check-in 23 ott, check-out 26 ott.",
  },
  {
    name: "Hotel Pingyao — Qigongguan Inn",
    ll: [37.2015, 112.1738],
    txt: "No. 13 Zhuanquanmen Lane — check-in 26 ott, check-out 27 ott.",
  },
  {
    name: "Hotel Xi'an — Center Hotel (Xi'an Bell Tower)",
    ll: [34.2589, 108.9455],
    txt: "No. 619 East Street, Beilin District — check-in 27 ott, check-out 29 ott.",
  },
];
HOTEL_PINS.forEach((h) => {
  const icon = L.divIcon({
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div class="hotel-pin"></div>`,
  });
  L.marker(h.ll, { icon })
    .bindTooltip(`<b>${h.name}</b>`, {
      direction: "top",
      offset: [0, -8],
    })
    .bindPopup(`<b>🏨 ${h.name}</b><br>${h.txt}`, { maxWidth: 250 })
    .addTo(inCityLayer);
});

/**
 * syncInCityLayer() — shows inCityLayer (in-town landmarks + hotel pins)
 * once the map is zoomed in past IN_CITY_MIN_ZOOM, hides it again when
 * zoomed back out. Called once on load, then again every time the user
 * zooms (map.on("zoomend", ...) below).
 */
function syncInCityLayer() {
  const show = map.getZoom() >= IN_CITY_MIN_ZOOM;
  if (show && !map.hasLayer(inCityLayer)) inCityLayer.addTo(map);
  if (!show && map.hasLayer(inCityLayer)) map.removeLayer(inCityLayer);
}
map.on("zoomend", syncInCityLayer);
syncInCityLayer(); // run once immediately in case the initial view is already zoomed in

// Changsha South train-change marker
L.marker([28.1478, 113.0596], {
  icon: L.divIcon({
    className: "",
    iconSize: [13, 13],
    iconAnchor: [6.5, 6.5],
    html: `<div class="change-pin"></div>`,
  }),
})
  .addTo(map)
  .bindTooltip(
    "<b>Changsha Sud</b><br>cambio treno sulla tratta Zhangjiajie → Guilin (~6h totali) — il collo di bottiglia del viaggio, prenotare per primi",
    { direction: "top", offset: [0, -8] },
  );

/* ---------- routes ----------
   Draws the colored lines on the map connecting each leg of the trip
   (train/boat/road/flight), using the LEGS list below. */

/**
 * arc(from, to, bend) — instead of a straight line between two points,
 * returns a list of points along a gently curved (quadratic Bézier) arc.
 * Purely cosmetic: makes routes that roughly overlap (or the flight back
 * to Shanghai, drawn separately from the train lines) easier to tell apart
 * on the map. `bend` controls how curved it is — 0 would be a straight line.
 */
function arc(from, to, bend = 0.18) {
  const pts = [];
  const mx = (from[0] + to[0]) / 2,
    my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0],
    dy = to[1] - from[1];
  const cx = mx - dy * bend,
    cy = my + dx * bend;
  for (let t = 0; t <= 1.001; t += 0.05) {
    const a = (1 - t) * (1 - t),
      b = 2 * (1 - t) * t,
      c = t * t;
    pts.push([
      a * from[0] + b * cx + c * to[0],
      a * from[1] + b * cy + c * to[1],
    ]);
  }
  return pts;
}

// P — short lat/lng lookup table for every point a route line needs to pass
// through (city stops plus a few waypoints like Changsha, used only for
// drawing routes — separate from STOPS above, which is what builds the pins).
const P = {
  beijing: [39.9042, 116.4074],
  pingyao: [37.2009, 112.1747],
  xian: [34.3416, 108.9398],
  chengdu: [30.5728, 104.0668],
  chongqing: [29.563, 106.5516],
  zjj: [29.3455, 110.543],
  changsha: [28.1478, 113.0596],
  guilin: [25.2744, 110.29],
  xingping: [24.881, 110.494],
  yangshuo: [24.7786, 110.4966],
  xianggong: [24.8385, 110.4116],
  longsheng: [25.7515, 110.0914],
  shanghai: [31.2304, 121.4737],
};

// LEGS — one entry per travel segment of the trip, in order. `pts` is the
// list of P coordinates the line passes through (more than 2 points for a
// route with a stopover, like the Changsha train change). `mode` picks the
// line color/style (train/boat/road/flight — see the mode→color mapping
// just below where LEGS is drawn onto the map). `label` is the popup text.
const LEGS = [
  {
    pts: [P.beijing, P.pingyao],
    mode: "train",
    label:
      "<b>26 ott · Treno</b><br>Pechino Ovest → Pingyao, partenza ~10:30, ~4h",
  },
  {
    pts: [P.pingyao, P.xian],
    mode: "train",
    label:
      "<b>27 ott · Treno</b><br>Pingyao → Xi'an Nord, partenza ~17:00, ~3h",
  },
  {
    pts: [P.xian, P.chengdu],
    mode: "train",
    label:
      "<b>29 ott · Treno (alta velocità)</b><br>Xi'an (8:07) → Chengdu Est, ~3,5h",
  },
  {
    pts: [P.chengdu, P.chongqing],
    mode: "train",
    label:
      "<b>31 ott · Treno (alta velocità)</b><br>Chengdu (~8:37) → Chongqing, ~1,5–2h",
  },
  {
    pts: [P.chongqing, P.zjj],
    mode: "train",
    label:
      "<b>1 nov · Treno (alta velocità)</b><br>Chongqing Est (08:50) → Zhangjiajie Ovest, ~2,5h",
  },
  {
    pts: [P.zjj, P.changsha, P.guilin],
    mode: "train",
    label:
      "<b>3 nov · Treno (alta velocità) — tratta critica</b><br>Zhangjiajie Ovest 13:07 → Guilin, ~6h, cambio a Changsha Sud.<br>Singolo punto di rottura del percorso — prenotare appena aprono le vendite.",
  },
  {
    pts: [P.guilin, P.xingping, P.yangshuo],
    mode: "boat",
    label:
      "<b>4 nov · Crociera sul fiume Li</b><br>Guilin → Yangshuo, ~4h, pranzo a buffet a bordo, passa il paesaggio della banconota da 20 yuan.<br>Piano B stagione secca: zattera di bambù da Xingping.",
  },
  {
    pts: [P.yangshuo, P.xianggong, [25.05, 110.18], P.longsheng, P.guilin],
    mode: "road",
    label:
      "<b>5 nov · Strada (autista privato tutto il giorno)</b><br>Yangshuo 5:45 → alba a Xianggong → risaie di Longsheng → Guilin ~17:30<br>~5,5–6h di guida totali, un solo autista, percorso concordato in anticipo",
  },
  {
    pts: arc(P.guilin, P.shanghai, 0.15),
    mode: "flight",
    label:
      "<b>6 nov · Volo</b><br>Guilin KWL → Shanghai PVG, ~2h15m.<br>Puntare a una partenza serale ~18:30–19:30 (prenotare appena aprono gli orari di nov 2026).",
  },
];

// STYLE — line color/thickness for each LEGS "mode". Colors match the
// swatches shown in the on-page legend (bottom-left of the map).
const STYLE = {
  train: { color: "#e63946", weight: 3.5, opacity: 0.85 },
  boat: { color: "#2a9d8f", weight: 3.5, opacity: 0.9 },
  road: { color: "#f4a261", weight: 3.5, opacity: 0.9 },
  flight: {
    color: "#6a4c93",
    weight: 3,
    opacity: 0.85,
    dashArray: "8 8", // dashed line, to visually set flights apart from ground travel
  },
};

// Draw every LEGS entry as a line on the map, with its label shown as a
// tooltip that follows the mouse (sticky: true) when hovering the line.
LEGS.forEach((leg) => {
  L.polyline(leg.pts, STYLE[leg.mode])
    .addTo(map)
    .bindTooltip(leg.label, { sticky: true });
});

// Zoom/pan the map so all the numbered stop pins are comfortably in view
// on first load (.pad(0.18) adds ~18% breathing room around the edges).
map.fitBounds(L.latLngBounds(STOPS.map((s) => s.ll)).pad(0.18));

/* =========================================================
   PANNELLO + checklist persistenti — the slide-out side panel,
   the checklist "remember what's checked" logic, the quote-request
   popup, and (at the very end of this file) the single click
   dispatcher that wires up every button in the page.
   ========================================================= */

const panel = document.getElementById("panel");
// Key used to save checklist progress in the browser's localStorage, so
// checked boxes are still checked next time this page is opened.
const CK_KEY = "chinaTrip2026.checklist";

/**
 * fallbackCopy(text) — copies text to the clipboard the old-fashioned way
 * (create a hidden textarea, select it, run the browser's copy command).
 * Only used as a backup for browsers/contexts where the modern
 * navigator.clipboard API isn't available — see copyAddress()/copyQuoteText().
 */
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch (e) {}
  document.body.removeChild(ta);
}

/**
 * copyAddress(btn) — handles a click on a hotel card's "📋 Copia" button
 * (data-action="copy-address", see the ACTIONS table at the bottom of this
 * file). Copies the address stored in the button's data-copy attribute to
 * the clipboard, then briefly shows "✓ Copiato" as feedback before
 * reverting the button's label.
 */
function copyAddress(btn) {
  const text = btn.dataset.copy || "";
  const flash = () => {
    if (!btn.dataset.label) btn.dataset.label = btn.textContent;
    btn.textContent = "✓ Copiato";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = btn.dataset.label;
      btn.classList.remove("copied");
    }, 1400);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(flash)
      .catch(() => {
        fallbackCopy(text);
        flash();
      });
  } else {
    fallbackCopy(text);
    flash();
  }
}

/** loadCk() — reads the saved checklist state object from localStorage. */
function loadCk() {
  try {
    return JSON.parse(localStorage.getItem(CK_KEY)) || {};
  } catch {
    return {};
  }
}
/** saveCk(state) — writes the checklist state object back to localStorage. */
function saveCk(state) {
  localStorage.setItem(CK_KEY, JSON.stringify(state));
}

/**
 * openPanel(key) — the main "navigate to a city" function. Looks up
 * CONTENT[key], fills in the panel's title/dates/body, then slides the
 * panel into view by adding the "open" CSS class.
 *
 * Also re-wires every checklist checkbox inside the newly-injected HTML:
 *   - if that checkbox was saved as checked in localStorage AND it isn't
 *     already marked done:true in the source data, restore the checked
 *     state (this only restores *unchecked→checked* — an item that's
 *     done:true in the source always stays checked, see checklist() above
 *     and the "sourceDone" check below);
 *   - either way, listen for future clicks so toggling it saves the new
 *     state back to localStorage.
 */
function openPanel(key) {
  const c = CONTENT[key];
  if (!c) return; // unknown panel key — do nothing rather than error
  document.getElementById("panel-title").innerHTML = c.cn
    ? `${c.title} <span class="panel-title-cn">${c.cn}</span>`
    : c.title;
  document.getElementById("panel-dates").textContent = c.dates;
  const body = document.getElementById("panel-body");
  body.innerHTML = c.body;
  body.scrollTop = 0; // always start scrolled to the top of the new panel
  const state = loadCk();
  body.querySelectorAll("input[data-ck]").forEach((cb) => {
    const id = cb.dataset.ck;
    const sourceDone = cb.checked; // true if checklist() rendered this as done:true
    if (id in state && !sourceDone) cb.checked = !!state[id];
    cb.addEventListener("change", () => {
      const s = loadCk();
      s[cb.dataset.ck] = cb.checked;
      saveCk(s);
    });
  });
  panel.classList.add("open");
}

/** closePanel() — slides the side panel back off-screen. */
function closePanel() {
  panel.classList.remove("open");
}

/**
 * goToBeijingGuida() — opens the Beijing panel and immediately scrolls
 * down to its "Guida" (tour guide) section. Triggered by the "Vedi guida →"
 * button inside the Beijing checklist (data-action="go-to-beijing-guida").
 */
function goToBeijingGuida() {
  openPanel("beijing");
  document
    .getElementById("beijing-guida")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Pre-written text used to request a Beijing tour quote — shown in the
// quote-request popup (see openQuoteModal below) so it can be copied and
// pasted into an email/contact form without retyping it every time.
const QUOTE_REQUEST_TEXT = `Hi,

We're planning a trip to Beijing and are interested in 2  Days Beijing Tour (Great Wall + Forbidden City/Temple of Heaven).

Could you send a price quote for 2 travelers, with these dates:
- Forbidden City + Temple of Heaven day: Saturday, 24 October 2026
- Great Wall (Mutianyu) day: Sunday, 25 October 2026 — we'd like early access, departing the hotel around 6:30 to arrive at opening (~8:00) and beat the tour groups

On the Sunday, we're also open to any additional activity you'd suggest to round out the day.

Pickup/drop-off point: Hotel (booked by us).

Please include what's covered (entrance tickets, cable car/toboggan at Mutianyu, private transfer, English-speaking guide) and total price for both of us.

Thank you,
Nicolò`;

/** openQuoteModal() — fills the popup's textarea with QUOTE_REQUEST_TEXT and shows it. */
function openQuoteModal() {
  document.getElementById("quote-text").value = QUOTE_REQUEST_TEXT;
  document.getElementById("quote-modal").classList.add("open");
}
/** closeQuoteModal() — hides the quote-request popup. */
function closeQuoteModal() {
  document.getElementById("quote-modal").classList.remove("open");
}
/** copyQuoteText() — copies QUOTE_REQUEST_TEXT to the clipboard, with a brief "✅ Copiato" confirmation on the button. */
function copyQuoteText() {
  const btn = document.getElementById("quote-copy-btn");
  navigator.clipboard.writeText(QUOTE_REQUEST_TEXT).then(() => {
    const original = btn.textContent;
    btn.textContent = "✅ Copiato";
    setTimeout(() => (btn.textContent = original), 1500);
  });
}

// Clicking the dark backdrop behind the quote modal closes it — but NOT
// clicking inside the modal box itself. We can tell the two apart because
// a click on the backdrop has e.target === the overlay element itself,
// while a click anywhere inside the modal box has e.target set to
// whatever was actually clicked inside it (never the overlay).
document.getElementById("quote-modal").addEventListener("click", (e) => {
  if (e.target.id === "quote-modal") closeQuoteModal();
});

/**
 * ACTIONS — central dispatch table for (almost) every clickable thing on
 * this page. Rather than writing onclick="someFunction()" directly in
 * HTML strings (which only works for global functions and gets messy fast),
 * every clickable element instead gets a `data-action="some-name"`
 * attribute. ONE click listener on `document` (below) catches every click
 * anywhere on the page, checks if it happened on (or inside) an element
 * with a data-action, and if so calls the matching function here.
 *
 * Why this is worth it: a lot of this page's HTML (city panels, hotel
 * cards, etc.) is generated by JS and injected later via .innerHTML —
 * normal addEventListener calls made at page-load time can't attach to
 * elements that don't exist yet. Listening on `document` instead sidesteps
 * that problem completely, because the listener is already there before
 * any of that HTML even exists (this pattern is called "event delegation").
 *
 * Each function here receives the actual clicked element (`el`) so it can
 * read any extra data-* attributes it needs (e.g. data-panel, data-copy).
 */
const ACTIONS = {
  "open-panel": (el) => openPanel(el.dataset.panel),
  "close-panel": () => closePanel(),
  "open-quote-modal": () => openQuoteModal(),
  "close-quote-modal": () => closeQuoteModal(),
  "copy-quote-text": () => copyQuoteText(),
  "copy-address": (el) => copyAddress(el),
  "go-to-beijing-guida": () => goToBeijingGuida(),
};

document.addEventListener("click", (e) => {
  // e.target is whatever element was literally clicked (could be an icon
  // or span nested inside a button) — .closest() walks up the DOM tree to
  // find the nearest ancestor (or itself) that actually declares a
  // data-action, so clicking anywhere inside a button still works.
  const el = e.target.closest("[data-action]");
  if (!el) return; // click wasn't on anything actionable — ignore it
  const run = ACTIONS[el.dataset.action];
  if (run) run(el);
});

// Clicking the map background (not a pin) closes the open panel.
map.on("click", closePanel);
// Pressing Escape closes both the side panel and the quote modal, whichever is open.
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePanel();
    closeQuoteModal();
  }
});
