/* KRIS UI — Frontend Logic
 * Globals RING_ORDER and RINGS_CONFIG are injected via inline script in index.html
 */

let ringsData = {};
let activeRing = null;
let activeFile = null;
let treeFocusIdx = -1;

// --- Init ---
async function init() {
  const res = await fetch('/api/rings');
  ringsData = await res.json();
  renderRingNav();
  // URL state
  const params = new URLSearchParams(location.search);
  const ring = params.get('ring') || 'core';
  const file = params.get('file');
  selectRing(ring);
  if (file) selectFile(file);
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
  folderKeys.forEach(folder => {
    const fid = 'folder-' + folder.replace(/[^a-zA-Z0-9]/g, '-');
    html += `<div class="folder-group">
      <div class="folder-header" onclick="toggleFolder('${fid}')">
        <span class="folder-chevron open" id="${fid}-chev">&#x25B6;</span>
        &#x1F4C1; ${folder}
        <span style="margin-left:auto;font-weight:400;font-size:10px;color:var(--text-muted)">${folders[folder].length}</span>
      </div>
      <div class="folder-children" id="${fid}">
        ${folders[folder].map(f => renderFileItem(f, 'custom')).join('')}
      </div>
    </div>`;
  });

  tree.innerHTML = html;
}

function renderFileItem(f, badge) {
  const isActive = activeFile === f.path;
  const badgeHtml = badge === 'default'
    ? '<span class="file-badge default">def</span>'
    : '<span class="file-badge custom">+</span>';
  return `<div class="file-item${isActive ? ' active' : ''}" onclick="selectFile('${f.path}')" title="${f.path}">
    <span class="file-icon">&#x1F4C4;</span>
    <span class="file-name">${f.name}</span>
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
  } else {
    children.classList.add('collapsed');
    chev.classList.remove('open');
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
      <span class="ring-badge" style="background:${ringConf.color || '#666'}">${ringConf.label || ring}</span>
      ${folder}
      <span class="sep">/</span>
      ${data.meta.name}
      ${typeBadge}
    </div>
    <div class="fade-in">${data.html}</div>
  `;

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

  // Escape: close help modal
  if (e.key === 'Escape') {
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
let currentView = 'docs'; // 'docs' or 'interactive'

function updateNavActive() {
  document.getElementById('nav-docs').classList.toggle('active', currentView === 'docs');
  document.getElementById('nav-interactive').classList.toggle('active', currentView === 'interactive');
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

  const res = await fetch('/api/interactive-docs');
  const docs = await res.json();

  if (docs.length === 0) {
    view.innerHTML = '<div class="interactive-landing"><h2>Interactive Documentation</h2><p class="il-subtitle">Visual, explorable diagrams generated from spec files.</p><div class="il-empty">No interactive documents found.<br>Add .html files to any ring\'s <code>interactive/</code> folder.</div></div>';
    return;
  }

  // Group by ring
  const byRing = {};
  docs.forEach(d => {
    if (!byRing[d.ring]) byRing[d.ring] = [];
    byRing[d.ring].push(d);
  });

  let html = '<div class="interactive-landing fade-in"><h2>Interactive Documentation</h2><p class="il-subtitle">Visual, explorable diagrams generated from spec files. Opens in a new tab.</p>';

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

  html += '</div>';
  view.innerHTML = html;
  document.getElementById('content').scrollTop = 0;
}

// Go!
init();
