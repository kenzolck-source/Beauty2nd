import { categories as seedCategories, listings as seedListings, platformStats } from "./data/seed.js";

const { useEffect, useMemo, useState } = React;
const html = htm.bind(React.createElement);

const STORAGE = {
  listings: "ysw:listings",
  categories: "ysw:categories",
  inquiries: "ysw:inquiries",
  contacts: "ysw:contacts",
};

const SITE_CONFIG = {
  brandNameZh: "香港醫美儀器交易所",
  brandShort: "HKMAEX",
  brandNameEn: "Hong Kong Medical Aesthetic Equipment Exchange",
  whatsappNumber: "85291234567",
  whatsappDisplay: "9123 4567",
  email: "demo@hkmaex.hk",
  address: "香港九龍旺角彌敦道XXX號XXX樓",
};

const conditions = ["接近全新", "九成九新", "全新", "九成新", "八成新", "七成新", "六成新以下"];
const contactTypes = ["一般查詢", "買賣儀器", "美容院頂讓", "其他"];

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => loadStored(key, fallback));
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

function whatsappUrl(message = "") {
  const suffix = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}${suffix}`;
}

function listingInquiryMessage(listing) {
  return `你好，我想查詢 ${SITE_CONFIG.brandShort} 上的儀器：${listing.title}（編號 #${listing.id}）`;
}

function sellInstrumentMessage() {
  return "你好，我想出售醫美儀器，請安排初步評估。品牌/型號：____，現況：____，可提供相片。";
}

function dateLabel(value) {
  return new Date(value).toLocaleDateString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function categoryName(categories, id) {
  return categories.find((category) => category.id === id)?.name || "未分類";
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

const routeRoots = new Set(["listings", "listing", "about", "contact", "admin"]);

function normalizeBasePath(value) {
  if (!value || value === "/") return "";
  const clean = `/${String(value).replace(/^\/+|\/+$/g, "")}`;
  return clean === "/" ? "" : clean;
}

function inferBasePath() {
  if (window.__APP_BASE_PATH__) return normalizeBasePath(window.__APP_BASE_PATH__);
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length && !routeRoots.has(segments[0])) {
    return `/${segments[0]}`;
  }
  return "";
}

const basePath = inferBasePath();

function appPathname() {
  const path = window.location.pathname;
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
    return path.slice(basePath.length) || "/";
  }
  return path || "/";
}

function routeKey() {
  return `${appPathname()}${window.location.search}`;
}

function appHref(href) {
  if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) return href;
  if (!href.startsWith("/")) return href;
  return `${basePath}${href}` || "/";
}

function assetUrl(path) {
  if (!path || /^(https?:|data:|blob:)/.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${clean}` || clean;
}

function navigate(href) {
  window.history.pushState({}, "", appHref(href));
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function iconPath(name) {
  const paths = {
    search: "M21 21l-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
    shield: "M12 3 5 6v5c0 4.3 2.7 8.1 7 9.5 4.3-1.4 7-5.2 7-9.5V6l-7-3Z",
    check: "m5 12 4 4L19 6",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
    heartFill: "M12 21s-7.5-4.7-9.2-9.4A5.7 5.7 0 0 1 12 5.2a5.7 5.7 0 0 1 9.2 6.4C19.5 16.3 12 21 12 21Z",
    user: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    upload: "M12 16V4m0 0 5 5m-5-5-5 5M5 20h14",
    phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z",
    mail: "M4 4h16v16H4V4Zm0 3 8 6 8-6",
    location: "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    zap: "M13 2 3 14h8l-1 8 11-14h-8l0-6Z",
    radio: "M4.9 19.1a10 10 0 0 1 0-14.2m14.2 0a10 10 0 0 1 0 14.2M8 16a5.7 5.7 0 0 1 0-8m8 0a5.7 5.7 0 0 1 0 8m-4-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    waves: "M3 8c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M3 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2",
    sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m14.4-6.4 1.4-1.4M4.2 19.8l1.4-1.4m12.8 0 1.4 1.4M4.2 4.2l1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    snow: "M12 2v20m7-16L5 18m14 0L5 6m4-2 3 3 3-3m-6 16 3-3 3 3",
    needle: "M14 4 20 10 10 20 4 14 14 4Zm-3 3 6 6m-9 3-4 4",
    activity: "M3 12h4l2-7 4 14 2-7h6",
    package: "M21 8 12 3 3 8l9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8",
    dashboard: "M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z",
    edit: "M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4",
  };
  return paths[name] || paths.package;
}

function Icon({ name, filled = false }) {
  return html`<svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d=${filled ? iconPath("heartFill") : iconPath(name)}
      fill=${filled ? "currentColor" : "none"}
      stroke=${filled ? "none" : "currentColor"}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>`;
}

function CategoryIcon({ icon }) {
  const map = {
    Zap: "zap",
    Radio: "radio",
    Waves: "waves",
    Sun: "sun",
    Snowflake: "snow",
    Needle: "needle",
    Activity: "activity",
    Heart: "heart",
    Package: "package",
  };
  return html`<${Icon} name=${map[icon] || "package"} />`;
}

function BrandMark({ className = "" }) {
  return html`<span className=${classNames("brand-mark", className)} aria-hidden="true">
    <img src=${assetUrl("/assets/hkmaex-logo-image2-clean.png")} alt="" loading="eager" />
  </span>`;
}

function BrandLogo({ compact = false }) {
  return html`<${BrandMark} className=${classNames("brand-logo", compact && "compact")} />`;
}

function Link({ href, className = "", children }) {
  return html`<a
    href=${appHref(href)}
    className=${className}
    onClick=${(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(href);
    }}
  >
    ${children}
  </a>`;
}

function ButtonLink({ href, className = "", children }) {
  return html`<${Link} href=${href} className=${`button ${className}`}>${children}<//>`;
}

function StatusBadge({ status }) {
  const labels = {
    active: "上架中",
    pending: "審核中",
    inactive: "已下架",
    sold: "已售出",
    rejected: "未通過",
  };
  return html`<span className=${`status status-${status}`}>${labels[status] || status}</span>`;
}

function Navbar({ route }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const nav = [
    ["/listings", "購買儀器"],
    ["/listings/create", "出售儀器"],
    ["/about", "關於我們"],
    ["/contact", "聯絡我們"],
  ];
  const submit = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/listings?search=${encodeURIComponent(query.trim())}` : "/listings");
    setOpen(false);
  };

  return html`<header className="site-header">
    <div className="nav-shell">
      <${Link} href="/" className="brand">
        <${BrandLogo} />
        <span>
          <strong>${SITE_CONFIG.brandShort}</strong>
          <small>${SITE_CONFIG.brandNameZh}</small>
        </span>
      <//>
      <nav className="nav-links">
        ${nav.map(
          ([href, label]) =>
            html`<${Link} key=${href} href=${href} className=${route.startsWith(href) ? "active" : ""}>${label}<//>`,
        )}
      </nav>
      <form className="nav-search" onSubmit=${submit}>
        <${Icon} name="search" />
        <input
          value=${query}
          onInput=${(event) => setQuery(event.target.value)}
          placeholder="搜尋儀器型號、品牌..."
        />
      </form>
      <div className="nav-actions">
        <a className="ghost-pill whatsapp-nav" href=${whatsappUrl("你好，我想查詢 HKMAEX 醫美儀器。")} target="_blank" rel="noreferrer"><${Icon} name="phone" /> WhatsApp</a>
        <button className="menu-toggle" onClick=${() => setOpen(!open)} aria-label="開關選單">☰</button>
      </div>
    </div>
    ${open
      ? html`<div className="mobile-panel">
          <form onSubmit=${submit} className="mobile-search">
            <${Icon} name="search" />
            <input value=${query} onInput=${(event) => setQuery(event.target.value)} placeholder="搜尋儀器..." />
          </form>
          ${nav.map(([href, label]) => html`<${Link} key=${href} href=${href} onClick=${() => setOpen(false)}>${label}<//>`)}
          <a href=${whatsappUrl("你好，我想查詢 HKMAEX 醫美儀器。")} target="_blank" rel="noreferrer">WhatsApp 即時查詢</a>
        </div>`
      : ""}
  </header>`;
}

function Footer({ categories }) {
  return html`<footer className="footer">
    <div className="footer-grid">
      <div>
        <div className="footer-brand"><${BrandLogo} compact=${true} /> <span>${SITE_CONFIG.brandShort}</span></div>
        <p>${SITE_CONFIG.brandNameZh} 以專業驗機、估值及 WhatsApp 專人跟進，協助美容院買入及出售二手醫美儀器。</p>
      </div>
      <div>
        <h4>快速連結</h4>
        <${Link} href="/listings">購買儀器<//>
        <${Link} href="/listings/create">出售儀器<//>
        <${Link} href="/about">關於我們<//>
        <${Link} href="/contact">聯絡我們<//>
      </div>
      <div>
        <h4>儀器分類</h4>
        ${categories.slice(0, 6).map((category) => html`<${Link} key=${category.id} href=${`/listings?category=${category.id}`}>${category.name}<//>`)}
      </div>
      <div>
        <h4>聯絡資訊</h4>
        <p>${SITE_CONFIG.address}</p>
        <p>WhatsApp：${SITE_CONFIG.whatsappDisplay}</p>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© 2024 ${SITE_CONFIG.brandShort} - ${SITE_CONFIG.brandNameZh}。版權所有。</span>
      <span>私隱政策 · 使用條款 · 免責聲明</span>
    </div>
  </footer>`;
}

function ListingCard({ listing, categories, showWhatsapp = true, showImageCondition = true }) {
  return html`<article className="listing-card">
    <${Link} href=${`/listing/${listing.id}`} className="listing-image">
      <img src=${assetUrl(listing.featuredImageUrl)} alt=${listing.title} loading="lazy" />
      ${showImageCondition ? html`<span className="condition">${listing.condition}</span>` : ""}
      ${listing.status !== "active" ? html`<${StatusBadge} status=${listing.status} />` : ""}
    <//>
    <div className="listing-body">
      <div className="listing-meta">
        <span>${categoryName(categories, listing.categoryId)}</span>
        <span>${listing.condition}</span>
      </div>
      <${Link} href=${`/listing/${listing.id}`} className="listing-title">${listing.title}<//>
      <div className="listing-spec">${listing.brand} · ${listing.model}</div>
      <p className="listing-summary">${listing.description}</p>
      <div className="listing-assurance"><${Icon} name="shield" /> 原相片刊登 · 平台驗證資料</div>
      <div className="listing-bottom">
        ${showWhatsapp
          ? html`<a className="button whatsapp full" href=${whatsappUrl(listingInquiryMessage(listing))} target="_blank" rel="noreferrer"><${Icon} name="phone" /> WhatsApp 查詢</a>`
          : html`<${Link} className="button ghost full" href=${`/listing/${listing.id}`}>查看詳情<//>`}
      </div>
    </div>
  </article>`;
}

function HomePage({ categories, listings }) {
  const active = listings.filter((listing) => listing.status === "active");
  const latest = active.slice(0, 8);
  const proofPoints = [
    [platformStats.activeListings, "已審核上架儀器"],
    [categories.length, "專業分類"],
    ["WhatsApp", "專人跟進"],
  ];
  const featureCards = [
    ["shield", "專業驗機", "以平台流程整理儀器狀況、配件及基本功能資料。"],
    ["check", "原相片展示", "商品沿用真實儀器相片，讓買家先看到實際機身狀態。"],
    ["phone", "WhatsApp 專人", "所有查詢直接由專人承接，減少無效留言及來回等待。"],
    ["activity", "代售流程", "由收機、翻新、檢測報告到上架，建立更可信的成交基礎。"],
  ];

  const submitHeroSearch = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("search") || "").trim();
    navigate(query ? `/listings?search=${encodeURIComponent(query)}` : "/listings");
  };

  return html`<main>
    <section className="hero">
      <img className="hero-bg" src=${assetUrl("/assets/hero-ocean-dark-image2.png")} alt="香港美容儀器交易所" />
      <div className="hero-shade"></div>
      <div className="hero-content">
        <${BrandMark} className="hero-brand-mark" />
        <h1>${SITE_CONFIG.brandShort}</h1>
        <h2>${SITE_CONFIG.brandNameZh}</h2>
        <p>${SITE_CONFIG.brandNameEn}。以專業驗機、估值、原相片展示及 WhatsApp 專人跟進，為香港美容業界建立更可信的二手醫美儀器交易流程。</p>
        <form className="hero-search" onSubmit=${submitHeroSearch}>
          <${Icon} name="search" />
          <input name="search" placeholder="搜尋儀器型號、品牌、分類..." />
          <button>搜尋</button>
        </form>
        <div className="hero-actions">
          <${ButtonLink} href="/listings/create" className="button-light">出售儀器估值<//>
          <${Link} href="/listings" className="button-text">瀏覽所有儀器 <${Icon} name="arrow" /><//>
        </div>
        <div className="hero-proof">
          ${proofPoints.map(([value, label]) => html`<div key=${label}><strong>${value}</strong><span>${label}</span></div>`)}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="section-head">
        <div>
          <span className="section-kicker">最新</span>
          <h2>最新刊登</h2>
        </div>
        <${Link} href="/listings" className="link-more">查看全部 <${Icon} name="arrow" /><//>
      </div>
      <div className="listing-grid">
        ${latest.map(
          (listing) =>
            html`<${ListingCard}
              key=${listing.id}
              listing=${listing}
              categories=${categories}
              showWhatsapp=${false}
              showImageCondition=${false}
            />`,
        )}
      </div>
    </section>

    <section className="section band">
      <div className="section-head center">
        <span className="section-kicker">分類</span>
        <h2>儀器分類</h2>
      </div>
      <div className="category-grid">
        ${categories.map(
          (category) => html`<${Link} key=${category.id} href=${`/listings?category=${category.id}`} className="category-card">
            <span><${CategoryIcon} icon=${category.icon} /></span>
            <strong>${category.name}</strong>
            <small>${category.description}</small>
          <//>`,
        )}
      </div>
    </section>

    <section className="section stats-section">
      <div className="stats-copy">
        <span className="section-kicker">平台數據</span>
        <h2>香港最值得信賴的醫美儀器交易平台</h2>
        <p>以交易所規格整理醫美設備資訊，讓買家快速查看名稱、品牌型號、分類、成色及簡介；出售方則由專業團隊協助驗機、估值及上架。</p>
      </div>
      <div className="stats-grid">
        <div><strong>${platformStats.activeListings}</strong><span>上架儀器</span></div>
        <div><strong>${categories.length}</strong><span>儀器分類</span></div>
        <div><strong>${platformStats.totalListings}</strong><span>總刊登數</span></div>
      </div>
    </section>

    <section className="section">
      <div className="security-panel premium-panel">
        <div className="premium-copy">
          <span className="section-kicker">安全保障</span>
          <h2>安全交易保障</h2>
          <p>${SITE_CONFIG.brandShort} 以驗機、資料整理與專人溝通，降低二手醫美設備交易的不確定性。</p>
          <${ButtonLink} href="/about">了解更多安全保障<//>
        </div>
        <figure className="premium-media">
          <img src=${assetUrl("/assets/inspection-premium-image2.png")} alt="醫美儀器專業審核流程" loading="lazy" />
        </figure>
        <div className="feature-grid">
          ${featureCards.map(([icon, title, desc]) => html`<div className="feature-card" key=${title}>
            <span><${Icon} name=${icon} /></span>
            <strong>${title}</strong>
            <p>${desc}</p>
          </div>`)}
        </div>
      </div>
    </section>

    <section className="section concierge-section">
      <div className="concierge-copy">
        <span className="section-kicker">收機與估值</span>
        <h2>以專業方式處理閒置醫美設備</h2>
        <p>由 WhatsApp 初步諮詢、上門檢查、翻新檢測到估價上架，流程集中由平台跟進，幫助美容院更有秩序地處理閒置設備。</p>
        <div className="concierge-list">
          <span><${Icon} name="check" /> 上門評估</span>
          <span><${Icon} name="check" /> 即時報價</span>
          <span><${Icon} name="check" /> 快速成交</span>
        </div>
        <${ButtonLink} href="/listings/create">查看出售流程<//>
      </div>
      <figure className="concierge-media">
        <img src=${assetUrl("/assets/valuation-premium-image2.png")} alt="二手醫美儀器估值服務" loading="eager" />
      </figure>
    </section>

    <section className="cta-band">
      <h2>立即開始交易</h2>
      <p>無論您是想購買二手醫美儀器，還是想出售閒置設備，${SITE_CONFIG.brandShort} 都會以 WhatsApp 專人方式跟進。</p>
      <div>
        <${ButtonLink} href="/listings">立即購買<//>
        <a className="button button-light" href=${whatsappUrl(sellInstrumentMessage())} target="_blank" rel="noreferrer">WhatsApp 出售估值</a>
      </div>
    </section>
  </main>`;
}

function filterListings(listings, filters) {
  let result = listings.filter((listing) => listing.status !== "inactive");
  const search = filters.search.trim().toLowerCase();
  if (search) {
    result = result.filter((listing) =>
      [listing.title, listing.brand, listing.model, categoryName(seedCategories, listing.categoryId), listing.description].join(" ").toLowerCase().includes(search),
    );
  }
  if (filters.category) result = result.filter((listing) => listing.categoryId === Number(filters.category));
  if (filters.condition) result = result.filter((listing) => listing.condition === filters.condition);
  if (filters.sort === "views") result = [...result].sort((a, b) => b.viewCount - a.viewCount);
  if (filters.sort === "newest") result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return result;
}

function ListingsPage({ routeKey, categories, listings }) {
  const query = new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState({
    search: query.get("search") || "",
    category: query.get("category") || "",
    condition: "",
    sort: "newest",
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search);
    setFilters((current) => ({ ...current, search: next.get("search") || "", category: next.get("category") || "" }));
    setPage(1);
  }, [routeKey]);

  const filtered = useMemo(() => filterListings(listings, filters), [listings, filters]);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const update = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  return html`<main className="page">
    <section className="page-title">
      <span className="section-kicker">交易市場</span>
      <h1>全部儀器</h1>
      <p>共找到 ${filtered.length} 件已整理儀器資料，價格及交收細節由專人 WhatsApp 跟進。</p>
    </section>
    <div className="market-layout">
      <aside className="filters">
        <h3>篩選條件</h3>
        <label>搜尋<input value=${filters.search} onInput=${(event) => update("search", event.target.value)} placeholder="搜尋：" /></label>
        <label>全部分類
          <select value=${filters.category} onChange=${(event) => update("category", event.target.value)}>
            <option value="">全部分類</option>
            ${categories.map((category) => html`<option key=${category.id} value=${category.id}>${category.name}</option>`)}
          </select>
        </label>
        <label>成色
          <select value=${filters.condition} onChange=${(event) => update("condition", event.target.value)}>
            <option value="">全部</option>
            ${conditions.map((condition) => html`<option key=${condition}>${condition}</option>`)}
          </select>
        </label>
        <button
          className="button ghost full"
          onClick=${() => {
            setFilters({ search: "", category: "", condition: "", sort: "newest" });
            setPage(1);
          }}
        >清除篩選</button>
      </aside>
      <section className="market-results">
        <div className="result-toolbar">
          <span>${filtered.length} 件商品</span>
          <select value=${filters.sort} onChange=${(event) => update("sort", event.target.value)}>
            <option value="newest">最新刊登</option>
            <option value="views">最多瀏覽</option>
          </select>
        </div>
        ${visible.length
          ? html`<div className="listing-grid compact">
              ${visible.map(
                (listing) => html`<${ListingCard}
                  key=${listing.id}
                  listing=${listing}
                  categories=${categories}
                />`,
              )}
            </div>`
          : html`<div className="empty-state"><h3>找不到相關商品</h3><p>請嘗試調整篩選條件或搜尋關鍵字</p></div>`}
        <div className="pagination">
          <button disabled=${page === 1} onClick=${() => setPage(page - 1)}>上一頁</button>
          <span>${page} / ${pageCount}</span>
          <button disabled=${page === pageCount} onClick=${() => setPage(page + 1)}>下一頁</button>
        </div>
      </section>
    </div>
  </main>`;
}

function ListingDetail({ id, categories, listings }) {
  const listing = listings.find((item) => item.id === Number(id));
  const [activeImage, setActiveImage] = useState(0);

  if (!listing) {
    return html`<main className="page"><div className="empty-state"><h1>商品不存在</h1><p>此商品可能已被下架或刪除</p><${ButtonLink} href="/listings">返回商品列表<//></div></main>`;
  }

  const images = listing.images.length ? listing.images : [{ imageUrl: listing.featuredImageUrl }];

  return html`<main className="page detail-page">
    <div className="breadcrumbs"><${Link} href="/">首頁<//> / <${Link} href="/listings">儀器列表<//> / ${listing.title}</div>
    <section className="detail-grid">
      <div className="detail-gallery">
        <img className="detail-main-image" src=${assetUrl(images[activeImage].imageUrl)} alt=${listing.title} />
        <div className="thumb-row">
          ${images.map((image, index) => html`<button className=${index === activeImage ? "active" : ""} onClick=${() => setActiveImage(index)} key=${image.imageUrl}>
            <img src=${assetUrl(image.imageUrl)} alt="" />
          </button>`)}
        </div>
      </div>
      <aside className="detail-panel">
        <div className="detail-topline">
          <${StatusBadge} status=${listing.status} />
          <span>${listing.viewCount} 次瀏覽</span>
        </div>
        <h1>${listing.title}</h1>
        <div className="detail-callout"><${Icon} name="shield" /> 本儀器已由持專業認可牌照的工程人員完成檢查、清潔翻新及基本功能測試，資料清晰可靠；價格及交收由 WhatsApp 專人跟進。</div>
        <dl className="spec-list">
          <div><dt>品牌</dt><dd>${listing.brand}</dd></div>
          <div><dt>型號</dt><dd>${listing.model}</dd></div>
          <div><dt>成色</dt><dd>${listing.condition}</dd></div>
          <div><dt>分類</dt><dd>${categoryName(categories, listing.categoryId)}</dd></div>
        </dl>
        <div className="detail-actions">
          <a className="button whatsapp detail-whatsapp" href=${whatsappUrl(listingInquiryMessage(listing))} target="_blank" rel="noreferrer"><${Icon} name="phone" /> WhatsApp 查詢此儀器</a>
        </div>
      </aside>
    </section>
    <section className="section slim">
      <h2>商品描述</h2>
      <p className="description">${listing.description}</p>
    </section>
  </main>`;
}

function SellInstrumentPage() {
  const steps = [
    ["WhatsApp 初步諮詢", "傳送儀器相片、品牌型號及基本狀況，團隊先判斷是否適合回收、翻新或代售。"],
    ["專業上門檢查", "檢查外觀、配件、開機狀態及主要功能，避免只靠相片估值。"],
    ["回收或代售方案", "按狀況提供回收、翻新後代售或直接上架建議，讓出售方清楚每個選項。"],
    ["清潔翻新處理", "整理外觀、配件及基本保養，提升買家第一印象與成交信任度。"],
    ["檢測報告建立", "整理功能檢測、配件清單、相片及注意事項，成為上架資料基礎。"],
    ["專業估價", "根據品牌、型號、成色、市場需求給出合理估值，再決定回收或代售策略。"],
    ["上架 HKMAEX", "製作商品頁，由平台代為展示並承接買家 WhatsApp 查詢。"],
  ];
  return html`<main className="page sell-page">
    <section className="sell-hero">
      <div className="sell-hero-copy">
        <${BrandMark} className="sell-logo-mark" />
        <h1>出售醫美儀器，由專業團隊先驗機再上架</h1>
        <p>不再讓客人自行填表刊登。${SITE_CONFIG.brandShort} 以 WhatsApp 初步諮詢、上門檢查、翻新檢測、估價及代售流程，協助美容院更有秩序地處理閒置設備。</p>
        <div className="sell-actions">
          <a className="button whatsapp" href=${whatsappUrl(sellInstrumentMessage())} target="_blank" rel="noreferrer"><${Icon} name="phone" /> WhatsApp 安排初步評估</a>
          <${Link} href="/listings" className="button ghost">查看現有儀器<//>
        </div>
      </div>
      <figure className="sell-hero-media">
        <img src=${assetUrl("/assets/valuation-premium-image2.png")} alt="HKMAEX 醫美儀器估值流程" />
      </figure>
    </section>

    <section className="section sop-section">
      <div className="section-head">
        <div>
          <span className="section-kicker">出售 SOP</span>
          <h2>由初步評估到平台上架的完整流程</h2>
        </div>
        <a className="button whatsapp" href=${whatsappUrl(sellInstrumentMessage())} target="_blank" rel="noreferrer">立即 WhatsApp 查詢</a>
      </div>
      <div className="sop-timeline">
        ${steps.map(([title, desc], index) => html`<article className="sop-step" key=${title}>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          <p>${desc}</p>
        </article>`)}
      </div>
    </section>

    <section className="section sell-note">
      <div>
        <h2>建議 WhatsApp 時提供的資料</h2>
        <p>品牌、型號、機身相片、配件相片、目前狀況、是否可開機、希望回收或代售。資料越完整，初步判斷越快。</p>
      </div>
      <a className="button whatsapp" href=${whatsappUrl(sellInstrumentMessage())} target="_blank" rel="noreferrer"><${Icon} name="phone" /> 開始出售評估</a>
    </section>
  </main>`;
}

function AboutPage() {
  const services = [
    ["醫美儀器展示", "以分類、品牌型號、成色、簡介及原相片展示二手醫美儀器，重點資料清晰而不公開標價。", ["原相片展示", "分類清晰", "WhatsApp 專人查詢"]],
    ["收機與代售", "專業團隊上門評估及收購各類二手醫美儀器，亦可按狀況建議翻新後代售。", ["上門評估", "回收或代售", "專人跟進"]],
    ["翻新與檢測", "整理外觀、配件及基本功能資料，建立檢測報告，提升買家信任。", ["清潔翻新", "功能檢查", "資料整理"]],
    ["美容院頂讓服務", "協助美容院業主進行整體頂讓，包括儀器估值、設備轉讓及客戶資源對接。", ["整體頂讓方案", "儀器估值服務", "客戶資源對接"]],
  ];
  const timeline = [
    ["品牌定位", `${SITE_CONFIG.brandShort} 以香港醫美儀器交易所作為核心定位`],
    ["流程建立", "建立 WhatsApp 初步諮詢、上門檢查、翻新檢測及估價上架流程"],
    ["資料升級", "商品頁改以品牌型號、分類、成色、簡介及原相片作核心展示"],
    ["專人跟進", "所有買賣查詢集中由 WhatsApp 專人承接，提升成交效率"],
  ];

  return html`<main className="page">
    <section className="about-hero">
      <div>
        <span className="section-kicker">關於 ${SITE_CONFIG.brandShort}</span>
        <h1>${SITE_CONFIG.brandNameZh}</h1>
        <p>${SITE_CONFIG.brandNameEn} 致力為香港美容業界提供更專業的二手醫美儀器展示、驗機、估值、回收及代售流程。</p>
      </div>
      <figure className="about-hero-media brand-emblem-panel"><${BrandMark} className="about-brand-mark" /></figure>
      <div className="about-stat"><strong>62</strong><span>儀器資料</span></div>
      <div className="about-stat"><strong>7</strong><span>出售流程</span></div>
    </section>
    <section className="section slim">
      <h2>我們的使命</h2>
      <p className="description">${SITE_CONFIG.brandShort} 的方向，是為香港美容業界建立一個更可信、更集中、更容易查詢的二手醫美儀器交易入口。我們不把交易簡化成普通刊登表格，而是以驗機、資料整理、估值與 WhatsApp 專人承接，降低買賣雙方的不確定性。</p>
    </section>
    <section className="section">
      <div className="section-head"><h2>我們的服務</h2></div>
      <div className="service-grid">
        ${services.map(([title, desc, items]) => html`<article className="service-card">
          <h3>${title}</h3>
          <p>${desc}</p>
          ${items.map((item) => html`<span><${Icon} name="check" /> ${item}</span>`)}
        </article>`)}
      </div>
    </section>
    <section className="section band">
      <div className="section-head"><h2>發展歷程</h2></div>
      <div className="timeline">
        ${timeline.map(([title, desc]) => html`<div><strong>${title}</strong><p>${desc}</p></div>`)}
      </div>
    </section>
    <section className="cta-band"><h2>想出售閒置醫美設備？先由專人初步評估</h2><a className="button whatsapp" href=${whatsappUrl(sellInstrumentMessage())} target="_blank" rel="noreferrer">WhatsApp 安排評估</a></section>
  </main>`;
}

function ContactPage({ addContact }) {
  const [sent, setSent] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (!form.name || !form.message) return;
    addContact({ id: Date.now(), ...form, status: "unread", createdAt: new Date().toISOString() });
    setSent(true);
    event.currentTarget.reset();
  };

  return html`<main className="page contact-page">
    <section className="page-title">
      <span className="section-kicker">聯絡我們</span>
      <h1>聯絡我們</h1>
      <p>購買查詢、出售評估及美容院頂讓，可直接 WhatsApp 聯絡 ${SITE_CONFIG.brandShort} 專人。</p>
    </section>
    <div className="contact-grid">
      <aside className="contact-info">
        <h2>聯絡資訊</h2>
        <p><${Icon} name="location" /> ${SITE_CONFIG.address}</p>
        <p><${Icon} name="phone" /> ${SITE_CONFIG.whatsappDisplay}</p>
        <p><${Icon} name="mail" /> ${SITE_CONFIG.email}</p>
        <h3>辦公時間</h3>
        <p>星期一至六 10:00 - 19:00</p>
        <a className="button whatsapp" href=${whatsappUrl("你好，我想查詢 HKMAEX 醫美儀器。")} target="_blank" rel="noreferrer">WhatsApp 即時查詢</a>
      </aside>
      <form className="contact-form" onSubmit=${submit}>
        ${sent ? html`<div className="notice success">查詢已成功發送！我們將盡快回覆您。</div>` : ""}
        <label>姓名 *<input name="name" required placeholder="您的姓名" /></label>
        <label>查詢類別<select name="category">${contactTypes.map((type) => html`<option>${type}</option>`)}</select></label>
        <label>電話<input name="phone" placeholder="電話號碼" /></label>
        <label>電郵<input name="email" type="email" placeholder="電郵地址" /></label>
        <label>查詢內容 *<textarea name="message" required placeholder="請詳細描述您的查詢..."></textarea></label>
        <button className="button">發送查詢</button>
      </form>
    </div>
  </main>`;
}

function AdminLayout({ route, children }) {
  const links = [
    ["/admin", "總覽"],
    ["/admin/listings", "商品管理"],
    ["/admin/categories", "分類管理"],
    ["/admin/contacts", "聯絡查詢"],
  ];
  return html`<main className="admin-shell">
    <aside className="admin-sidebar">
      <h2><${BrandLogo} compact=${true} /> ${SITE_CONFIG.brandShort} 內部營運中心</h2>
      ${links.map(([href, label]) => html`<${Link} href=${href} className=${route === href ? "active" : ""}>${label}<//>`)}
    </aside>
    <section className="admin-content">${children}</section>
  </main>`;
}

function AdminDashboard({ listings, inquiries, contacts }) {
  const pending = listings.filter((listing) => listing.status === "pending");
  const active = listings.filter((listing) => listing.status === "active");
  const unread = inquiries.filter((item) => item.status === "unread").length + contacts.filter((item) => item.status === "unread").length;
  return html`<div>
    <div className="admin-head"><h1>管理員總覽</h1><p>歡迎回來，以下是平台最新狀況</p></div>
    <div className="admin-stats">
      <div><strong>${pending.length}</strong><span>待審核商品</span></div>
      <div><strong>${active.length}</strong><span>上架商品</span></div>
      <div><strong>${seedCategories.length}</strong><span>分類數</span></div>
      <div><strong>${unread}</strong><span>未讀詢問</span></div>
    </div>
    <div className="table-card">
      <h2>待審核商品</h2>
      ${pending.length ? html`<table><tbody>${pending.slice(0, 6).map((listing) => html`<tr><td>${listing.title}</td><td>${listing.condition}</td><td>審核</td></tr>`)}</tbody></table>` : html`<p>暫無待審核商品</p>`}
    </div>
  </div>`;
}

function AdminListings({ listings, setListings }) {
  const [search, setSearch] = useState("");
  const visible = listings.filter((listing) => listing.title.toLowerCase().includes(search.toLowerCase()));
  const updateStatus = (id, status) => setListings((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  return html`<div>
    <div className="admin-head"><h1>商品管理</h1><p>管理平台已整理的儀器資料</p></div>
    <div className="result-toolbar"><input value=${search} onInput=${(event) => setSearch(event.target.value)} placeholder="搜尋商品標題..." /><span>共 ${visible.length} 件</span></div>
    <div className="table-card"><table>
      <thead><tr><th>商品</th><th>分類 / 成色</th><th>狀態</th><th>刊登日期</th><th>操作</th></tr></thead>
      <tbody>${visible.slice(0, 30).map((listing) => html`<tr>
        <td><strong>${listing.title}</strong><small>${listing.brand} ${listing.model}</small></td>
        <td>${categoryName(seedCategories, listing.categoryId)} · ${listing.condition}</td>
        <td><${StatusBadge} status=${listing.status} /></td>
        <td>${dateLabel(listing.createdAt)}</td>
        <td className="table-actions">
          <button onClick=${() => navigate(`/listing/${listing.id}`)}>查看</button>
          <button onClick=${() => updateStatus(listing.id, "active")}>通過</button>
          <button onClick=${() => updateStatus(listing.id, "rejected")}>拒絕</button>
          <button onClick=${() => updateStatus(listing.id, listing.status === "inactive" ? "active" : "inactive")}>${listing.status === "inactive" ? "上架" : "下架"}</button>
        </td>
      </tr>`)}</tbody>
    </table></div>
  </div>`;
}

function AdminCategories({ categories, setCategories }) {
  return html`<div>
    <div className="admin-head"><h1>分類管理</h1><p>管理儀器分類，調整排序與顯示狀態</p></div>
    <div className="table-card"><table>
      <thead><tr><th>圖示</th><th>名稱</th><th>代碼</th><th>排序</th><th>狀態</th><th>操作</th></tr></thead>
      <tbody>${categories.map((category) => html`<tr>
        <td><span className="mini-icon"><${CategoryIcon} icon=${category.icon} /></span></td>
        <td>${category.name}</td>
        <td>${category.slug}</td>
        <td>${category.sortOrder}</td>
        <td>${category.isActive ? "顯示" : "隱藏"}</td>
        <td><button onClick=${() => setCategories((items) => items.map((item) => item.id === category.id ? { ...item, isActive: !item.isActive } : item))}>${category.isActive ? "隱藏" : "顯示"}</button></td>
      </tr>`)}</tbody>
    </table></div>
  </div>`;
}

function AdminMessageTable({ title, subtitle, items, setItems, type }) {
  const update = (id, status) => setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  return html`<div>
    <div className="admin-head"><h1>${title}</h1><p>${subtitle}</p></div>
    <div className="table-card">
      ${items.length
        ? html`<table>
            <thead><tr><th>${type === "contact" ? "查詢者" : "詢問者"}</th><th>${type === "contact" ? "類別" : "商品 ID"}</th><th>內容摘要</th><th>狀態</th><th>日期</th><th>操作</th></tr></thead>
            <tbody>${items.map((item) => html`<tr>
              <td>${item.name}</td>
              <td>${type === "contact" ? item.category : `#${item.listingId}`}</td>
              <td>${item.message}</td>
              <td>${item.status === "replied" ? "已回覆" : item.status === "read" ? "已讀" : "未讀"}</td>
              <td>${dateLabel(item.createdAt)}</td>
              <td><button onClick=${() => update(item.id, "read")}>標記已讀</button><button onClick=${() => update(item.id, "replied")}>標記已回覆</button></td>
            </tr>`)}</tbody>
          </table>`
        : html`<div className="empty-state"><h3>${type === "contact" ? "暫無聯絡查詢" : "暫無詢問記錄"}</h3></div>`}
    </div>
  </div>`;
}

function AdminPage(props) {
  const route = appPathname();
  let child = html`<${AdminDashboard} listings=${props.listings} inquiries=${props.inquiries} contacts=${props.contacts} />`;
  if (route === "/admin/listings") child = html`<${AdminListings} listings=${props.listings} setListings=${props.setListings} />`;
  if (route === "/admin/categories") child = html`<${AdminCategories} categories=${props.categories} setCategories=${props.setCategories} />`;
  if (route === "/admin/contacts") child = html`<${AdminMessageTable} title="聯絡查詢" subtitle="管理透過聯絡頁面提交的查詢" items=${props.contacts} setItems=${props.setContacts} type="contact" />`;
  return html`<${AdminLayout} route=${route}>${child}<//>`;
}

function App() {
  const [currentRouteKey, setRouteKey] = useState(routeKey());
  const [categories, setCategories] = useStoredState(STORAGE.categories, seedCategories);
  const [listings, setListings] = useStoredState(STORAGE.listings, seedListings);
  const [inquiries, setInquiries] = useStoredState(STORAGE.inquiries, []);
  const [contacts, setContacts] = useStoredState(STORAGE.contacts, []);

  useEffect(() => {
    const updateRoute = () => setRouteKey(routeKey());
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  const path = appPathname();
  let page;
  if (path === "/") page = html`<${HomePage} categories=${categories} listings=${listings} />`;
  else if (path === "/listings") page = html`<${ListingsPage} routeKey=${currentRouteKey} categories=${categories} listings=${listings} />`;
  else if (path.startsWith("/listing/")) page = html`<${ListingDetail} id=${path.split("/").pop()} categories=${categories} listings=${listings} />`;
  else if (path === "/listings/create") page = html`<${SellInstrumentPage} />`;
  else if (path === "/about") page = html`<${AboutPage} />`;
  else if (path === "/contact") page = html`<${ContactPage} addContact=${(item) => setContacts((items) => [item, ...items])} />`;
  else if (path.startsWith("/admin")) page = html`<${AdminPage} categories=${categories} setCategories=${setCategories} listings=${listings} setListings=${setListings} inquiries=${inquiries} setInquiries=${setInquiries} contacts=${contacts} setContacts=${setContacts} />`;
  else page = html`<main className="page"><div className="empty-state"><h1>頁面不存在</h1><${ButtonLink} href="/">返回首頁<//></div></main>`;

  return html`<div>
    <${Navbar} route=${path} />
    ${page}
    ${path.startsWith("/admin") ? "" : html`<${Footer} categories=${categories} />`}
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
