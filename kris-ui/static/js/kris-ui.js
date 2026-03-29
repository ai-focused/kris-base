/* KRIS UI — Frontend Logic
 * Globals RING_ORDER and RINGS_CONFIG are injected via inline script in index.html
 */

let ringsData = {};
let activeRing = null;
let activeFile = null;
let treeFocusIdx = -1;
let interactiveMeta = {}; // path -> [template_ids]
let folderStates = {}; // fid -> true (expanded) | false (collapsed); null = use default

// --- Theme ---
function initTheme() {
  const saved = localStorage.getItem('kris-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('kris-theme', next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = theme === 'dark' ? '&#x2600;' : '&#x263E;';
}
initTheme();

// --- Init ---
async function init() {
  const [ringsRes, metaRes] = await Promise.all([
    fetch('/api/rings'),
    fetch('/api/interactive-meta'),
  ]);
  ringsData = await ringsRes.json();
  const metaList = await metaRes.json();
  metaList.forEach(m => { interactiveMeta[m.path] = m.interactive; });
  renderRingNav();
  renderWelcomeDashboard();
  // URL state
  const params = new URLSearchParams(location.search);
  const ring = params.get('ring') || 'core';
  const file = params.get('file');
  selectRing(ring);
  if (file) selectFile(file);
}

// --- Welcome dashboard ---
function renderWelcomeDashboard() {
  const container = document.getElementById('welcome-rings');
  if (!container) return;

  const ringIcons = { core: '📍', inner: '🔄', middle: '📚', outer: '📦' };

  // Ring cards with budget visualization
  container.innerHTML = RING_ORDER.map(name => {
    const r = ringsData[name];
    const stats = r.stats;
    const pct = stats.budget_pct || 0;
    const budgetLabel = stats.budget_tokens ? `${Math.round(stats.total_tokens/1000)}k / ${Math.round(stats.budget_tokens/1000)}k` : `${Math.round(stats.total_tokens/1000)}k`;
    const pctLabel = stats.budget_tokens ? `${pct}%` : 'unlimited';
    let barColor = r.color;
    if (pct > 80) barColor = '#ef4444';
    else if (pct > 60) barColor = '#f59e0b';

    return `<div class="ring-card" onclick="selectRing('${name}')">
      <div class="ring-card-glow" style="background:${r.color}"></div>
      <span class="ring-card-icon">${ringIcons[name]}</span>
      <div class="ring-card-name">${r.label}</div>
      <div class="ring-card-files">${stats.file_count} file${stats.file_count !== 1 ? 's' : ''}</div>
      ${stats.budget_tokens ? `<div class="ring-card-bar"><div class="ring-card-fill" style="width:${Math.min(pct,100)}%;background:${barColor}"></div></div>` : '<div class="ring-card-bar"><div class="ring-card-fill" style="width:100%;background:var(--text-muted);opacity:0.2"></div></div>'}
      <div class="ring-card-pct">${budgetLabel} ${stats.budget_tokens ? '(' + pctLabel + ')' : ''}</div>
    </div>`;
  }).join('');

  // Load progress.md for achievements and next steps
  loadProgressData();
}

async function loadProgressData() {
  try {
    const res = await fetch('/api/file?path=inner/progress.md');
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    const raw = data.raw;

    // Parse achievements (completed items)
    const achievements = [];
    const completedMatch = raw.match(/## Completed This Week[\s\S]*?(?=\n## |\n---|\Z)/);
    if (completedMatch) {
      const lines = completedMatch[0].split('\n');
      lines.forEach(line => {
        const m = line.match(/^[-*]\s+\[x\]\s+(.+)/i) || line.match(/^\|\s*\d{4}.*?\|\s*(.+?)\s*\|/);
        if (m) achievements.push(m[1].replace(/\|/g, '').trim());
      });
    }
    // Also look in completion history tables
    if (achievements.length === 0) {
      const historyMatch = raw.match(/## Completion History[\s\S]*?(?=\n## |\n---|\Z)/);
      if (historyMatch) {
        const rows = historyMatch[0].split('\n').filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Date'));
        rows.slice(-5).forEach(row => {
          const cells = row.split('|').map(c => c.trim()).filter(c => c);
          if (cells.length >= 2) achievements.push(cells[1]);
        });
      }
    }

    // Parse next steps (incomplete items from milestones)
    const nextSteps = [];
    const lines = raw.split('\n');
    lines.forEach(line => {
      const m = line.match(/^[-*]\s+\[ \]\s+(.+)/);
      if (m) nextSteps.push(m[1]);
    });

    // Render achievements
    const achEl = document.getElementById('welcome-achievements');
    if (achEl) {
      let html = '<h3>&#x2705; Recent Achievements</h3>';
      if (achievements.length > 0) {
        html += achievements.slice(-5).map(a =>
          `<div class="welcome-item"><span class="welcome-item-icon">&#x2713;</span><span class="welcome-item-text">${a}</span></div>`
        ).join('');
      } else {
        html += '<div class="welcome-empty">No completed tasks yet</div>';
      }
      html += '<a class="welcome-link" href="#" onclick="event.preventDefault();selectRing(\'inner\');selectFile(\'inner/progress.md\')">View progress &#x2192;</a>';
      achEl.innerHTML = html;
    }

    // Render next steps
    const nextEl = document.getElementById('welcome-next-steps');
    if (nextEl) {
      let html = '<h3>&#x1F3AF; Next Steps</h3>';
      if (nextSteps.length > 0) {
        html += nextSteps.slice(0, 5).map(s =>
          `<div class="welcome-item"><span class="welcome-item-icon">&#x25CB;</span><span class="welcome-item-text">${s}</span></div>`
        ).join('');
      } else {
        html += '<div class="welcome-empty">No pending tasks</div>';
      }
      html += '<a class="welcome-link" href="#" onclick="event.preventDefault();selectRing(\'inner\');selectFile(\'inner/progress.md\')">View progress &#x2192;</a>';
      nextEl.innerHTML = html;
    }
  } catch (e) {
    // progress.md not found — show empty state
    const achEl = document.getElementById('welcome-achievements');
    if (achEl) achEl.innerHTML = '<h3>&#x2705; Recent Achievements</h3><div class="welcome-empty">No progress.md found</div>';
    const nextEl = document.getElementById('welcome-next-steps');
    if (nextEl) nextEl.innerHTML = '<h3>&#x1F3AF; Next Steps</h3><div class="welcome-empty">No progress.md found</div>';
  }
}

// --- Ring navigation ---
function renderRingNav() {
  const nav = document.getElementById('ring-nav');
  nav.innerHTML = RING_ORDER.map(name => {
    const r = ringsData[name];
    const count = r.files.length;
    return `<button class="ring-btn${activeRing === name ? ' active' : ''}" data-ring="${name}" onclick="selectRing('${name}')">
      <span class="ring-dot" style="background:${r.color};box-shadow:0 0 6px ${r.color}"></span>
      ${r.label}
      <span class="ring-stats">${count} file${count!==1?'s':''}</span>
    </button>`;
  }).join('');
}

function selectRing(name) {
  activeRing = name;
  renderRingNav();
  renderFileTree(name);
  updateURL();
}

function getVisibleFileItems() {
  return Array.from(document.querySelectorAll('#file-tree .file-item')).filter(el => {
    // Skip items inside collapsed folders
    const parent = el.closest('.folder-children');
    return !parent || !parent.classList.contains('collapsed');
  });
}

function updateTreeFocus() {
  const items = getVisibleFileItems();
  document.querySelectorAll('#file-tree .file-item.focused').forEach(el => el.classList.remove('focused'));
  if (treeFocusIdx >= 0 && treeFocusIdx < items.length) {
    items[treeFocusIdx].classList.add('focused');
    items[treeFocusIdx].scrollIntoView({ block: 'nearest' });
  }
}

function findFileIdxInTree(path) {
  if (!path) return -1;
  const items = getVisibleFileItems();
  return items.findIndex(el => el.getAttribute('title') === path);
}

function renderFileTree(ring) {
  const tree = document.getElementById('file-tree');
  const label = document.getElementById('tree-label');
  const r = ringsData[ring];
  label.textContent = r.label + ' Ring Files';
  if (r.files.length === 0) {
    tree.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:12px;font-style:italic">No files in this ring yet</div>';
    return;
  }

  // Separate default ring files vs custom/added files, and group by folder
  const defaults = r.files.filter(f => f.is_default);
  const custom = r.files.filter(f => !f.is_default);

  // Group custom files by folder
  const folders = {};
  custom.forEach(f => {
    const key = f.folder || '';
    if (!folders[key]) folders[key] = [];
    folders[key].push(f);
  });

  let html = '';

  // Render default ring files
  if (defaults.length > 0) {
    html += '<div class="tree-section-label">Ring Defaults</div>';
    html += defaults.map(f => renderFileItem(f, 'default')).join('');
  }

  // Render custom root-level files (folder === '')
  const customRoot = folders[''] || [];
  const folderKeys = Object.keys(folders).filter(k => k !== '').sort();

  if (customRoot.length > 0 || folderKeys.length > 0) {
    html += '<div class="tree-section-label">Custom</div>';
    html += customRoot.map(f => renderFileItem(f, 'custom')).join('');
  }

  // Render folder groups
  const folderLabels = {
    '.claude/commands': '&#x2318; Commands (Claude)',
    '.kris/tasks': '&#x2318; Tasks (Multi-Agent)',
  };
  const collapsedByDefault = new Set(['.claude/commands', '.kris/tasks']);
  folderKeys.forEach(folder => {
    const fid = 'folder-' + folder.replace(/[^a-zA-Z0-9]/g, '-');
    const label = folderLabels[folder] || `&#x1F4C1; ${folder}`;
    // Use persisted state if available, otherwise use default
    const isCollapsed = fid in folderStates ? !folderStates[fid] : collapsedByDefault.has(folder);
    html += `<div class="folder-group">
      <div class="folder-header" onclick="toggleFolder('${fid}')">
        <span class="folder-chevron${isCollapsed ? '' : ' open'}" id="${fid}-chev">&#x25B6;</span>
        ${label}
        <span style="margin-left:auto;font-weight:400;font-size:10px;color:var(--text-muted)">${folders[folder].length}</span>
      </div>
      <div class="folder-children${isCollapsed ? ' collapsed' : ''}" id="${fid}">
        ${folders[folder].map(f => renderFileItem(f, 'custom')).join('')}
      </div>
    </div>`;
  });

  tree.innerHTML = html;
}

function renderFileItem(f, badge) {
  // Placeholder items (empty directories)
  if (f.placeholder) {
    return `<div class="file-item" style="opacity:0.4;cursor:default;font-style:italic">
      <span class="file-icon" style="opacity:0.3">&#x2205;</span>
      <span class="file-name">${f.name}</span>
    </div>`;
  }
  const isActive = activeFile === f.path;
  const isRootFile = f.name === 'CLAUDE.md' || f.name === 'AGENTS.md';
  let badgeHtml;
  if (isRootFile) {
    badgeHtml = '<span class="file-badge root" title="Project root file">root</span>';
  } else if (badge === 'default') {
    badgeHtml = '<span class="file-badge default">def</span>';
  } else {
    badgeHtml = '<span class="file-badge custom">+</span>';
  }
  const interactiveBadge = interactiveMeta[f.path]
    ? '<span class="file-badge interactive" title="Has interactive view">&#x26A1;</span>'
    : '';
  return `<div class="file-item${isActive ? ' active' : ''}" onclick="selectFile('${f.path}')" title="${f.path}">
    <span class="file-icon">&#x1F4C4;</span>
    <span class="file-name">${f.name}</span>
    ${interactiveBadge}
    ${badgeHtml}
    <span class="file-tokens">${f.tokens}t</span>
  </div>`;
}

function toggleFolder(fid) {
  const children = document.getElementById(fid);
  const chev = document.getElementById(fid + '-chev');
  if (children.classList.contains('collapsed')) {
    children.classList.remove('collapsed');
    chev.classList.add('open');
    folderStates[fid] = true;
  } else {
    children.classList.add('collapsed');
    chev.classList.remove('open');
    folderStates[fid] = false;
  }
}

// --- File viewer ---
async function selectFile(path, searchQuery) {
  activeFile = path;
  treeFocusIdx = -1;
  // Re-render tree to update active state
  if (activeRing) renderFileTree(activeRing);
  const res = await fetch('/api/file?path=' + encodeURIComponent(path));
  if (!res.ok) return;
  const data = await res.json();

  // Content
  const view = document.getElementById('file-view');
  const welcome = document.getElementById('welcome');
  welcome.style.display = 'none';
  view.style.display = 'block';

  const ring = data.meta.ring;
  const ringConf = RINGS_CONFIG[ring] || {};
  const folder = data.meta.folder ? `<span class="sep">/</span>${data.meta.folder}` : '';
  const typeBadge = data.meta.is_default
    ? '<span class="file-badge default" style="margin-left:8px">default</span>'
    : '<span class="file-badge custom" style="margin-left:8px">custom</span>';
  view.innerHTML = `
    <div class="breadcrumb fade-in">
      <span class="breadcrumb-project" title="${MEMORY_BANK_PATH}">${PROJECT_NAME}</span>
      <span class="sep">/</span>
      <span class="ring-badge" style="background:${ringConf.color || '#666'}">${ringConf.label || ring}</span>
      ${folder}
      <span class="sep">/</span>
      ${data.meta.name}
      ${typeBadge}
    </div>
    <div class="md-content fade-in">${data.html}</div>
  `;

  // Interactive toggle bar
  if (data.interactive && data.interactive.length > 0) {
    const breadcrumb = view.querySelector('.breadcrumb');
    const mdContent = view.querySelector('.md-content');
    let activeTemplateId = data.interactive[0];

    const toggleBar = document.createElement('div');
    toggleBar.className = 'interactive-toggle-bar fade-in';

    // Build template buttons — one per template, or just "Interactive" if single
    let templateBtns = '';
    if (data.interactive.length === 1) {
      templateBtns = `<button class="toggle-btn" data-mode="interactive" data-template="${data.interactive[0]}">Interactive</button>`;
    } else {
      templateBtns = data.interactive.map(tid => {
        const label = tid.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `<button class="toggle-btn" data-mode="interactive" data-template="${tid}">${label}</button>`;
      }).join('');
    }

    toggleBar.innerHTML = `
      <button class="toggle-btn active" data-mode="source">Source</button>
      ${templateBtns}
      <a class="toggle-newtab" href="/interactive/render/${activeTemplateId}?src=${encodeURIComponent(path)}"
         target="_blank" rel="noopener" title="Open in new tab">&#x2197;</a>
    `;
    breadcrumb.after(toggleBar);

    function switchToTemplate(tid) {
      activeTemplateId = tid;
      mdContent.style.display = 'none';
      // Remove any existing iframe
      const oldIframe = view.querySelector('.interactive-iframe');
      if (oldIframe) oldIframe.remove();
      // Create new iframe for this template
      const iframe = document.createElement('iframe');
      iframe.className = 'interactive-iframe';
      iframe.src = `/interactive/render/${tid}?src=${encodeURIComponent(path)}&embed=true`;
      view.appendChild(iframe);
      // Update new-tab link
      const ntLink = toggleBar.querySelector('.toggle-newtab');
      if (ntLink) ntLink.href = `/interactive/render/${tid}?src=${encodeURIComponent(path)}`;
    }

    toggleBar.addEventListener('click', function(e) {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      const mode = btn.dataset.mode;
      toggleBar.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (mode === 'interactive') {
        switchToTemplate(btn.dataset.template);
      } else {
        mdContent.style.display = '';
        const iframe = view.querySelector('.interactive-iframe');
        if (iframe) iframe.remove();
      }
    });
  }

  // Metadata
  renderMeta(data);
  updateURL();

  // Focus content panel
  const contentEl = document.getElementById('content');
  contentEl.scrollTop = 0;

  // If opened from search, highlight all matches and show jump button
  hideJumpBtn();
  if (searchQuery) {
    searchHits = highlightAllHits(view, searchQuery);
    if (searchHits.length > 0) {
      showJumpBtn();
      // Defer scroll to next frame so layout is settled
      requestAnimationFrame(() => scrollToHit());
    }
  }
  contentEl.focus();
}

// Walk DOM text nodes to find and highlight ALL occurrences of query
function highlightAllHits(root, query) {
  const lowerQ = query.toLowerCase();
  const marks = [];
  // Collect all text nodes first to avoid live-DOM mutation issues
  const textNodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach(node => {
    const text = node.textContent;
    const lowerText = text.toLowerCase();
    let startIdx = 0;
    const fragments = [];
    let found = false;

    while (true) {
      const idx = lowerText.indexOf(lowerQ, startIdx);
      if (idx === -1) break;
      found = true;
      // Text before match
      if (idx > startIdx) fragments.push(document.createTextNode(text.slice(startIdx, idx)));
      // The match
      const mark = document.createElement('mark');
      mark.className = 'search-highlight';
      mark.textContent = text.slice(idx, idx + query.length);
      fragments.push(mark);
      marks.push(mark);
      startIdx = idx + query.length;
    }

    if (!found) return;
    // Remaining text after last match
    if (startIdx < text.length) fragments.push(document.createTextNode(text.slice(startIdx)));
    // Replace original node with fragments
    const parent = node.parentNode;
    fragments.forEach(f => parent.insertBefore(f, node));
    parent.removeChild(node);
  });

  return marks;
}

// --- Jump-to-match button ---
let searchHits = [];
let currentHitIdx = -1;

function showJumpBtn(count) {
  currentHitIdx = 0;
  updateHitHighlight();
  updateJumpLabel();
  document.getElementById('jump-btn').classList.add('visible');
}

function hideJumpBtn() {
  searchHits = [];
  currentHitIdx = -1;
  document.getElementById('jump-btn').classList.remove('visible');
}

function updateHitHighlight() {
  searchHits.forEach((el, i) => {
    el.classList.toggle('active', i === currentHitIdx);
  });
}

function updateJumpLabel() {
  const btn = document.getElementById('jump-btn');
  btn.innerHTML = `&#x2193; Match (${currentHitIdx + 1}/${searchHits.length})`;
}

function scrollToHit() {
  if (searchHits.length === 0) return;
  const hit = searchHits[currentHitIdx];
  hit.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function nextHit() {
  if (searchHits.length === 0) return;
  currentHitIdx = (currentHitIdx + 1) % searchHits.length;
  updateHitHighlight();
  updateJumpLabel();
  scrollToHit();
}

function renderMeta(data) {
  const empty = document.getElementById('meta-empty');
  const content = document.getElementById('meta-content');
  empty.style.display = 'none';
  content.style.display = 'block';

  const m = data.meta;
  const ring = m.ring;
  const ringConf = RINGS_CONFIG[ring] || {};
  const stats = ringsData[ring] ? ringsData[ring].stats : null;

  const typeLabel = m.is_default ? 'Ring Default' : 'Custom File';
  const folderLabel = m.folder ? m.folder + '/' : 'Ring root';
  let html = `
    <div class="meta-section">
      <div class="meta-label">File Info</div>
      <div class="meta-row"><span class="label">Type</span><span class="value">${typeLabel}</span></div>
      <div class="meta-row"><span class="label">Location</span><span class="value">${folderLabel}</span></div>
      <div class="meta-row"><span class="label">Words</span><span class="value">${m.words.toLocaleString()}</span></div>
      <div class="meta-row"><span class="label">Tokens (est)</span><span class="value">${m.tokens.toLocaleString()}</span></div>
      <div class="meta-row"><span class="label">Size</span><span class="value">${formatBytes(m.size_bytes)}</span></div>
      <div class="meta-row"><span class="label">Modified</span><span class="value">${m.modified_relative}</span></div>
    </div>
  `;

  if (stats) {
    const budget = stats.budget_tokens;
    const pct = stats.budget_pct;
    html += `
      <div class="meta-section">
        <div class="meta-label">${ringConf.label} Ring Budget</div>
        <div class="meta-row"><span class="label">Used</span><span class="value">${stats.total_tokens.toLocaleString()} tokens</span></div>
        <div class="meta-row"><span class="label">Budget</span><span class="value">${budget ? budget.toLocaleString() : 'Unlimited'}</span></div>
        ${budget ? `<div class="budget-bar"><div class="budget-fill" style="width:${Math.min(pct,100)}%;background:${ringConf.color}"></div></div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;text-align:right">${pct}% used</div>` : ''}
      </div>
    `;
  }

  if (data.frontmatter && data.frontmatter.length > 0) {
    html += `<div class="meta-section"><div class="meta-label">Frontmatter</div><div class="meta-frontmatter">`;
    data.frontmatter.forEach(fm => {
      html += `<div class="fm-row"><span class="fm-key">${fm.key}</span><span class="fm-val">${fm.value}</span></div>`;
    });
    html += `</div></div>`;
  }

  content.innerHTML = html;
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  return (b / 1024).toFixed(1) + ' KB';
}

// --- Search ---
let searchTimeout = null;
let searchSelectedIdx = -1;
let searchResultsData = [];
let lastSearchQuery = '';

document.getElementById('search-input').addEventListener('input', function(e) {
  clearTimeout(searchTimeout);
  const q = e.target.value.trim();
  if (q.length < 2) {
    closeSearch();
    return;
  }
  lastSearchQuery = q;
  searchTimeout = setTimeout(() => doSearch(q), 300);
});

document.getElementById('search-input').addEventListener('keydown', function(e) {
  const box = document.getElementById('search-results');
  const isOpen = box.classList.contains('active');

  if (e.key === 'ArrowDown' && isOpen) {
    e.preventDefault();
    searchSelectedIdx = Math.min(searchSelectedIdx + 1, searchResultsData.length - 1);
    highlightSearchResult();
    return;
  }
  if (e.key === 'ArrowUp' && isOpen) {
    e.preventDefault();
    searchSelectedIdx = Math.max(searchSelectedIdx - 1, 0);
    highlightSearchResult();
    return;
  }
  if (e.key === 'Enter' && isOpen && searchSelectedIdx >= 0) {
    e.preventDefault();
    const r = searchResultsData[searchSelectedIdx];
    if (r) jumpToFile(r.ring, r.path);
    return;
  }
  if (e.key === 'Escape') {
    e.stopPropagation();
    this.value = '';
    closeSearch();
    this.blur();
  }
});

// Close search on outside click
document.addEventListener('click', function(e) {
  if (!document.getElementById('search-box').contains(e.target)) {
    closeSearch();
  }
});

function closeSearch() {
  document.getElementById('search-results').classList.remove('active');
  searchSelectedIdx = -1;
  searchResultsData = [];
}

function highlightSearchResult() {
  const items = document.querySelectorAll('.search-result');
  items.forEach((el, i) => {
    el.classList.toggle('selected', i === searchSelectedIdx);
  });
  // Scroll selected into view
  if (items[searchSelectedIdx]) {
    items[searchSelectedIdx].scrollIntoView({ block: 'nearest' });
  }
}

async function doSearch(q) {
  const res = await fetch('/api/search?q=' + encodeURIComponent(q));
  const results = await res.json();
  searchResultsData = results;
  searchSelectedIdx = -1;
  const box = document.getElementById('search-results');
  if (results.length === 0) {
    box.innerHTML = '<div style="padding:14px;color:var(--text-muted);font-size:13px;text-align:center">No results found</div>';
    box.classList.add('active');
    return;
  }
  box.innerHTML = results.map((r, i) => {
    const ringConf = RINGS_CONFIG[r.ring] || {};
    return `<div class="search-result" data-idx="${i}" onclick="jumpToFile('${r.ring}','${r.path}')" onmouseenter="searchSelectedIdx=${i};highlightSearchResult()">
      <div class="sr-header">
        <span class="sr-ring" style="background:${ringConf.color || '#666'}"></span>
        <span class="sr-name">${r.name}</span>
        <span class="sr-line">L${r.line}</span>
      </div>
      <div class="sr-excerpt">${r.excerpt}</div>
    </div>`;
  }).join('');
  box.classList.add('active');
}

function jumpToFile(ring, path) {
  const query = lastSearchQuery;
  closeSearch();
  document.getElementById('search-input').value = '';
  selectRing(ring);
  selectFile(path, query);
}

// --- URL state ---
function updateURL() {
  const params = new URLSearchParams();
  if (activeRing) params.set('ring', activeRing);
  if (activeFile) params.set('file', activeFile);
  history.replaceState(null, '', '?' + params.toString());
}

// --- Caps Lock detection on keyup ---
document.addEventListener('keyup', function(e) {
  updateCapsLockUI(e.getModifierState('CapsLock'));
});

// --- Caps Lock indicator ---
function updateCapsLockUI(capsOn) {
  const badge = document.getElementById('caps-badge');
  if (badge) badge.style.display = capsOn ? 'inline-flex' : 'none';
  document.querySelectorAll('kbd[data-letter]').forEach(kbd => {
    const letter = kbd.getAttribute('data-letter');
    kbd.textContent = capsOn ? letter.toUpperCase() : letter;
  });
}

// --- Keyboard shortcuts ---
document.addEventListener('keydown', function(e) {
  updateCapsLockUI(e.getModifierState('CapsLock'));
  // Skip shortcuts when typing in an input
  const tag = document.activeElement.tagName;
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable;

  // Cmd/Ctrl+K always focuses search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('search-input').focus();
    return;
  }

  // All remaining shortcuts only fire outside inputs
  if (inInput) return;

  // Ignore when Cmd/Ctrl/Alt are held so system combos (copy, paste, etc.) work
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  // Enter: cycle through search matches when content panel is focused
  if (e.key === 'Enter' && searchHits.length > 0 && document.activeElement === document.getElementById('content')) {
    e.preventDefault();
    nextHit();
    return;
  }

  // "/" focuses search
  if (e.key === '/') {
    e.preventDefault();
    document.getElementById('search-input').focus();
    return;
  }

  // Arrow keys: navigate file tree when a ring is selected
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && activeRing) {
    const items = getVisibleFileItems();
    if (items.length === 0) return;
    e.preventDefault();
    if (e.key === 'ArrowDown') {
      treeFocusIdx = Math.min(treeFocusIdx + 1, items.length - 1);
    } else {
      treeFocusIdx = Math.max(treeFocusIdx - 1, 0);
    }
    updateTreeFocus();
    return;
  }

  // Enter: open focused file in tree
  if (e.key === 'Enter' && treeFocusIdx >= 0) {
    const items = getVisibleFileItems();
    if (items[treeFocusIdx]) {
      e.preventDefault();
      items[treeFocusIdx].click();
      return;
    }
  }

  // 1-4: quick ring navigation
  const ringKeys = { '1': 'core', '2': 'inner', '3': 'middle', '4': 'outer' };
  if (ringKeys[e.key]) {
    e.preventDefault();
    hideJumpBtn();
    selectRing(ringKeys[e.key]);
    const idx = findFileIdxInTree(activeFile);
    treeFocusIdx = idx >= 0 ? idx : 0;
    updateTreeFocus();
    return;
  }

  const key = e.key.toLowerCase();

  // "a": jump to inner/activeContext.md
  if (key === 'a') {
    e.preventDefault();
    hideJumpBtn();
    selectRing('inner');
    selectFile('inner/activeContext.md');
    return;
  }

  // "p": jump to inner/progress.md
  if (key === 'p') {
    e.preventDefault();
    hideJumpBtn();
    selectRing('inner');
    selectFile('inner/progress.md');
    return;
  }

  // "h": go home (dashboard)
  if (key === 'h') {
    e.preventDefault();
    hideJumpBtn();
    showHome();
    return;
  }

  // "c": jump to core/CLAUDE.md
  if (key === 'c') {
    e.preventDefault();
    hideJumpBtn();
    selectRing('core');
    selectFile('core/CLAUDE.md');
    return;
  }

  // "?" opens help
  if (e.key === '?') {
    e.preventDefault();
    toggleHelp();
    return;
  }

  // Escape: dismiss search matches first, then close help modal
  if (e.key === 'Escape') {
    if (searchHits.length > 0) {
      e.preventDefault();
      hideJumpBtn();
      return;
    }
    const modal = document.getElementById('help-modal');
    if (modal.classList.contains('active')) {
      toggleHelp();
    }
  }
});

// --- Help modal ---
function toggleHelp() {
  document.getElementById('help-modal').classList.toggle('active');
}

// --- Internal link navigation ---
// Intercept clicks on links inside rendered markdown to navigate within KRIS UI
document.getElementById('content').addEventListener('click', function(e) {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href) return;

  // Allow external links and interactive links to open normally (new tab)
  if (href.startsWith('http://') || href.startsWith('https://')) return;
  if (href.startsWith('/interactive/')) {
    // Force open in new tab for interactive docs
    if (!link.hasAttribute('target')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
    }
    return;
  }

  e.preventDefault();

  // Resolve the relative path against the current file's directory
  const currentDir = activeFile ? activeFile.replace(/[^/]*$/, '') : '';

  // Ring directory links (e.g. "core/", "../inner/")
  const ringDirMatch = href.replace(/^(\.\.\/)+/, '').match(/^(core|inner|middle|outer)\/?$/);
  if (ringDirMatch) {
    selectRing(ringDirMatch[1]);
    return;
  }

  // .md file links — resolve relative path
  if (href.endsWith('.md') || href.includes('.md#')) {
    const mdPath = href.split('#')[0];

    // Build absolute path from current directory
    const parts = (currentDir + mdPath).split('/');
    const resolved = [];
    for (const p of parts) {
      if (p === '..') resolved.pop();
      else if (p && p !== '.') resolved.push(p);
    }
    let resolvedPath = resolved.join('/');

    // Determine the ring from the resolved path
    const ringName = resolved[0];
    if (RING_ORDER.includes(ringName)) {
      selectRing(ringName);
      selectFile(resolvedPath);
    } else {
      // Might be a relative link within the same directory (e.g. "security-auth-architecture.md")
      // Try prepending current directory
      const fallbackPath = currentDir + mdPath;
      const fallbackParts = fallbackPath.split('/');
      const fallbackResolved = [];
      for (const p of fallbackParts) {
        if (p === '..') fallbackResolved.pop();
        else if (p && p !== '.') fallbackResolved.push(p);
      }
      const fallbackFinal = fallbackResolved.join('/');
      const fallbackRing = fallbackResolved[0];
      if (RING_ORDER.includes(fallbackRing)) {
        selectRing(fallbackRing);
        selectFile(fallbackFinal);
      }
    }
    return;
  }
});

// --- Interactive docs listing (in-content) ---
let currentView = 'home'; // 'home' or 'docs' or 'interactive'

function updateNavActive() {
  const navHome = document.getElementById('nav-home');
  if (navHome) navHome.classList.toggle('active', currentView === 'home');
  document.getElementById('nav-docs').classList.toggle('active', currentView === 'docs');
  document.getElementById('nav-interactive').classList.toggle('active', currentView === 'interactive');
}

async function showHome() {
  currentView = 'home';
  updateNavActive();
  // Restore sidebar + meta panel
  document.getElementById('sidebar').style.display = '';
  document.getElementById('meta-panel').style.display = '';
  document.getElementById('app').style.gridTemplateColumns = '260px 1fr 240px';
  // Show welcome, hide file view
  const view = document.getElementById('file-view');
  const welcome = document.getElementById('welcome');
  view.style.display = 'none';
  welcome.style.display = '';
  // Refresh ring data live
  const res = await fetch('/api/rings');
  ringsData = await res.json();
  renderRingNav();
  renderWelcomeDashboard();
  // Reset meta panel
  document.getElementById('meta-empty').style.display = '';
  document.getElementById('meta-content').style.display = 'none';
  // Update URL
  history.replaceState(null, '', '?');
}

function showDocs() {
  currentView = 'docs';
  updateNavActive();
  // Restore sidebar + meta panel visibility
  document.getElementById('sidebar').style.display = '';
  document.getElementById('meta-panel').style.display = '';
  // Show welcome or last file
  const view = document.getElementById('file-view');
  const welcome = document.getElementById('welcome');
  if (activeFile) {
    selectFile(activeFile);
  } else {
    view.style.display = 'none';
    welcome.style.display = '';
  }
  // Restore grid
  document.getElementById('app').style.gridTemplateColumns = '260px 1fr 240px';
}

async function showInteractiveDocs() {
  currentView = 'interactive';
  updateNavActive();
  // Expand content to full width
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('meta-panel').style.display = 'none';
  document.getElementById('app').style.gridTemplateColumns = '1fr';

  const view = document.getElementById('file-view');
  const welcome = document.getElementById('welcome');
  welcome.style.display = 'none';
  view.style.display = 'block';
  view.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Loading...</div>';

  const [htmlRes, metaRes, templatesRes] = await Promise.all([
    fetch('/api/interactive-docs'),
    fetch('/api/interactive-meta'),
    fetch('/api/templates'),
  ]);
  const htmlDocs = await htmlRes.json();
  const taggedDocs = await metaRes.json();
  const templates = await templatesRes.json();

  // Build template lookup
  const templateMap = {};
  templates.forEach(t => { templateMap[t.id] = t; });

  if (htmlDocs.length === 0 && taggedDocs.length === 0) {
    view.innerHTML = '<div class="interactive-landing"><h2>Interactive Documentation</h2><p class="il-subtitle">Visual, explorable diagrams and interactive views.</p><div class="il-empty">No interactive documents found.<br>Add <code>interactive: template-name</code> frontmatter to a markdown file, or add .html files to a ring\'s <code>interactive/</code> folder.</div></div>';
    return;
  }

  let html = '<div class="interactive-landing fade-in"><h2>Interactive Documentation</h2><p class="il-subtitle">Visual, explorable diagrams and interactive views.</p>';

  // --- Template-tagged docs (grouped by template type) ---
  if (taggedDocs.length > 0) {
    const byTemplate = {};
    taggedDocs.forEach(d => {
      d.interactive.forEach(tid => {
        if (!byTemplate[tid]) byTemplate[tid] = [];
        byTemplate[tid].push(d);
      });
    });

    Object.keys(byTemplate).forEach(tid => {
      const tmpl = templateMap[tid] || { name: tid.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), description: '' };
      html += `<div class="il-section-label">${tmpl.name}</div>`;
      if (tmpl.description) html += `<p class="il-section-desc">${tmpl.description}</p>`;
      byTemplate[tid].forEach(d => {
        const rc = RINGS_CONFIG[d.ring] || {};
        html += `<a class="il-card" href="/interactive/render/${tid}?src=${encodeURIComponent(d.path)}" target="_blank" rel="noopener">
          <div class="il-card-title">${d.title}</div>
          <div class="il-card-meta">
            <span class="interactive-ring-dot" style="background:${rc.color}"></span>
            <span>${rc.label} Ring</span>
            <span>Updated ${d.modified}</span>
          </div>
          <div class="il-card-open">Open interactive view &#x2197;</div>
        </a>`;
      });
    });
  }

  // --- Standalone HTML docs (grouped by ring) ---
  if (htmlDocs.length > 0) {
    html += '<div class="il-section-label">Standalone Interactive Pages</div>';
    const byRing = {};
    htmlDocs.forEach(d => {
      if (!byRing[d.ring]) byRing[d.ring] = [];
      byRing[d.ring].push(d);
    });

    RING_ORDER.forEach(ring => {
      const items = byRing[ring];
      if (!items) return;
      const rc = RINGS_CONFIG[ring] || {};
      html += `<div class="interactive-ring-group">`;
      html += `<div class="interactive-ring-label"><span class="interactive-ring-dot" style="background:${rc.color}"></span>${rc.label} Ring</div>`;
      items.forEach(d => {
        html += `<a class="il-card" href="${d.url}" target="_blank" rel="noopener">
          <div class="il-card-title">${d.title}</div>
          <div class="il-card-meta"><span>Updated ${d.modified}</span><span>${d.size_kb} KB</span></div>
          <div class="il-card-open">Open in new tab &#x2197;</div>
        </a>`;
      });
      html += '</div>';
    });
  }

  html += '</div>';
  view.innerHTML = html;
  document.getElementById('content').scrollTop = 0;
}

// Go!
init();
