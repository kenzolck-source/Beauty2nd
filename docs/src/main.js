import { categories as seedCategories, listings as seedListings, platformStats } from "./data/seed.js";

const { useEffect, useMemo, useState } = React;
const html = htm.bind(React.createElement);

const STORAGE = {
  listings: "ysw:listings",
  categories: "ysw:categories",
  favorites: "ysw:favorites",
  inquiries: "ysw:inquiries",
  contacts: "ysw:contacts",
};

const conditions = ["全新", "九成新", "八成新", "七成新", "六成新以下"];
const regions = ["香港島", "九龍", "新界", "離島"];
const contactTypes = ["一般查詢", "買賣儀器", "美容院頂讓", "其他"];
const adminUsers = [
  { id: 1, name: "易搜王示範管理員", email: "admin@yisouwang.hk", role: "管理員", joinedAt: "2026-06-10" },
  { id: 2, name: "示範用戶", email: "demo@yisouwang.hk", role: "普通用戶", joinedAt: "2026-06-10" },
];

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

function formatPrice(value) {
  return `HK$${Number(value).toLocaleString("zh-HK", { maximumFractionDigits: 0 })}`;
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

const routeRoots = new Set(["listings", "listing", "dashboard", "about", "contact", "admin"]);

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

function BrandLogo({ compact = false }) {
  return html`<span className=${classNames("brand-logo", compact && "compact")} aria-hidden="true">
    <svg viewBox="0 0 42 42" role="img">
      <rect x="2.5" y="2.5" width="37" height="37" rx="9" fill="#071827" />
      <path d="M12.2 17.6a9 9 0 1 1 15.7 6.1l4.7 4.7" fill="none" stroke="#c89a4d" strokeWidth="2.7" strokeLinecap="round" />
      <path d="M14.6 18.7h11.3M16.9 14.4h8.4M15.5 23h7.5" stroke="#f8f0df" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M29.8 29.8 35 35" stroke="#13a6a1" strokeWidth="2.9" strokeLinecap="round" />
    </svg>
  </span>`;
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

function Navbar({ route, favoritesCount }) {
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
          <strong>易搜王</strong>
          <small>香港醫美儀器交易所</small>
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
        <${Link} href="/dashboard" className="ghost-pill"><${Icon} name="user" /> 用戶 ${favoritesCount ? html`<b>${favoritesCount}</b>` : ""}<//>
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
          <${Link} href="/dashboard">我的儀表板<//>
          <${Link} href="/admin">管理員後台<//>
        </div>`
      : ""}
  </header>`;
}

function Footer({ categories }) {
  return html`<footer className="footer">
    <div className="footer-grid">
      <div>
        <div className="footer-brand"><${BrandLogo} compact=${true} /> <span>易搜王</span></div>
        <p>香港首選的二手醫美儀器交易平台，為買家與賣家提供安全、便捷的交易環境。</p>
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
        <p>香港九龍旺角<br />彌敦道XXX號XXX樓</p>
        <p>WhatsApp：9123 4567</p>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© 2024 易搜王 - 香港美容儀器交易所。版權所有。</span>
      <span>私隱政策 · 使用條款 · 免責聲明</span>
    </div>
  </footer>`;
}

function ListingCard({ listing, categories, favorite, onFavorite }) {
  return html`<article className="listing-card">
    <${Link} href=${`/listing/${listing.id}`} className="listing-image">
      <img src=${assetUrl(listing.featuredImageUrl)} alt=${listing.title} loading="lazy" />
      <span className="condition">${listing.condition}</span>
      ${listing.status !== "active" ? html`<${StatusBadge} status=${listing.status} />` : ""}
    <//>
    <div className="listing-body">
      <div className="listing-meta">
        <span>${categoryName(categories, listing.categoryId)}</span>
        <span>${listing.region}</span>
      </div>
      <${Link} href=${`/listing/${listing.id}`} className="listing-title">${listing.title}<//>
      <div className="listing-spec">${listing.brand} · ${listing.model} · ${listing.yearOfPurchase}</div>
      <div className="listing-assurance"><${Icon} name="shield" /> 平台審核資料 · 原相片刊登</div>
      <div className="listing-bottom">
        <div>
          <strong>${formatPrice(listing.price)}</strong>
          ${listing.negotiable ? html`<small>可議價</small>` : ""}
        </div>
        <button
          className=${classNames("icon-button", favorite && "selected")}
          aria-label="收藏"
          onClick=${(event) => {
            event.preventDefault();
            onFavorite(listing.id);
          }}
        >
          <${Icon} name="heart" filled=${favorite} />
        </button>
      </div>
    </div>
  </article>`;
}

function HomePage({ categories, listings, favorites, onFavorite }) {
  const active = listings.filter((listing) => listing.status === "active");
  const latest = active.slice(0, 8);
  const proofPoints = [
    [platformStats.activeListings, "已審核上架儀器"],
    [categories.length, "專業分類"],
    ["1-2", "工作天審核"],
  ];
  const featureCards = [
    ["shield", "身份核實", "所有賣家均需完成身份核實，確保交易安全可靠。"],
    ["check", "儀器審核", "每件刊登商品均由專業團隊審核，確保資訊真實準確。"],
    ["heart", "買家保障", "提供完善的買家保障機制，讓您安心購買每一件儀器。"],
    ["phone", "專業支援", "專業客服團隊全程支援，解答您的任何疑問。"],
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
        <h1>易搜王</h1>
        <h2>香港美容儀器交易所</h2>
        <p>專業的二手醫美儀器買賣平台，為您提供安全、便捷的交易體驗。激光、射頻、超聲波等各類儀器，一站式搜尋。</p>
        <form className="hero-search" onSubmit=${submitHeroSearch}>
          <${Icon} name="search" />
          <input name="search" placeholder="搜尋儀器型號、品牌、分類..." />
          <button>搜尋</button>
        </form>
        <div className="hero-actions">
          <${ButtonLink} href="/listings/create" className="button-light">刊登出售儀器<//>
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
              favorite=${favorites.includes(listing.id)}
              onFavorite=${onFavorite}
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
        <p>以交易所規格整理醫美設備資訊，讓買家快速比較價格、成色、地區與品牌，賣家亦可清晰展示設備價值。</p>
      </div>
      <div className="stats-grid">
        <div><strong>${platformStats.activeListings}</strong><span>上架儀器</span></div>
        <div><strong>${platformStats.totalUsers}</strong><span>註冊用戶</span></div>
        <div><strong>${platformStats.totalListings}</strong><span>總刊登數</span></div>
      </div>
    </section>

    <section className="section">
      <div className="security-panel premium-panel">
        <div className="premium-copy">
          <span className="section-kicker">安全保障</span>
          <h2>安全交易保障</h2>
          <p>易搜王為每一位用戶提供全方位的交易安全保障。</p>
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
        <p>由刊登、估值、詢價到交收安排，流程集中在同一個平台完成，幫助美容院更快釋放設備資金。</p>
        <div className="concierge-list">
          <span><${Icon} name="check" /> 上門評估</span>
          <span><${Icon} name="check" /> 即時報價</span>
          <span><${Icon} name="check" /> 快速成交</span>
        </div>
        <${ButtonLink} href="/listings/create">刊登或查詢收機<//>
      </div>
      <figure className="concierge-media">
        <img src=${assetUrl("/assets/valuation-premium-image2.png")} alt="二手醫美儀器估值服務" loading="lazy" />
      </figure>
    </section>

    <section className="cta-band">
      <h2>立即開始交易</h2>
      <p>無論您是想購買二手醫美儀器，還是想出售閒置設備，易搜王都是您的最佳選擇。</p>
      <div>
        <${ButtonLink} href="/listings">立即購買<//>
        <${ButtonLink} href="/listings/create" className="button-light">刊登出售<//>
      </div>
    </section>
  </main>`;
}

function filterListings(listings, filters) {
  let result = listings.filter((listing) => listing.status !== "inactive");
  const search = filters.search.trim().toLowerCase();
  if (search) {
    result = result.filter((listing) =>
      [listing.title, listing.brand, listing.model, listing.description].join(" ").toLowerCase().includes(search),
    );
  }
  if (filters.category) result = result.filter((listing) => listing.categoryId === Number(filters.category));
  if (filters.condition) result = result.filter((listing) => listing.condition === filters.condition);
  if (filters.region) result = result.filter((listing) => listing.region === filters.region);
  if (filters.min) result = result.filter((listing) => listing.price >= Number(filters.min));
  if (filters.max) result = result.filter((listing) => listing.price <= Number(filters.max));
  if (filters.sort === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
  if (filters.sort === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
  if (filters.sort === "views") result = [...result].sort((a, b) => b.viewCount - a.viewCount);
  if (filters.sort === "newest") result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return result;
}

function ListingsPage({ routeKey, categories, listings, favorites, onFavorite }) {
  const query = new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState({
    search: query.get("search") || "",
    category: query.get("category") || "",
    min: "",
    max: "",
    condition: "",
    region: "",
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
      <p>共找到 ${filtered.length} 件商品</p>
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
        <div className="price-pair">
          <label>最低<input type="number" value=${filters.min} onInput=${(event) => update("min", event.target.value)} /></label>
          <label>最高<input type="number" value=${filters.max} onInput=${(event) => update("max", event.target.value)} /></label>
        </div>
        <label>成色
          <select value=${filters.condition} onChange=${(event) => update("condition", event.target.value)}>
            <option value="">全部</option>
            ${conditions.map((condition) => html`<option key=${condition}>${condition}</option>`)}
          </select>
        </label>
        <label>地區
          <select value=${filters.region} onChange=${(event) => update("region", event.target.value)}>
            <option value="">全港</option>
            ${regions.map((region) => html`<option key=${region}>${region}</option>`)}
          </select>
        </label>
        <button
          className="button ghost full"
          onClick=${() => {
            setFilters({ search: "", category: "", min: "", max: "", condition: "", region: "", sort: "newest" });
            setPage(1);
          }}
        >清除篩選</button>
      </aside>
      <section className="market-results">
        <div className="result-toolbar">
          <span>${filtered.length} 件商品</span>
          <select value=${filters.sort} onChange=${(event) => update("sort", event.target.value)}>
            <option value="newest">最新刊登</option>
            <option value="price-asc">價格由低至高</option>
            <option value="price-desc">價格由高至低</option>
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
                  favorite=${favorites.includes(listing.id)}
                  onFavorite=${onFavorite}
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

function ListingDetail({ id, categories, listings, favorites, onFavorite, addInquiry }) {
  const listing = listings.find((item) => item.id === Number(id));
  const [activeImage, setActiveImage] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [sent, setSent] = useState(false);

  if (!listing) {
    return html`<main className="page"><div className="empty-state"><h1>商品不存在</h1><p>此商品可能已被下架或刪除</p><${ButtonLink} href="/listings">返回商品列表<//></div></main>`;
  }

  const images = listing.images.length ? listing.images : [{ imageUrl: listing.featuredImageUrl }];
  const submitInquiry = (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    addInquiry({
      id: Date.now(),
      listingId: listing.id,
      name: form.name,
      phone: form.phone,
      email: form.email,
      message: form.message,
      status: "unread",
      createdAt: new Date().toISOString(),
    });
    setSent(true);
    setShowInquiry(false);
  };

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
        <div className="detail-price">
          ${formatPrice(listing.price)}
          ${listing.negotiable ? html`<span>價格可議</span>` : ""}
        </div>
        <dl className="spec-list">
          <div><dt>品牌</dt><dd>${listing.brand}</dd></div>
          <div><dt>型號</dt><dd>${listing.model}</dd></div>
          <div><dt>成色</dt><dd>${listing.condition}</dd></div>
          <div><dt>購買年份</dt><dd>${listing.yearOfPurchase}</dd></div>
          <div><dt>所在地區</dt><dd>${listing.region}</dd></div>
          <div><dt>分類</dt><dd>${categoryName(categories, listing.categoryId)}</dd></div>
        </dl>
        <div className="detail-actions">
          <button className="button" onClick=${() => setShowInquiry(true)}><${Icon} name="mail" /> 聯絡賣家詢問</button>
          <a className="button whatsapp" href=${`https://wa.me/852${String(listing.contactPhone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><${Icon} name="phone" /> WhatsApp 聯絡</a>
          <button className=${classNames("button ghost", favorites.includes(listing.id) && "selected")} onClick=${() => onFavorite(listing.id)}><${Icon} name="heart" filled=${favorites.includes(listing.id)} /> 收藏</button>
        </div>
        ${sent ? html`<div className="notice success">詢問已發送，賣家將盡快回覆您！</div>` : ""}
      </aside>
    </section>
    <section className="section slim">
      <h2>商品描述</h2>
      <p className="description">${listing.description}</p>
    </section>
    ${showInquiry
      ? html`<div className="modal-backdrop" onClick=${() => setShowInquiry(false)}>
          <form className="modal-card" onClick=${(event) => event.stopPropagation()} onSubmit=${submitInquiry}>
            <h2>發送詢問</h2>
            <label>您的姓名 *<input name="name" required placeholder="請輸入您的姓名" /></label>
            <label>電話 / WhatsApp<input name="phone" placeholder="電話號碼" /></label>
            <label>電郵<input name="email" type="email" placeholder="電郵地址" /></label>
            <label>詢問內容 *<textarea name="message" required placeholder="請輸入您的詢問，例如：詢問儀器狀況、是否可以議價等..."></textarea></label>
            <div className="modal-actions">
              <button type="button" className="button ghost" onClick=${() => setShowInquiry(false)}>取消</button>
              <button className="button">發送詢問</button>
            </div>
          </form>
        </div>`
      : ""}
  </main>`;
}

function CreateListing({ categories, addListing }) {
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    categoryId: categories[0]?.id || 1,
    title: "",
    brand: "",
    model: "",
    condition: "九成新",
    yearOfPurchase: "2022",
    description: "",
    region: "九龍",
    price: "",
    negotiable: true,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactMethod: "WhatsApp",
    imageUrl: "",
  });
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const submit = (event) => {
    event.preventDefault();
    const newListing = {
      id: Date.now(),
      userId: 2,
      ...form,
      categoryId: Number(form.categoryId),
      yearOfPurchase: Number(form.yearOfPurchase),
      price: Number(form.price),
      featuredImageUrl: form.imageUrl || "/assets/imported/diode-laser_4bbcd026.webp",
      images: [{ id: Date.now(), listingId: Date.now(), imageUrl: form.imageUrl || "/assets/imported/diode-laser_4bbcd026.webp", imageKey: "", sortOrder: 0, createdAt: new Date().toISOString() }],
      status: "pending",
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addListing(newListing);
    setSuccess(true);
  };

  if (success) {
    return html`<main className="page">
      <div className="success-panel">
        <span><${Icon} name="check" /></span>
        <h1>刊登成功！</h1>
        <p>您的儀器已成功提交，正等待管理員審核。審核通過後將自動上架，通常需要 1-2 個工作天。</p>
        <div>
          <${ButtonLink} href="/dashboard">查看我的刊登<//>
          <button className="button ghost" onClick=${() => setSuccess(false)}>繼續刊登</button>
        </div>
      </div>
    </main>`;
  }

  return html`<main className="page create-page">
    <section className="page-title">
      <span className="section-kicker">刊登出售</span>
      <h1>刊登出售儀器</h1>
      <p>填寫以下資料，讓買家更快找到您的儀器</p>
    </section>
    <form className="create-shell" onSubmit=${submit}>
      <div className="stepper">
        ${["選擇分類", "商品資訊", "價格設定"].map((label, index) => html`<button type="button" className=${index === step ? "active" : ""} onClick=${() => setStep(index)}>${index + 1}. ${label}</button>`)}
      </div>
      ${step === 0
        ? html`<section className="form-section">
            <h2>選擇儀器分類</h2>
            <div className="category-picker">
              ${categories.map((category) => html`<button
                type="button"
                key=${category.id}
                className=${Number(form.categoryId) === category.id ? "active" : ""}
                onClick=${() => update("categoryId", category.id)}
              >
                <${CategoryIcon} icon=${category.icon} />
                <strong>${category.name}</strong>
                <small>${category.description}</small>
              </button>`)}
            </div>
          </section>`
        : ""}
      ${step === 1
        ? html`<section className="form-section">
            <h2>填寫商品資訊</h2>
            <label>商品標題 *<input required value=${form.title} onInput=${(event) => update("title", event.target.value)} placeholder="例如：Sofwave 索芙波除皺緊膚儀（九成新）" /></label>
            <div className="form-grid">
              <label>品牌<input value=${form.brand} onInput=${(event) => update("brand", event.target.value)} placeholder="例如：Sofwave" /></label>
              <label>型號<input value=${form.model} onInput=${(event) => update("model", event.target.value)} placeholder="例如：SW-01" /></label>
              <label>成色
                <select value=${form.condition} onChange=${(event) => update("condition", event.target.value)}>${conditions.map((condition) => html`<option>${condition}</option>`)}</select>
              </label>
              <label>購買年份<input type="number" value=${form.yearOfPurchase} onInput=${(event) => update("yearOfPurchase", event.target.value)} placeholder="例如：2022" /></label>
            </div>
            <label>商品描述<textarea value=${form.description} onInput=${(event) => update("description", event.target.value)} placeholder="詳細描述儀器狀況、使用次數、附件等..."></textarea></label>
            <label>所在地區<select value=${form.region} onChange=${(event) => update("region", event.target.value)}>${regions.map((region) => html`<option>${region}</option>`)}</select></label>
            <label>商品圖片 URL<input value=${form.imageUrl} onInput=${(event) => update("imageUrl", event.target.value)} placeholder="https://... 或 /assets/imported/..." /></label>
          </section>`
        : ""}
      ${step === 2
        ? html`<section className="form-section">
            <h2>價格設定</h2>
            <label>售價 (HKD) *<input required type="number" value=${form.price} onInput=${(event) => update("price", event.target.value)} placeholder="例：28000" /></label>
            <label className="check-row"><input type="checkbox" checked=${form.negotiable} onChange=${(event) => update("negotiable", event.target.checked)} /> 可議價</label>
            <h2>聯絡資料</h2>
            <div className="form-grid">
              <label>聯絡人姓名<input value=${form.contactName} onInput=${(event) => update("contactName", event.target.value)} placeholder="您的姓名" /></label>
              <label>電話<input value=${form.contactPhone} onInput=${(event) => update("contactPhone", event.target.value)} placeholder="例如：9123 4567" /></label>
              <label>電郵<input value=${form.contactEmail} onInput=${(event) => update("contactEmail", event.target.value)} placeholder="電郵地址" /></label>
              <label>偏好聯絡方式<select value=${form.contactMethod} onChange=${(event) => update("contactMethod", event.target.value)}><option>WhatsApp</option><option>電話</option><option>電郵</option><option>任何方式</option></select></label>
            </div>
            <div className="notice">提示：您的聯絡資料僅會顯示給有意購買的買家，請確保資料正確。</div>
          </section>`
        : ""}
      <div className="form-actions">
        <button type="button" className="button ghost" disabled=${step === 0} onClick=${() => setStep(step - 1)}>上一步</button>
        ${step < 2
          ? html`<button type="button" className="button" onClick=${() => setStep(step + 1)}>下一步</button>`
          : html`<button className="button">提交刊登</button>`}
      </div>
    </form>
  </main>`;
}

function Dashboard({ listings, favorites, inquiries, onFavorite, setListings }) {
  const [tab, setTab] = useState("listings");
  const myListings = listings.filter((listing) => listing.userId === 2);
  const favoriteListings = listings.filter((listing) => favorites.includes(listing.id));
  return html`<main className="page dashboard-page">
    <section className="page-title">
      <span className="section-kicker">用戶中心</span>
      <h1>我的儀表板</h1>
      <p>登入後即可管理您的刊登、收藏及詢問記錄</p>
    </section>
    <div className="tabs">
      ${[["listings", "我的刊登"], ["favorites", "我的收藏"], ["inquiries", "詢問記錄"]].map(([id, label]) => html`<button className=${tab === id ? "active" : ""} onClick=${() => setTab(id)}>${label}</button>`)}
    </div>
    ${tab === "listings"
      ? html`<div className="table-card">
          ${myListings.length
            ? html`<table><thead><tr><th>商品</th><th>價格</th><th>狀態</th><th>操作</th></tr></thead><tbody>
                ${myListings.map((listing) => html`<tr key=${listing.id}><td>${listing.title}</td><td>${formatPrice(listing.price)}</td><td><${StatusBadge} status=${listing.status} /></td><td><button onClick=${() => setListings((items) => items.filter((item) => item.id !== listing.id))}>刪除</button></td></tr>`)}
              </tbody></table>`
            : html`<div className="empty-state"><h3>您尚未刊登任何儀器</h3><${ButtonLink} href="/listings/create">立即刊登<//></div>`}
        </div>`
      : ""}
    ${tab === "favorites"
      ? html`<div className="listing-grid compact">
          ${favoriteListings.length
            ? favoriteListings.map((listing) => html`<${ListingCard} key=${listing.id} listing=${listing} categories=${seedCategories} favorite=${true} onFavorite=${onFavorite} />`)
            : html`<div className="empty-state"><h3>您尚未收藏任何商品</h3><${ButtonLink} href="/listings">瀏覽儀器<//></div>`}
        </div>`
      : ""}
    ${tab === "inquiries"
      ? html`<div className="table-card">
          ${inquiries.length
            ? html`<table><thead><tr><th>商品</th><th>內容摘要</th><th>狀態</th><th>日期</th></tr></thead><tbody>${inquiries.map((inquiry) => html`<tr><td>商品 #${inquiry.listingId}</td><td>${inquiry.message}</td><td>${inquiry.status === "replied" ? "已回覆" : inquiry.status === "read" ? "已讀" : "待回覆"}</td><td>${dateLabel(inquiry.createdAt)}</td></tr>`)}</tbody></table>`
            : html`<div className="empty-state"><h3>您尚未發送任何詢問</h3></div>`}
        </div>`
      : ""}
  </main>`;
}

function AboutPage() {
  const services = [
    ["二手儀器買賣", "提供全港最齊全的二手醫美儀器買賣平台，激光、射頻、超聲波等各類儀器一應俱全。每件商品均經過審核，確保資訊真實可靠。", ["嚴格商品審核", "真實資訊保障", "安全交易環境"]],
    ["收機服務", "專業團隊上門評估及收購各類二手醫美儀器，提供公平合理的收購價格，讓您輕鬆變現閒置設備。", ["上門評估", "即時報價", "快速成交"]],
    ["維修服務", "擁有豐富維修經驗的專業技術團隊，為各品牌醫美儀器提供全面的維修及保養服務，確保儀器正常運作。", ["各品牌維修", "專業技術團隊", "保固服務"]],
    ["美容院頂讓服務", "協助美容院業主進行整體頂讓，包括儀器估值、設備轉讓及客戶資源對接，提供一站式頂讓解決方案。", ["整體頂讓方案", "儀器估值服務", "客戶資源對接"]],
  ];
  const timeline = [
    ["公司成立", "易搜王於香港成立，專注於醫美儀器二手交易市場"],
    ["平台上線", "推出線上交易平台，為買賣雙方提供更便捷的交易體驗"],
    ["業務擴展", "新增維修服務及美容院頂讓服務，業務範疇持續擴大"],
    ["全新升級", "平台全面升級，提供更完善的用戶體驗及安全保障"],
  ];

  return html`<main className="page">
    <section className="about-hero">
      <div>
        <span className="section-kicker">關於易搜王</span>
        <h1>香港醫美儀器<br />交易所</h1>
        <p>易搜王是香港首選的二手醫美儀器交易平台，致力於為美容業界提供安全、便捷、透明的儀器買賣服務。</p>
      </div>
      <figure className="about-hero-media"><img src=${assetUrl("/assets/valuation-premium-image2.png")} alt="易搜王專業估值服務" /></figure>
      <div className="about-stat"><strong>62</strong><span>成功交易</span></div>
      <div className="about-stat"><strong>2024</strong><span>服務年資</span></div>
    </section>
    <section className="section slim">
      <h2>我們的使命</h2>
      <p className="description">易搜王成立的初衷，是為香港美容業界建立一個值得信賴的二手醫美儀器交易平台。我們深明美容院在採購儀器時面對的挑戰，因此致力提供真實可靠的商品資訊、公平透明的定價機制，以及完善的買家保障，讓每一筆交易都安全可靠。</p>
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
    <section className="cta-band"><h2>加入易搜王，與數千名香港美容業界人士一同交易</h2><${ButtonLink} href="/listings/create">立即刊登儀器<//></section>
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
      <p>如有任何查詢，歡迎透過以下方式聯絡我們，我們將盡快回覆。</p>
    </section>
    <div className="contact-grid">
      <aside className="contact-info">
        <h2>聯絡資訊</h2>
        <p><${Icon} name="location" /> 香港九龍旺角彌敦道XXX號XXX樓</p>
        <p><${Icon} name="phone" /> 9123 4567</p>
        <p><${Icon} name="mail" /> demo@yisouwang.hk</p>
        <h3>辦公時間</h3>
        <p>星期一至六 10:00 - 19:00</p>
        <a className="button whatsapp" href="https://wa.me/85212345678" target="_blank" rel="noreferrer">WhatsApp 即時查詢</a>
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
    ["/admin/users", "用戶管理"],
    ["/admin/inquiries", "詢問管理"],
    ["/admin/contacts", "聯絡查詢"],
  ];
  return html`<main className="admin-shell">
    <aside className="admin-sidebar">
      <h2><${BrandLogo} compact=${true} /> 易搜王管理後台</h2>
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
      <div><strong>${adminUsers.length}</strong><span>總用戶數</span></div>
      <div><strong>${unread}</strong><span>未讀詢問</span></div>
    </div>
    <div className="table-card">
      <h2>待審核商品</h2>
      ${pending.length ? html`<table><tbody>${pending.slice(0, 6).map((listing) => html`<tr><td>${listing.title}</td><td>${formatPrice(listing.price)}</td><td>審核</td></tr>`)}</tbody></table>` : html`<p>暫無待審核商品</p>`}
    </div>
  </div>`;
}

function AdminListings({ listings, setListings }) {
  const [search, setSearch] = useState("");
  const visible = listings.filter((listing) => listing.title.toLowerCase().includes(search.toLowerCase()));
  const updateStatus = (id, status) => setListings((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  return html`<div>
    <div className="admin-head"><h1>商品管理</h1><p>審核、編輯、管理所有刊登商品</p></div>
    <div className="result-toolbar"><input value=${search} onInput=${(event) => setSearch(event.target.value)} placeholder="搜尋商品標題..." /><span>共 ${visible.length} 件</span></div>
    <div className="table-card"><table>
      <thead><tr><th>商品</th><th>價格</th><th>狀態</th><th>刊登日期</th><th>操作</th></tr></thead>
      <tbody>${visible.slice(0, 30).map((listing) => html`<tr>
        <td><strong>${listing.title}</strong><small>${listing.brand} ${listing.model}</small></td>
        <td>${formatPrice(listing.price)}</td>
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

function AdminUsers() {
  const [users, setUsers] = useState(adminUsers);
  return html`<div>
    <div className="admin-head"><h1>用戶管理</h1><p>管理平台所有用戶及其權限</p></div>
    <div className="table-card"><table>
      <thead><tr><th>用戶</th><th>角色</th><th>加入日期</th><th>操作</th></tr></thead>
      <tbody>${users.map((user) => html`<tr>
        <td><strong>${user.name}</strong><small>${user.email}</small></td>
        <td>${user.role}</td>
        <td>${user.joinedAt}</td>
        <td><button onClick=${() => setUsers((items) => items.map((item) => item.id === user.id ? { ...item, role: item.role === "管理員" ? "普通用戶" : "管理員" } : item))}>${user.role === "管理員" ? "降為用戶" : "升為管理員"}</button></td>
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
  if (route === "/admin/users") child = html`<${AdminUsers} />`;
  if (route === "/admin/inquiries") child = html`<${AdminMessageTable} title="詢問管理" subtitle="管理買家對商品的詢問記錄" items=${props.inquiries} setItems=${props.setInquiries} type="inquiry" />`;
  if (route === "/admin/contacts") child = html`<${AdminMessageTable} title="聯絡查詢" subtitle="管理透過聯絡頁面提交的查詢" items=${props.contacts} setItems=${props.setContacts} type="contact" />`;
  return html`<${AdminLayout} route=${route}>${child}<//>`;
}

function App() {
  const [currentRouteKey, setRouteKey] = useState(routeKey());
  const [categories, setCategories] = useStoredState(STORAGE.categories, seedCategories);
  const [listings, setListings] = useStoredState(STORAGE.listings, seedListings);
  const [favorites, setFavorites] = useStoredState(STORAGE.favorites, []);
  const [inquiries, setInquiries] = useStoredState(STORAGE.inquiries, []);
  const [contacts, setContacts] = useStoredState(STORAGE.contacts, []);

  useEffect(() => {
    const updateRoute = () => setRouteKey(routeKey());
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  };

  const path = appPathname();
  let page;
  if (path === "/") page = html`<${HomePage} categories=${categories} listings=${listings} favorites=${favorites} onFavorite=${toggleFavorite} />`;
  else if (path === "/listings") page = html`<${ListingsPage} routeKey=${currentRouteKey} categories=${categories} listings=${listings} favorites=${favorites} onFavorite=${toggleFavorite} />`;
  else if (path.startsWith("/listing/")) page = html`<${ListingDetail} id=${path.split("/").pop()} categories=${categories} listings=${listings} favorites=${favorites} onFavorite=${toggleFavorite} addInquiry=${(item) => setInquiries((items) => [item, ...items])} />`;
  else if (path === "/listings/create") page = html`<${CreateListing} categories=${categories} addListing=${(item) => setListings((items) => [item, ...items])} />`;
  else if (path === "/dashboard") page = html`<${Dashboard} listings=${listings} favorites=${favorites} inquiries=${inquiries} onFavorite=${toggleFavorite} setListings=${setListings} />`;
  else if (path === "/about") page = html`<${AboutPage} />`;
  else if (path === "/contact") page = html`<${ContactPage} addContact=${(item) => setContacts((items) => [item, ...items])} />`;
  else if (path.startsWith("/admin")) page = html`<${AdminPage} categories=${categories} setCategories=${setCategories} listings=${listings} setListings=${setListings} inquiries=${inquiries} setInquiries=${setInquiries} contacts=${contacts} setContacts=${setContacts} />`;
  else page = html`<main className="page"><div className="empty-state"><h1>頁面不存在</h1><${ButtonLink} href="/">返回首頁<//></div></main>`;

  return html`<div>
    <${Navbar} route=${path} favoritesCount=${favorites.length} />
    ${page}
    ${path.startsWith("/admin") ? "" : html`<${Footer} categories=${categories} />`}
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
