/* ============================================
   StreamVerse — script.js
   ============================================ */
'use strict';

// ── State ──────────────────────────────────
let allChannels = [];
let currentChannelId = null;
let hlsInstance = null;
let favorites = JSON.parse(localStorage.getItem('sv_favorites') || '[]');
let recentlyWatched = JSON.parse(localStorage.getItem('sv_recent') || '[]');
let heroIndex = 0;
let heroTimer = null;
let currentFilter = 'All';

// ── Country Flags ──────────────────────────────────
const FLAGS = { US:'🇺🇸', DE:'🇩🇪', FR:'🇫🇷', QA:'🇶🇦', GB:'🇬🇧', EU:'🇪🇺', CN:'🇨🇳', RU:'🇷🇺', TR:'🇹🇷', JP:'🇯🇵', KR:'🇰🇷', SG:'🇸🇬', IN:'🇮🇳' };

// ── Fake TV Schedule Data ──────────────────────────────────
const PROGRAMS = [
  ['World News', 'Sports Update', 'Documentary', 'Tech Today', 'Live Debate'],
  ['Morning Show', 'Business Hour', 'Market Watch', 'Interview Live', 'Evening News'],
  ['Film Review', 'Culture Talk', 'Science Now', 'Travel Show', 'Night Edition'],
  ['Music Hits', 'Artist Spotlight', 'Countdown', 'Acoustic Session', 'Top 40'],
  ['Kids Corner', 'Cartoon Time', 'Story Hour', 'Learning Fun', 'Nature Jr.'],
  ['Sports Central', 'Match Preview', 'Highlights', 'Post Game', 'Analysis'],
];
const TIME_SLOTS = ['06:00','07:30','09:00','10:30','12:00','13:30','15:00','16:30','18:00','19:30','21:00','22:30'];

// ── Init ──────────────────────────────────
window.addEventListener('load', async () => {
  await loadChannels();
  setupEventListeners();
  renderAll();
  checkOffline();
  setTimeout(() => { document.getElementById('loader').classList.add('done'); }, 1600);
  setupPWA();
});

async function loadChannels() {
  try {
    const res = await fetch('channels.json');
    allChannels = await res.json();
  } catch (e) {
    // Fallback inline data
    allChannels = getFallbackChannels();
  }
}

function getFallbackChannels() {
  return [
    { id:1, name:'NASA TV', category:'News', country:'US', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png', stream:'https://nasa-i.akamaihd.net/hls/live/253565/NASA-NTV1-HLS/master.m3u8', description:'Live space missions from NASA', trending:true, tags:['space','science'] },
    { id:2, name:'DW News', category:'News', country:'DE', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Deutsche_Welle_symbol_2012.svg/200px-Deutsche_Welle_symbol_2012.svg.png', stream:'https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8', description:'International news from DW', trending:true, tags:['news','international'] },
    { id:3, name:'France 24', category:'News', country:'FR', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/France_24_logo.svg/200px-France_24_logo.svg.png', stream:'https://stream.france24.com/hls/live/2037105/F24_EN_LO_HLS/master.m3u8', description:'Live news from France 24', trending:true, tags:['news','france'] },
    { id:4, name:'Al Jazeera', category:'News', country:'QA', logo:'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Al_Jazeera_MediaNetwork_Logo.svg/200px-Al_Jazeera_MediaNetwork_Logo.svg.png', stream:'https://live-hls-web-aje.getaj.net/AJE/01.m3u8', description:'24/7 live news from Al Jazeera', trending:true, tags:['news'] },
    { id:5, name:'NHK World', category:'News', country:'JP', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/NHK_World_logo.svg/200px-NHK_World_logo.svg.png', stream:'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8', description:"Japan's NHK World in English", trending:true, tags:['news','japan'] },
    { id:6, name:'Bloomberg TV', category:'News', country:'US', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bloomberg_Television_logo.svg/200px-Bloomberg_Television_logo.svg.png', stream:'https://bloomberg-bloomberg-1-us.samsung.wurl.tv/manifest/playlist.m3u8', description:'Financial and business news', trending:true, tags:['news','business'] },
    { id:7, name:'TRT World', category:'News', country:'TR', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/TRT_World_logo.svg/200px-TRT_World_logo.svg.png', stream:'https://tv-trtworld.live.trt.com.tr/master.m3u8', description:"Turkey's international news channel", trending:false, tags:['news'] },
    { id:8, name:'DW Arabic', category:'News', country:'DE', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Deutsche_Welle_symbol_2012.svg/200px-Deutsche_Welle_symbol_2012.svg.png', stream:'https://dwamdstream102.akamaized.net/hls/live/2015526/dwstream102/index.m3u8', description:'DW Arabic news and programming', trending:false, tags:['news','arabic'] },
    { id:9, name:'Arirang TV', category:'Entertainment', country:'KR', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Arirang_TV.svg/200px-Arirang_TV.svg.png', stream:'https://amdlive-ctnd02.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8', description:'Korean entertainment and culture', trending:true, tags:['entertainment','korea'] },
    { id:10, name:'Lofi Music TV', category:'Music', country:'US', logo:'https://via.placeholder.com/100/4ECDC4/FFFFFF?text=LOFI', stream:'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', description:'24/7 chill lofi music', trending:true, tags:['music','lofi'] },
    { id:11, name:'Sports 24', category:'Sports', country:'US', logo:'https://via.placeholder.com/100/E74C3C/FFFFFF?text=SPORT', stream:'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', description:'Live sports and highlights', trending:true, tags:['sports'] },
    { id:12, name:'Kids TV', category:'Kids', country:'US', logo:'https://via.placeholder.com/100/FF6B6B/FFFFFF?text=KIDS', stream:'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8', description:'Fun shows for children', trending:false, tags:['kids'] },
  ];
}

// ── Render All ──────────────────────────────────
function renderAll() {
  renderHeroSlider();
  renderTrendingRow();
  renderNewsRow();
  renderEntertainRow();
  renderMusicRow();
  renderCatsGrid();
  renderRecentRow();
  renderLiveGrid(currentFilter);
  renderTVGuide();
  renderFavGrid();
  updateFavCount();
}

// ── Hero Slider ──────────────────────────────────
function renderHeroSlider() {
  const trending = allChannels.filter(c => c.trending).slice(0, 5);
  const slidesEl = document.getElementById('heroSlides');
  const dotsEl = document.getElementById('heroDots');
  slidesEl.innerHTML = '';
  dotsEl.innerHTML = '';

  trending.forEach((ch, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide';
    slide.innerHTML = `
      <div class="hero-slide-bg">${getCatEmoji(ch.category)}</div>
      <div class="hero-slide-overlay"></div>
      <div class="hero-slide-content">
        <span class="slide-badge">🔴 LIVE NOW</span>
        <h2>${ch.name}</h2>
        <p>${ch.description}</p>
        <button class="watch-now" onclick="openPlayer(${ch.id})">▶ Watch Now <span>${FLAGS[ch.country] || '🌐'}</span></button>
      </div>
    `;
    slidesEl.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = `hero-dot ${i === 0 ? 'active' : ''}`;
    dot.onclick = () => goToSlide(i);
    dotsEl.appendChild(dot);
  });

  startHeroAuto();
}

function goToSlide(idx) {
  heroIndex = idx;
  document.getElementById('heroSlides').style.transform = `translateX(-${idx * 100}%)`;
  document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

function startHeroAuto() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    const total = allChannels.filter(c => c.trending).slice(0, 5).length;
    goToSlide((heroIndex + 1) % total);
  }, 5000);
}

document.getElementById('heroPrev').onclick = () => {
  const total = allChannels.filter(c => c.trending).slice(0, 5).length;
  goToSlide((heroIndex - 1 + total) % total);
  startHeroAuto();
};
document.getElementById('heroNext').onclick = () => {
  const total = allChannels.filter(c => c.trending).slice(0, 5).length;
  goToSlide((heroIndex + 1) % total);
  startHeroAuto();
};

// ── Row Builders ──────────────────────────────────
function renderTrendingRow() {
  const trending = allChannels.filter(c => c.trending);
  renderScrollRow('trendingRow', trending);
}
function renderNewsRow() {
  renderScrollRow('newsRow', allChannels.filter(c => c.category === 'News').slice(0, 8));
}
function renderEntertainRow() {
  renderScrollRow('entertainRow', allChannels.filter(c => c.category === 'Entertainment').slice(0, 8));
}
function renderMusicRow() {
  renderScrollRow('musicRow', allChannels.filter(c => c.category === 'Music').slice(0, 8));
}

function renderScrollRow(containerId, channels) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = channels.map(ch => buildSmallCard(ch)).join('');
  // Attach events
  el.querySelectorAll('.channel-card-sm').forEach(card => {
    const id = parseInt(card.dataset.id);
    card.querySelector('.play-overlay').addEventListener('click', e => { e.stopPropagation(); openPlayer(id); });
    card.addEventListener('click', () => openPlayer(id));
    const favBtn = card.querySelector('.fav-chip');
    if (favBtn) favBtn.addEventListener('click', e => { e.stopPropagation(); toggleFav(id, favBtn); });
  });
}

function buildSmallCard(ch) {
  const isFav = favorites.includes(ch.id);
  return `
    <div class="channel-card-sm" data-id="${ch.id}">
      <div class="card-thumb">
        <img src="${ch.logo}" alt="${ch.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/80/333/fff?text=${encodeURIComponent(ch.name.slice(0,2))}'">
        <div class="play-overlay">▶</div>
        <span class="live-chip">🔴 LIVE</span>
        <button class="fav-chip ${isFav ? 'active' : ''}" data-id="${ch.id}">${isFav ? '❤️' : '🤍'}</button>
      </div>
      <div class="card-info">
        <div class="card-name">${ch.name}</div>
        <div class="card-cat">${ch.category} ${FLAGS[ch.country] || ''}</div>
      </div>
    </div>
  `;
}

// ── Recently Watched ──────────────────────────────────
function renderRecentRow() {
  const sec = document.getElementById('recentSection');
  const el = document.getElementById('recentRow');
  if (!el) return;
  if (recentlyWatched.length === 0) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  const channels = recentlyWatched.map(id => allChannels.find(c => c.id === id)).filter(Boolean);
  renderScrollRow('recentRow', channels);
}

function addToRecent(id) {
  recentlyWatched = [id, ...recentlyWatched.filter(r => r !== id)].slice(0, 8);
  localStorage.setItem('sv_recent', JSON.stringify(recentlyWatched));
  renderRecentRow();
}

// ── Categories Grid ──────────────────────────────────
const CATS = [
  { name:'News', icon:'📰' },
  { name:'Sports', icon:'⚽' },
  { name:'Movies', icon:'🎬' },
  { name:'Entertainment', icon:'🎭' },
  { name:'Kids', icon:'🧒' },
  { name:'Music', icon:'🎵' },
];
function renderCatsGrid() {
  const el = document.getElementById('catsGrid');
  if (!el) return;
  el.innerHTML = CATS.map(cat => {
    const count = allChannels.filter(c => c.category === cat.name).length;
    return `<div class="cat-card" onclick="filterAndGoLive('${cat.name}')">
      <div class="cat-icon">${cat.icon}</div>
      <div class="cat-name">${cat.name}</div>
      <div class="cat-count">${count} channels</div>
    </div>`;
  }).join('');
}

function filterAndGoLive(cat) {
  currentFilter = cat;
  renderLiveGrid(cat);
  showPage('livetv');
  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  document.querySelectorAll('.cat-item').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
}

// ── Live TV Grid ──────────────────────────────────
function renderLiveGrid(cat = 'All') {
  const el = document.getElementById('liveGrid');
  if (!el) return;
  const filtered = cat === 'All' ? allChannels : allChannels.filter(c => c.category === cat);
  el.innerHTML = filtered.map(ch => buildGridCard(ch)).join('');
  el.querySelectorAll('.channel-grid-card').forEach(card => {
    const id = parseInt(card.dataset.id);
    card.addEventListener('click', () => openPlayer(id));
    const favBtn = card.querySelector('.gc-fav');
    if (favBtn) favBtn.addEventListener('click', e => { e.stopPropagation(); toggleFav(id, favBtn); });
  });
}

function buildGridCard(ch) {
  const isFav = favorites.includes(ch.id);
  const isActive = ch.id === currentChannelId;
  return `
    <div class="channel-grid-card ${isActive ? 'active-channel' : ''}" data-id="${ch.id}">
      <div class="gc-thumb">
        <img src="${ch.logo}" alt="${ch.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/80/333/fff?text=${encodeURIComponent(ch.name.slice(0,2))}'">
        <div class="play-ov">▶</div>
        <span class="live-chip">🔴</span>
        <span class="country-flag">${FLAGS[ch.country] || '🌐'}</span>
      </div>
      <div class="gc-info">
        <div class="gc-name">${ch.name}</div>
        <div class="gc-meta">
          <span class="gc-cat">${ch.category}</span>
          <button class="gc-fav ${isFav ? 'active' : ''}" data-id="${ch.id}">${isFav ? '❤️' : '🤍'}</button>
        </div>
      </div>
    </div>
  `;
}

// ── TV Guide ──────────────────────────────────
function renderTVGuide() {
  const container = document.getElementById('guideContainer');
  if (!container) return;
  const now = new Date();
  const guides = allChannels.slice(0, 10);

  let html = `<div class="guide-table">
    <div class="guide-time-header">
      <div class="guide-time-label">Channel</div>
      <div class="guide-time-slots">${TIME_SLOTS.map(t => `<div class="time-slot">${t}</div>`).join('')}</div>
    </div>`;

  guides.forEach((ch, ci) => {
    const progs = PROGRAMS[ci % PROGRAMS.length];
    html += `<div class="guide-row">
      <div class="guide-channel-cell" onclick="openPlayer(${ch.id})">
        <img src="${ch.logo}" alt="${ch.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/36/333/fff?text=${encodeURIComponent(ch.name.slice(0,1))}'">
        <div>
          <div class="g-ch-name">${ch.name}</div>
          <div class="g-ch-cat">${ch.category}</div>
        </div>
      </div>
      <div class="guide-programs">
        ${TIME_SLOTS.map((t, ti) => {
          const prog = progs[ti % progs.length];
          const [h, m] = t.split(':').map(Number);
          const slotTime = new Date(); slotTime.setHours(h, m, 0);
          const nextSlot = TIME_SLOTS[ti + 1] ? (() => { const [nh,nm] = TIME_SLOTS[ti+1].split(':').map(Number); const d = new Date(); d.setHours(nh,nm,0); return d; })() : null;
          const isCurrent = now >= slotTime && (!nextSlot || now < nextSlot);
          return `<div class="program-block ${isCurrent ? 'current' : ''}">
            <div class="prog-time">${t}${isCurrent ? ' · NOW' : ''}</div>
            <div class="prog-title">${prog}</div>
            <div class="prog-desc">${ch.description}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ── Favorites ──────────────────────────────────
function toggleFav(id, btn) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
    if (btn) { btn.textContent = '🤍'; btn.classList.remove('active'); }
  } else {
    favorites.push(id);
    if (btn) { btn.textContent = '❤️'; btn.classList.add('active'); }
  }
  localStorage.setItem('sv_favorites', JSON.stringify(favorites));
  updateFavCount();
  renderFavGrid();
  // Update player fav btn
  const pfb = document.getElementById('playerFavBtn');
  if (pfb && currentChannelId === id) {
    pfb.textContent = favorites.includes(id) ? '❤️' : '🤍';
  }
}

function updateFavCount() {
  const el = document.getElementById('favCount');
  if (el) el.textContent = favorites.length;
}

function renderFavGrid() {
  const el = document.getElementById('favGrid');
  const empty = document.getElementById('favEmpty');
  if (!el) return;
  const favChannels = favorites.map(id => allChannels.find(c => c.id === id)).filter(Boolean);
  if (favChannels.length === 0) {
    el.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
  } else {
    if (empty) empty.classList.add('hidden');
    el.innerHTML = favChannels.map(ch => buildGridCard(ch)).join('');
    el.querySelectorAll('.channel-grid-card').forEach(card => {
      const id = parseInt(card.dataset.id);
      card.addEventListener('click', () => openPlayer(id));
      const favBtn = card.querySelector('.gc-fav');
      if (favBtn) favBtn.addEventListener('click', e => { e.stopPropagation(); toggleFav(id, favBtn); renderFavGrid(); });
    });
  }
}

// ── Video Player ──────────────────────────────────
function openPlayer(id) {
  const ch = allChannels.find(c => c.id === id);
  if (!ch) return;
  currentChannelId = id;
  addToRecent(id);

  document.getElementById('playerName').textContent = ch.name;
  document.getElementById('playerLogo').src = ch.logo;
  document.getElementById('nowPlayingDesc').textContent = ch.description;
  document.getElementById('playerFavBtn').textContent = favorites.includes(id) ? '❤️' : '🤍';

  // Tags
  const tagsEl = document.getElementById('playerTags');
  if (tagsEl && ch.tags) {
    tagsEl.innerHTML = ch.tags.map(t => `<span class="player-tag">${t}</span>`).join('');
  }

  // Show modal
  const modal = document.getElementById('playerModal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  loadStream(ch.stream);
  highlightActiveChannel(id);
}

function loadStream(streamUrl) {
  const video = document.getElementById('videoPlayer');
  const loading = document.getElementById('playerLoading');
  const error = document.getElementById('playerError');

  loading.style.display = 'flex';
  error.classList.add('hidden');

  // Destroy previous HLS instance
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }

  if (streamUrl.includes('.m3u8')) {
    if (Hls.isSupported()) {
      hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 30 });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        loading.style.display = 'none';
      });
      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          loading.style.display = 'none';
          error.classList.remove('hidden');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadeddata', () => loading.style.display = 'none', { once: true });
      video.addEventListener('error', () => { loading.style.display = 'none'; error.classList.remove('hidden'); }, { once: true });
      video.play().catch(() => {});
    } else {
      loading.style.display = 'none';
      error.classList.remove('hidden');
    }
  } else {
    video.src = streamUrl;
    video.play().catch(() => {});
    loading.style.display = 'none';
  }
}

function closePlayer() {
  const modal = document.getElementById('playerModal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  const video = document.getElementById('videoPlayer');
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
  video.pause();
  video.src = '';
  currentChannelId = null;
  document.querySelectorAll('.channel-grid-card.active-channel').forEach(el => el.classList.remove('active-channel'));
}

function highlightActiveChannel(id) {
  document.querySelectorAll('.channel-grid-card').forEach(card => {
    card.classList.toggle('active-channel', parseInt(card.dataset.id) === id);
  });
}

// ── Player Controls ──────────────────────────────────
document.getElementById('closePlayer').addEventListener('click', closePlayer);
document.getElementById('playerOverlay').addEventListener('click', closePlayer);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePlayer();
});

document.getElementById('playerFavBtn').addEventListener('click', () => {
  if (currentChannelId) {
    const btn = document.getElementById('playerFavBtn');
    toggleFav(currentChannelId, btn);
  }
});

document.getElementById('muteBtn').addEventListener('click', () => {
  const v = document.getElementById('videoPlayer');
  v.muted = !v.muted;
  document.getElementById('muteBtn').textContent = v.muted ? '🔇' : '🔊';
  document.getElementById('volRange').value = v.muted ? 0 : v.volume;
});

document.getElementById('volRange').addEventListener('input', e => {
  const v = document.getElementById('videoPlayer');
  v.volume = parseFloat(e.target.value);
  v.muted = v.volume === 0;
  document.getElementById('muteBtn').textContent = v.muted ? '🔇' : '🔊';
});

document.getElementById('fsBtn').addEventListener('click', toggleFullscreen);
document.getElementById('retryBtn').addEventListener('click', () => {
  if (currentChannelId) {
    const ch = allChannels.find(c => c.id === currentChannelId);
    if (ch) loadStream(ch.stream);
  }
});

document.getElementById('pipBtn').addEventListener('click', () => {
  const v = document.getElementById('videoPlayer');
  if (document.pictureInPictureElement) { document.exitPictureInPicture(); }
  else if (v.requestPictureInPicture) { v.requestPictureInPicture().catch(() => {}); }
});

function toggleFullscreen() {
  const container = document.getElementById('playerModal');
  if (!document.fullscreenElement) {
    container.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.();
  }
}

// ── Navigation ──────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === pageId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (pageId === 'livetv') renderLiveGrid(currentFilter);
  if (pageId === 'favorites') renderFavGrid();
  closeSidebar();
}

// Nav items
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', e => { e.preventDefault(); showPage(item.dataset.page); });
});

// See all links
document.addEventListener('click', e => {
  const el = e.target.closest('.see-all');
  if (!el) return;
  e.preventDefault();
  if (el.dataset.page) showPage(el.dataset.page);
  if (el.dataset.cat) filterAndGoLive(el.dataset.cat);
});

// Sidebar category clicks
document.querySelectorAll('.cat-item[data-cat]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    filterAndGoLive(item.dataset.cat);
    document.querySelectorAll('.cat-item').forEach(c => c.classList.toggle('active', c.dataset.cat === item.dataset.cat));
  });
});

// Filter buttons on live tv page
document.getElementById('filterBar').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  const cat = btn.dataset.cat;
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  renderLiveGrid(cat);
});

// ── Sidebar Toggle ──────────────────────────────────
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');

// Create backdrop
const backdrop = document.createElement('div');
backdrop.className = 'sidebar-backdrop';
document.body.appendChild(backdrop);
backdrop.addEventListener('click', closeSidebar);

hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebar.classList.toggle('collapsed');
  backdrop.classList.toggle('show', sidebar.classList.contains('open'));
});

function closeSidebar() {
  if (window.innerWidth <= 900) {
    sidebar.classList.remove('open');
    backdrop.classList.remove('show');
  }
}

// Initialize sidebar state
if (window.innerWidth <= 900) sidebar.classList.add('collapsed');

// ── Search ──────────────────────────────────
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  searchClear.classList.toggle('hidden', q.length === 0);

  if (q.length === 0) {
    searchResults.classList.add('hidden');
    return;
  }

  const results = allChannels.filter(ch =>
    ch.name.toLowerCase().includes(q) ||
    ch.category.toLowerCase().includes(q) ||
    (ch.tags && ch.tags.some(t => t.toLowerCase().includes(q)))
  );

  searchResults.classList.remove('hidden');
  document.getElementById('searchResultCount').textContent = results.length;
  const grid = document.getElementById('searchGrid');
  const empty = document.getElementById('searchEmpty');

  if (results.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = results.map(ch => buildGridCard(ch)).join('');
    grid.querySelectorAll('.channel-grid-card').forEach(card => {
      card.addEventListener('click', () => openPlayer(parseInt(card.dataset.id)));
      const favBtn = card.querySelector('.gc-fav');
      if (favBtn) favBtn.addEventListener('click', e => { e.stopPropagation(); toggleFav(parseInt(card.dataset.id), favBtn); });
    });
  }
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.add('hidden');
  searchResults.classList.add('hidden');
  searchInput.focus();
});

// ── Theme Toggle ──────────────────────────────────
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  document.body.classList.toggle('dark');
  document.getElementById('themeToggle').textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
  localStorage.setItem('sv_theme', document.body.classList.contains('light') ? 'light' : 'dark');
});
if (localStorage.getItem('sv_theme') === 'light') {
  document.body.classList.replace('dark', 'light');
  document.getElementById('themeToggle').textContent = '☀️';
}

// ── Offline Detection ──────────────────────────────────
function checkOffline() {
  document.body.classList.toggle('offline', !navigator.onLine);
}
window.addEventListener('online', () => document.body.classList.remove('offline'));
window.addEventListener('offline', () => document.body.classList.add('offline'));

// ── PWA Install ──────────────────────────────────
function setupPWA() {
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBtn').classList.remove('hidden');
  });
  document.getElementById('installBtn').addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        document.getElementById('installBtn').classList.add('hidden');
      });
    }
  });
}

// ── Utilities ──────────────────────────────────
function getCatEmoji(cat) {
  const map = { News:'📰', Sports:'⚽', Movies:'🎬', Entertainment:'🎭', Kids:'🧒', Music:'🎵' };
  return map[cat] || '📺';
}

console.log('%c📺 StreamVerse Loaded!', 'color:#ff4757;font-size:1.2rem;font-weight:bold');
