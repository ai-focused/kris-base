/* KRIS Interactive Base — Shared utilities for all interactive templates
 *
 * Usage in templates:
 *   const src = KRISInteractive.getQueryParam('src');
 *   const { meta, body } = await KRISInteractive.fetchAndParse(src);
 */

const KRISInteractive = {

  // --- Query params ---

  getQueryParam(name) {
    return new URLSearchParams(location.search).get(name);
  },

  isEmbedded() {
    return this.getQueryParam('embed') === 'true';
  },

  // --- API calls ---

  async fetchFile(path) {
    const res = await fetch('/api/file?path=' + encodeURIComponent(path));
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
    return res.json();
  },

  async fetchRaw(path) {
    const res = await fetch('/api/raw-file?path=' + encodeURIComponent(path));
    if (!res.ok) throw new Error(`Failed to fetch raw file: ${res.status}`);
    return res.text();
  },

  async fetchAndParse(path) {
    const raw = await this.fetchRaw(path);
    const { meta, body } = this.parseFrontmatter(raw);
    const sections = this.parseSections(body);
    return { raw, meta, body, sections };
  },

  // --- Markdown parsing ---

  parseFrontmatter(raw) {
    const trimmed = raw.trimStart();
    if (!trimmed.startsWith('---')) {
      return { meta: {}, body: raw };
    }
    const end = trimmed.indexOf('---', 3);
    if (end === -1) {
      return { meta: {}, body: raw };
    }
    const yamlBlock = trimmed.slice(3, end).trim();
    const body = trimmed.slice(end + 3).trimStart();
    // Simple YAML key: value parser (no dependency on a YAML library)
    const meta = {};
    yamlBlock.split('\n').forEach(line => {
      const match = line.match(/^(\w[\w-]*)\s*:\s*(.+)/);
      if (match) {
        const val = match[2].trim();
        // Handle YAML lists on same line: [a, b, c]
        if (val.startsWith('[') && val.endsWith(']')) {
          meta[match[1]] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        } else {
          meta[match[1]] = val.replace(/^["']|["']$/g, '');
        }
      }
    });
    return { meta, body };
  },

  parseSections(markdown) {
    const lines = markdown.split('\n');
    const sections = [];
    let current = null;

    lines.forEach(line => {
      const h2 = line.match(/^## (.+)/);
      const h3 = line.match(/^### (.+)/);

      if (h2) {
        current = { title: h2[1].trim(), level: 2, content: '', subsections: [] };
        sections.push(current);
      } else if (h3 && current) {
        const sub = { title: h3[1].trim(), level: 3, content: '' };
        current.subsections.push(sub);
      } else if (current) {
        const target = current.subsections.length > 0
          ? current.subsections[current.subsections.length - 1]
          : current;
        target.content += line + '\n';
      }
    });

    return sections;
  },

  parseKeyValueList(content) {
    const pairs = {};
    const lines = content.split('\n');
    lines.forEach(line => {
      const m = line.match(/^[-*]\s+\*\*(.+?)\*\*:\s*(.+)/);
      if (m) {
        pairs[m[1].trim()] = m[2].trim();
      }
    });
    return pairs;
  },

  parseTable(content) {
    const lines = content.split('\n').filter(l => l.trim().startsWith('|'));
    if (lines.length < 2) return [];
    const headers = lines[0].split('|').filter(c => c.trim()).map(c => c.trim());
    // Skip separator line (line[1])
    const rows = [];
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = cells[idx] || ''; });
      rows.push(row);
    }
    return rows;
  },

  // --- UI utilities ---

  initResize(handleEl, leftEl, rightEl, options = {}) {
    const minLeft = options.minLeft || 200;
    const minRight = options.minRight || 200;
    let dragging = false;

    handleEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragging = true;
      handleEl.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const container = leftEl.parentElement;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const leftW = Math.max(minLeft, Math.min(x, rect.width - minRight));
      leftEl.style.flex = 'none';
      leftEl.style.width = leftW + 'px';
      rightEl.style.width = (rect.width - leftW - handleEl.offsetWidth) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      handleEl.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  },

  initFilters(containerEl, items, onFilter) {
    containerEl.innerHTML = '';
    items.forEach(item => {
      const chip = document.createElement('button');
      chip.className = 'filter-chip' + (item.active ? ' active' : '');
      chip.textContent = item.label;
      chip.dataset.value = item.value;
      chip.addEventListener('click', () => {
        containerEl.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        onFilter(item.value);
      });
      containerEl.appendChild(chip);
    });
  },

  initTheme() {
    const theme = this.getQueryParam('theme') || localStorage.getItem('kris-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  },

  showError(containerEl, title, message) {
    containerEl.innerHTML = `
      <div class="interactive-error">
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
    `;
  },
};

// Auto-init theme on load
KRISInteractive.initTheme();
