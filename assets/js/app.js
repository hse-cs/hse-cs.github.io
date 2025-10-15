(function(){
  const THEMES = ["light","dark","tokyo","mint"];
  const translations = {
    ru: {
      title: "Отркытый код ФКН",
      lead: "Проект с открытым исходным кодом ФКН",
      language_label: "Язык",
      theme_label: "Тема",
      search_label: "Поиск проектов",
      search_placeholder: "Поиск проектов…",
      label_paper: "Статья",
      label_code: "Код",
      label_demo: "Демо",
      label_link: "Ссылка",
      footer_html: '© <span id="year"></span> Отркытый код ФКН <a href="https://t.me/hse_cs_opensource" target="_blank" rel="noopener">Telegram</a> <a href="https://github.com/hse-cs" target="_blank" rel="noopener">GitHub</a>',
      local_note: "Не найден data/posts.json. Выберите posts.json вручную:"
    },
    en: {
      title: "HSE CS Open Source Project",
      lead: "A list of open-source projects from the Faculty of Computer Science.",
      language_label: "Language",
      theme_label: "Theme",
      search_label: "Search projects",
      search_placeholder: "Search projects…",
      label_paper: "Paper",
      label_code: "Code",
      label_demo: "Demo",
      label_link: "Link",
      footer_html: '© <span id="year"></span> HSE CS Open Source Project <a href="https://t.me/hse_cs_opensource" target="_blank" rel="noopener">Telegram</a> <a href="https://github.com/hse-cs" target="_blank" rel="noopener">GitHub</a>',
      local_note: "data/posts.json not found. Pick posts.json manually:"
    }
  };
  let I18N = translations.ru;
  let LABELS = {paper:"Статья", code:"Код", demo:"Демо", link:"Ссылка"};

  function applyTheme(theme){
    const t = THEMES.includes(theme) ? theme : "light";
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    const sel = document.getElementById('theme');
    if (sel) sel.value = t;
  }
  function detectTheme(){ const s=localStorage.getItem('theme'); if(s) return s; return (matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; }

  function applyI18n(lang){
    I18N = translations[lang] || translations.ru;
    document.documentElement.lang = lang;
    document.title = I18N.title;
    const map = {
      title: '[data-i18n="title"]',
      lead: '[data-i18n="lead"]',
      language_label: 'label[for="lang"][data-i18n="language_label"]',
      theme_label: 'label[for="theme"][data-i18n="theme_label"]',
      search_label: 'label[for="q"][data-i18n="search_label"]'
    };
    Object.entries(map).forEach(([k, sel]) => {
      const el = document.querySelector(sel);
      if (el && I18N[k]) el.textContent = I18N[k];
    });
    const ph = document.querySelector('[data-i18n-placeholder="search_placeholder"]');
    if (ph && I18N.search_placeholder) ph.setAttribute('placeholder', I18N.search_placeholder);
    const footer = document.getElementById('footer-text');
    if (footer) footer.innerHTML = I18N.footer_html;
    const localNote = document.getElementById('local-note');
    if (localNote) localNote.textContent = I18N.local_note;
    const langSel = document.getElementById('lang');
    if (langSel) langSel.value = lang;
    LABELS = { paper: I18N.label_paper, code: I18N.label_code, demo: I18N.label_demo, link: I18N.label_link };
  }
  function detectLang(){ const s=localStorage.getItem('lang'); if(s) return s; return (navigator.language||'ru').toLowerCase().startsWith('en')?'en':'ru'; }

  function esc(s){ return (s||"").replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  async function fetchJSON(path){ const res=await fetch(path,{cache:"no-store"}); if(!res.ok) throw new Error(res.status); return await res.json(); }

  
  async function importFromJSONCandidates(paths){
    const list = document.getElementById("projects");
    const tried = [];
    let lastErr = null;
    for (const p of paths){
      try{
        const data = await fetchJSON(p);
        if (!Array.isArray(data)) throw new Error("JSON is not an array");
        list.innerHTML = "";
        data.forEach(it => {
          const linksHtml = buildLinksFromJSON(it.links);
          const card = createCard({ title: it.title, url: it.url, desc: it.desc, linksHtml });
          list.appendChild(card);
        });
        return {ok:true, tried};
      }catch(err){
        tried.push(p + " → " + (err && (err.message || err)));
        lastErr = err;
      }
    }
    return {ok:false, tried, error:lastErr};
  }

  function buildLinksFromJSON(arr){
    if (!arr || !arr.length) return "";
    return arr.map(l => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(LABELS[l.type] || LABELS.link)}</a>`).join(" · ");
  }

  function createCard(item){
    const li = document.createElement("li");
    li.className = "project";
    li.innerHTML = `
      <h3><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.title)}</a></h3>
      <div class="meta"></div>
      <div class="project-body">
        <p>${esc(item.desc)}</p>
        ${item.linksHtml ? `<p>${item.linksHtml}</p>` : ""}
      </div>`;
    return li;
  }

  async function importFromJSON(path){
    const list = document.getElementById("projects");
    if (!list) return;
    const data = await fetchJSON(path);
    list.innerHTML = "";
    data.forEach(it => {
      const linksHtml = buildLinksFromJSON(it.links);
      const card = createCard({ title: it.title, url: it.url, desc: it.desc, linksHtml });
      list.appendChild(card);
    });
  }

  function initSearch(){
    const q = document.getElementById('q');
    if (!q) return;
    q.addEventListener('input', () => {
      const term = q.value.trim().toLowerCase();
      const items = document.querySelectorAll('.project');
      items.forEach(li => {
        const hay = (li.innerText + ' ' + (li.dataset.tags||'') + ' ' + (li.dataset.year||'')).toLowerCase();
        li.style.display = hay.includes(term) ? '' : 'none';
      });
    });
  }

  // posts.json file picker (only posts.json, no other fallbacks)
  function setupPostsPicker(){
    const input = document.getElementById('posts-file');
    if (!input) return;
    input.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const text = await file.text();
      let data;
      try{ data = JSON.parse(text); }catch(_){ alert("Invalid JSON"); return; }
      const list = document.getElementById("projects");
      list.innerHTML = "";
      data.forEach(it => {
        const linksHtml = buildLinksFromJSON(it.links);
        const card = createCard({ title: it.title, url: it.url, desc: it.desc, linksHtml });
        list.appendChild(card);
      });
    });
  }

  window.addEventListener('DOMContentLoaded', async () => {
    // Theme
    applyTheme(localStorage.getItem('theme') || detectTheme());
    document.getElementById('theme')?.addEventListener('change', e => applyTheme(e.target.value));

    // Language (UI only)
    const lang = localStorage.getItem('lang') || detectLang();
    applyI18n(lang);
    document.getElementById('lang')?.addEventListener('change', e => {
      const v = e.target.value;
      localStorage.setItem('lang', v);
      applyI18n(v);
    });

    // Content: ONLY posts.json (multiple canonical locations), otherwise show picker
    const metaPath = document.querySelector('meta[name="posts-json"]')?.content;
    const candidates = [];
    if (metaPath) candidates.push(metaPath);
    // canonical relative paths
    candidates.push('data/posts.json');
    candidates.push('posts.json');
    // If served from /docs/ (GH Pages alt source), try one level up data folder
    if (location.pathname.includes('/docs/')) {
      candidates.push('../data/posts.json');
    }
    const result = await importFromJSONCandidates(candidates);
    const fallback = document.getElementById('posts-fallback');
    if (result.ok){
      if (fallback) fallback.hidden = true;
    }else{
      console.warn('Could not load posts.json from any candidate path:', result);
      if (fallback){
        fallback.hidden = false;
        const details = document.getElementById('posts-error');
        if (details) details.textContent = result.tried.join(' | ');
      }
    }

    // Search & footer year
    initSearch();
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    setupPostsPicker();
  });
})();
