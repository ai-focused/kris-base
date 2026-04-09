/* WirePulse — Circuit coordination, task management, particle presence */

let wpConfig = null;
let wpCircuits = [];
let wpTasks = [];
let wpParticles = [];
let wpInvites = [];
let wpSelectedTask = null;
let wpSSE = null;
let wpBadgeCount = 0;
let wpTab = 'tasks';
let wpConnected = true;
let wpMenuOpen = false;
let wpStatusFilter = 'all';
let wpDropdownOpen = false;

const STATUS_COLORS = {
  'open':'#6b7280','claimed':'#4A90D9','in-progress':'#f59e0b',
  'blocked':'#ef4444','needs-review':'#a855f7','done':'#22c55e',
};
const VALID_TRANSITIONS = {
  'open':['claimed'],'claimed':['in-progress'],
  'in-progress':['done','blocked','needs-review'],
  'blocked':['in-progress'],'needs-review':['in-progress','done'],'done':[],
};

// ─── Init ────────────────────────────────────────────────────────────────────
async function checkSyncAvailable() {
  try {
    const res = await fetch('/api/wp/config');
    const data = await res.json();
    const nav = document.getElementById('nav-sync');
    if (nav) nav.style.display = '';
    if (data.available) { wpConfig = data; wpCircuits = data.circuits || []; }
  } catch(e) {
    const nav = document.getElementById('nav-sync');
    if (nav) nav.style.display = '';
  }
}

// ─── SSE ─────────────────────────────────────────────────────────────────────
function wpConnectSSE() {
  if (wpSSE) wpSSE.close();
  wpSSE = new EventSource('/api/wp/events');
  wpSSE.addEventListener('task.created', () => { wpNotify('New task created'); if (currentView==='sync') wpRefreshAndRender(); });
  wpSSE.addEventListener('task.status_changed', () => { if (currentView==='sync') wpRefreshAndRender(); });
  wpSSE.addEventListener('message.posted', (e) => { const d=JSON.parse(e.data); if (wpSelectedTask===d.payload.task_id) wpRenderTaskDetail(wpSelectedTask); else wpNotify('New message'); });
  wpSSE.addEventListener('task.assigned', () => { if (currentView==='sync') wpRefreshAndRender(); });
  wpSSE.onerror = () => { setTimeout(() => { if (wpConfig && wpConnected) wpConnectSSE(); }, 5000); };
}

async function wpRefreshAndRender() {
  await Promise.all([wpRefreshTasks(), wpRefreshParticles()]);
  wpRenderContent();
}

function wpNotify(text) {
  if (currentView !== 'sync') {
    wpBadgeCount++;
    wpUpdateBadge();
  }
  const t = document.createElement('div');
  t.className = 'wp-toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

function wpUpdateBadge() {
  const badge = document.getElementById('sync-badge');
  const nav = document.getElementById('nav-sync');
  if (badge) { badge.style.display = wpBadgeCount > 0 ? '' : 'none'; badge.textContent = wpBadgeCount > 9 ? '9+' : wpBadgeCount; }
  if (nav) nav.classList.toggle('wp-glow', wpBadgeCount > 0);
}

// ─── Show WirePulse ──────────────────────────────────────────────────────────
async function showSync() {
  currentView = 'sync';
  updateNavActive();
  wpBadgeCount = 0;
  wpUpdateBadge();

  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('meta-panel').style.display = 'none';
  document.getElementById('app').style.gridTemplateColumns = '1fr';

  const welcome = document.getElementById('welcome');
  const fv = document.getElementById('file-view');
  welcome.style.display = 'none';
  fv.style.display = 'block';
  fv.innerHTML = '<div class="wp-container" id="wp-container"><div class="wp-loading">Loading WirePulse...</div></div>';

  if (!wpConfig) { wpRenderJoinForm(); return; }
  if (wpConnected && (!wpSSE || wpSSE.readyState === EventSource.CLOSED)) wpConnectSSE();
  await Promise.all([wpRefreshTasks(), wpRefreshParticles(), wpRefreshInvites()]);
  wpRenderPanel();
}

async function wpRefreshTasks() { try { const r=await fetch('/api/wp/tasks'); if(r.ok) wpTasks=await r.json(); } catch(e){} }
async function wpRefreshParticles() { try { const r=await fetch('/api/wp/presence'); if(r.ok) wpParticles=await r.json(); } catch(e){} }
async function wpRefreshInvites() { try { const r=await fetch('/api/wp/invites'); if(r.ok) wpInvites=await r.json(); } catch(e){} }

// ─── Render Panel ────────────────────────────────────────────────────────────
function wpRenderPanel() {
  const c = document.getElementById('wp-container');
  if (!c) return;
  c.innerHTML = `<div class="wp-sidebar" id="wp-sidebar">${wpRenderSidebar()}</div><div class="wp-main" id="wp-main">${wpRenderMain()}</div>`;
  if (wpTab === 'tasks' && wpSelectedTask) wpRenderTaskDetail(wpSelectedTask);
  document.addEventListener('click', wpCloseMenuOutside);
}

function wpRenderContent() {
  const m = document.getElementById('wp-main');
  if (m) m.innerHTML = wpRenderMain();
  if (wpTab === 'tasks' && wpSelectedTask) wpRenderTaskDetail(wpSelectedTask);
  const s = document.getElementById('wp-sidebar');
  if (s) s.innerHTML = wpRenderSidebar();
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function wpRenderSidebar() {
  // Circuit selector
  let circuitHtml;
  if (wpCircuits.length > 1) {
    const active = wpCircuits.find(c => c.active) || wpCircuits[0];
    const items = wpCircuits.map(c =>
      `<div class="wp-dropdown-item${c.active ? ' active' : ''}" onclick="wpSwitchCircuit(${c.index})">${esc(c.name)}</div>`
    ).join('');
    circuitHtml = `<div class="wp-dropdown" onclick="event.stopPropagation();wpDropdownOpen=!wpDropdownOpen;wpRenderContent()">
      <span class="wp-dropdown-value">${esc(active.name)}</span><span class="wp-dropdown-arrow">▾</span>
      ${wpDropdownOpen ? `<div class="wp-dropdown-menu">${items}</div>` : ''}
    </div>`;
  } else if (wpCircuits.length === 1) {
    circuitHtml = `<span class="wp-circuit-label">${esc(wpCircuits[0].name)}</span>`;
  } else {
    circuitHtml = '<span class="wp-circuit-label">No circuit</span>';
  }

  return `
    <div class="wp-sidebar-header">
      <div class="wp-sidebar-title">
        <div class="wp-sidebar-title-left"><span class="wp-conn-dot ${wpConnected ? 'on' : 'off'}"></span>${circuitHtml}</div>
        <div style="position:relative">
          <button class="wp-menu-btn" onclick="event.stopPropagation();wpMenuOpen=!wpMenuOpen;wpRenderContent()">⋯</button>
          ${wpMenuOpen ? wpRenderMenu() : ''}
        </div>
      </div>
    </div>
    <div class="wp-nav">
      <button class="wp-nav-btn${wpTab==='tasks'?' active':''}" onclick="wpSwitchTab('tasks')">
        <span class="wp-nav-icon">☑</span>Tasks${wpTasks.length?`<span class="wp-nav-count">${wpTasks.length}</span>`:''}
      </button>
      <button class="wp-nav-btn${wpTab==='particles'?' active':''}" onclick="wpSwitchTab('particles')">
        <span class="wp-nav-icon">⚛</span>Particles<span class="wp-nav-count">${wpParticles.length}</span>
      </button>
    </div>
    <div class="wp-sidebar-particles">
      <div class="wp-sidebar-particles-title">Particles</div>
      ${wpRenderParticleList()}
    </div>
  `;
}

function wpRenderParticleList() {
  return wpParticles.map(p => {
    const online = p.last_seen_at && (Date.now()-new Date(p.last_seen_at.endsWith('Z')?p.last_seen_at:p.last_seen_at+'Z').getTime())<300000;
    const isProton = p.type === 'proton';
    const sc = (p.supercharges||[]).map(s => `<span class="wp-sc-tag">⚡${s}</span>`).join('');
    return `<div class="wp-particle">
      <div class="wp-particle-indicator ${p.type}"><span>${isProton?'p⁺':'e⁻'}</span><span class="wp-online-dot ${online?'on':'off'}"></span></div>
      <div class="wp-particle-info"><div class="wp-particle-name">${esc(p.name)}</div><div class="wp-particle-sc">${sc||'<span style="color:var(--text-muted);font-size:10px">no supercharge</span>'}</div></div>
    </div>`;
  }).join('') || '<div style="font-size:11px;color:var(--text-muted);padding:8px">No particles yet</div>';
}

function wpRenderMenu() {
  return `<div class="wp-menu">
    <button class="wp-menu-item" onclick="wpShowJoinCircuit()">⊕ Join a Circuit</button>
    <button class="wp-menu-item" onclick="wpShowCreateCircuit()">⚡ Create Circuit</button>
    <div class="wp-menu-divider"></div>
    <button class="wp-menu-item ${wpConnected?'danger':''}" onclick="wpToggleConnection()">${wpConnected?'⊘ Disconnect':'⊕ Reconnect'}</button>
  </div>`;
}

function wpCloseMenuOutside(e) {
  if (wpMenuOpen && !e.target.closest('.wp-menu-btn') && !e.target.closest('.wp-menu')) { wpMenuOpen = false; wpRenderContent(); }
  if (wpDropdownOpen && !e.target.closest('.wp-dropdown')) { wpDropdownOpen = false; wpRenderContent(); }
}

// ─── Main Content ────────────────────────────────────────────────────────────
function wpRenderMain() {
  return wpTab === 'tasks' ? wpRenderTasksView() : wpRenderParticlesView();
}

function wpRenderTasksView() {
  const counts = {};
  wpTasks.forEach(t => { counts[t.status] = (counts[t.status]||0)+1; });
  const filters = ['all','open','claimed','in-progress','needs-review','blocked','done']
    .map(s => { const c = s==='all'?wpTasks.length:(counts[s]||0); if(s!=='all'&&c===0) return ''; const l=s==='all'?'All':s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); return `<button class="wp-filter${wpStatusFilter===s?' active':''}" onclick="wpStatusFilter='${s}';wpRenderContent()">${l}<span class="wp-filter-count">${c}</span></button>`; })
    .filter(Boolean).join('');

  return `
    <div class="wp-content-header"><span class="wp-content-title">Tasks</span><button class="wp-btn primary small" onclick="wpShowNewTask()">+ New Task</button></div>
    <div class="wp-filters">${filters}</div>
    <div class="wp-body"><div class="wp-task-list" id="wp-task-list">${wpRenderTaskList()}</div><div class="wp-task-detail" id="wp-task-detail"><div class="wp-detail-empty">Select a task</div></div></div>
  `;
}

function wpRenderTaskList() {
  const filtered = wpStatusFilter==='all' ? wpTasks : wpTasks.filter(t=>t.status===wpStatusFilter);
  if (!filtered.length) return '<div class="wp-empty">No tasks</div>';
  return filtered.map(t => {
    const a = wpParticles.find(p=>p.id===t.assignee_id);
    return `<div class="wp-task${t.id===wpSelectedTask?' selected':''}" onclick="wpSelectTask('${t.id}')">
      <div class="wp-task-header"><span class="wp-status-dot" style="background:${STATUS_COLORS[t.status]}"></span><span class="wp-task-title">${esc(t.title)}</span></div>
      <div class="wp-task-meta"><span class="wp-task-status" style="color:${STATUS_COLORS[t.status]}">${t.status}</span><span class="wp-task-assignee">${a?a.name:'Unassigned'}</span><span class="wp-task-age">${ago(t.updated_at)}</span></div>
    </div>`;
  }).join('');
}

// ─── Particles View ──────────────────────────────────────────────────────────
function wpRenderParticlesView() {
  const pending = wpInvites.filter(i=>i.status==='pending');
  const cards = wpParticles.map(p => {
    const online = p.last_seen_at && (Date.now()-new Date(p.last_seen_at.endsWith('Z')?p.last_seen_at:p.last_seen_at+'Z').getTime())<300000;
    const isProton = p.type==='proton';
    const sc = (p.supercharges||[]).map(s=>`<span class="wp-sc-tag">⚡${s}</span>`).join('');
    const removable = wpConfig && wpConfig.my_name !== p.name;
    return `<div class="wp-team-card">
      <div class="wp-team-card-left"><span class="wp-particle-indicator ${p.type}" style="width:24px;height:24px;font-size:10px"><span>${isProton?'p⁺':'e⁻'}</span><span class="wp-online-dot ${online?'on':'off'}"></span></span><span class="wp-team-name">${esc(p.name)}</span>${p.description?`<span class="wp-team-desc">${esc(p.description)}</span>`:''}<div class="wp-team-sc">${sc}</div></div>
      <div class="wp-team-card-right"><span class="wp-team-seen">${p.last_seen_at?ago(p.last_seen_at):'never'}</span>${removable?`<button class="wp-btn small" onclick="wpRemoveParticle('${p.id}','${esc(p.name)}')">Remove</button>`:''}</div>
    </div>`;
  }).join('');

  const invCards = wpInvites.map(inv => {
    const sc = inv.status;
    return `<div class="wp-invite-card ${sc}"><div class="wp-invite-left"><span class="wp-invite-code">${inv.code}</span><span class="wp-invite-role">${inv.role}</span><span class="wp-invite-status">${inv.status}</span></div><div class="wp-invite-right"><span class="wp-invite-expires">${until(inv.expires_at)}</span>${inv.status==='pending'?`<button class="wp-btn small" onclick="wpCopyCode('${inv.code}')">Copy</button><button class="wp-btn small" onclick="wpRevokeInvite('${inv.id}')">Revoke</button>`:''}</div></div>`;
  }).join('') || '<div class="wp-empty" style="padding:12px">No invites yet</div>';

  return `
    <div class="wp-content-header"><span class="wp-content-title">Particles</span><button class="wp-btn primary small" onclick="wpShowInviteForm()">+ Invite</button></div>
    <div class="wp-team-content">
      <div class="wp-section-title">Members (${wpParticles.length})</div><div class="wp-team-list">${cards}</div>
      <div class="wp-section-title">Invites (${pending.length} active)</div><div id="wp-invite-area"></div><div class="wp-invite-list">${invCards}</div>
    </div>
  `;
}

// ─── Task Detail ─────────────────────────────────────────────────────────────
async function wpSelectTask(id) {
  wpSelectedTask = id;
  document.querySelectorAll('.wp-task').forEach(c=>c.classList.remove('selected'));
  const card = document.querySelector(`.wp-task[onclick*="${id}"]`);
  if (card) card.classList.add('selected');
  await wpRenderTaskDetail(id);
}

async function wpRenderTaskDetail(id) {
  const el = document.getElementById('wp-task-detail');
  if (!el) return;
  const task = wpTasks.find(t=>t.id===id);
  if (!task) { el.innerHTML='<div class="wp-detail-empty">Not found</div>'; return; }

  let msgs = [];
  try { const r=await fetch(`/api/wp/tasks/${id}/messages`); if(r.ok) msgs=await r.json(); } catch(e){}

  const a = wpParticles.find(p=>p.id===task.assignee_id);
  const cr = wpParticles.find(p=>p.id===task.creator_id);
  const trans = VALID_TRANSITIONS[task.status]||[];
  const btns = [
    task.status==='open'?`<button class="wp-btn small primary" onclick="wpClaim('${id}')">Claim</button>`:'',
    ...trans.map(s=>`<button class="wp-btn small" style="border-color:${STATUS_COLORS[s]};color:${STATUS_COLORS[s]}" onclick="wpUpdateStatus('${id}','${s}')">${s}</button>`)
  ].filter(Boolean).join('');

  let git='';
  if(task.branch||task.commit_sha) git=`<div class="wp-detail-git">${task.branch?`<span class="wp-git-tag">${task.branch}</span>`:''}${task.commit_sha?`<span class="wp-git-tag">${task.commit_sha.slice(0,7)}</span>`:''}</div>`;

  const msgsHtml = msgs.length ? msgs.map(m=>{
    const s=wpParticles.find(p=>p.id===m.sender_id);
    return `<div class="wp-message"><div class="wp-message-header"><span class="wp-message-sender">${s?s.name:'?'}</span><span class="wp-message-time">${ago(m.created_at)}</span></div><div class="wp-message-body">${esc(m.body)}</div></div>`;
  }).join('') : '<div class="wp-messages-empty">No messages yet</div>';

  el.innerHTML = `
    <div class="wp-detail-header"><h3 class="wp-detail-title">${esc(task.title)}</h3><span class="wp-status-badge" style="background:${STATUS_COLORS[task.status]}">${task.status}</span></div>
    ${task.description?`<div class="wp-detail-desc">${esc(task.description)}</div>`:''}
    <div class="wp-detail-meta"><div class="wp-field"><div class="wp-field-label">Creator</div><div class="wp-field-value">${cr?cr.name:'?'}</div></div><div class="wp-field"><div class="wp-field-label">Assignee</div><div class="wp-field-value">${a?a.name:'Unassigned'}</div></div><div class="wp-field"><div class="wp-field-label">Created</div><div class="wp-field-value">${ago(task.created_at)}</div></div></div>
    ${git}
    <div class="wp-detail-actions">${btns}</div>
    <div class="wp-messages-section"><div class="wp-messages-title">Messages (${msgs.length})</div><div class="wp-messages">${msgsHtml}</div>
    <div class="wp-msg-input"><input type="text" id="wp-msg-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')wpSendMsg('${id}')"><button class="wp-btn small primary" onclick="wpSendMsg('${id}')">Send</button></div></div>
  `;
}

// ─── Actions ─────────────────────────────────────────────────────────────────
async function wpClaim(id) { await fetch(`/api/wp/tasks/${id}/claim`,{method:'PATCH'}); await wpRefreshAndRender(); }
async function wpUpdateStatus(id,s) { await fetch(`/api/wp/tasks/${id}/status`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s})}); await wpRefreshAndRender(); }
async function wpSendMsg(id) { const i=document.getElementById('wp-msg-input'); if(!i||!i.value.trim())return; const b=i.value.trim(); i.value=''; await fetch(`/api/wp/tasks/${id}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body:b})}); await wpRenderTaskDetail(id); }

function wpShowNewTask() {
  const el=document.getElementById('wp-task-detail'); if(!el)return;
  const opts=wpParticles.map(p=>`<option value="${p.id}">${p.name} (${p.type})</option>`).join('');
  el.innerHTML=`<div class="wp-detail-header"><h3 class="wp-detail-title">New Task</h3></div>
    <div class="wp-form"><div class="wp-form-group"><label>Title</label><input type="text" id="wp-new-title" maxlength="200" placeholder="What needs to be done?"></div>
    <div class="wp-form-group"><label>Description<span class="wp-char-count" id="wp-desc-count">0/500</span></label><textarea id="wp-new-desc" maxlength="500" rows="3" placeholder="Details" oninput="document.getElementById('wp-desc-count').textContent=this.value.length+'/500'"></textarea></div>
    <div class="wp-form-group"><label>Assignee</label><select id="wp-new-assignee"><option value="">Unassigned</option>${opts}</select></div>
    <div class="wp-form-group"><label>Branch</label><input type="text" id="wp-new-branch" placeholder="task/feature"></div>
    <div class="wp-form-actions"><button class="wp-btn" onclick="wpSelectedTask=null;wpRenderContent()">Cancel</button><button class="wp-btn primary" onclick="wpCreateTask()">Create</button></div></div>`;
  wpSelectedTask=null;
}

async function wpCreateTask() {
  const title=document.getElementById('wp-new-title').value.trim(); if(!title)return;
  const p={title}; const d=document.getElementById('wp-new-desc').value.trim(); if(d)p.description=d;
  const a=document.getElementById('wp-new-assignee').value; if(a)p.assignee_id=a;
  const b=document.getElementById('wp-new-branch').value.trim(); if(b)p.branch=b;
  const r=await fetch('/api/wp/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
  if(r.ok){const t=await r.json(); wpSelectedTask=t.id; await wpRefreshAndRender();}
}

// ─── Invites ─────────────────────────────────────────────────────────────────
function wpShowInviteForm() {
  const a=document.getElementById('wp-invite-area'); if(!a)return;
  a.innerHTML=`<div class="wp-invite-form"><div class="wp-form-group" style="flex:1"><label>Role</label><select id="wp-inv-role"><option value="proton">Proton (human)</option><option value="electron">Electron (AI)</option></select></div><div class="wp-form-group" style="flex:1"><label>Expires</label><select id="wp-inv-exp"><option value="24">24h</option><option value="48" selected>48h</option><option value="168">7d</option></select></div><button class="wp-btn primary small" onclick="wpGenInvite()">Generate</button><button class="wp-btn small" onclick="document.getElementById('wp-invite-area').innerHTML=''">Cancel</button></div>`;
}
async function wpGenInvite() {
  const role=document.getElementById('wp-inv-role').value; const h=parseInt(document.getElementById('wp-inv-exp').value);
  const r=await fetch('/api/wp/invites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,expires_hours:h})});
  if(r.ok){const inv=await r.json(); await wpRefreshInvites(); wpRenderContent(); wpCopyCode(inv.code);}
}
function wpCopyCode(code) { navigator.clipboard.writeText(code).then(()=>wpNotify(`Copied: ${code}`)).catch(()=>prompt('Share:',code)); }
async function wpRevokeInvite(id) { await fetch(`/api/wp/invites/${id}`,{method:'DELETE'}); await wpRefreshInvites(); wpRenderContent(); }
async function wpRemoveParticle(id,name) { if(!confirm(`Remove ${name}?`))return; await fetch(`/api/wp/particles/${id}`,{method:'DELETE'}); await wpRefreshParticles(); wpRenderContent(); }

// ─── Circuit Management ──────────────────────────────────────────────────────
async function wpSwitchCircuit(idx) {
  wpDropdownOpen=false;
  const r=await fetch('/api/wp/switch-circuit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({index:idx})});
  if(r.ok){if(wpSSE){wpSSE.close();wpSSE=null;} await checkSyncAvailable(); wpSelectedTask=null; showSync();}
}

function wpToggleConnection() {
  wpMenuOpen=false;
  if(wpConnected){wpConnected=false; if(wpSSE){wpSSE.close();wpSSE=null;} wpNotify('Disconnected');}
  else{wpConnected=true; wpConnectSSE(); wpNotify('Reconnected'); wpRefreshAndRender();}
  wpRenderPanel();
}
function wpSwitchTab(tab) { wpTab=tab; wpRenderContent(); }

// ─── Join / Create ───────────────────────────────────────────────────────────
function wpShowJoinCircuit() {
  wpMenuOpen=false;
  const m=document.getElementById('wp-main');
  m.innerHTML=`<div class="wp-content-header"><span class="wp-content-title">Join a Circuit</span><button class="wp-btn small" onclick="wpRenderContent()">Cancel</button></div>
    <div class="wp-team-content"><div class="wp-form">
    <div class="wp-form-group"><label>Invite Code</label><input type="text" id="wp-join-code" placeholder="KRIS-XXXX-XXXX" style="font-family:var(--font-mono);text-transform:uppercase;letter-spacing:2px;text-align:center;font-size:16px"></div>
    <div class="wp-form-group"><label>Your Name</label><input type="text" id="wp-join-name" maxlength="100" placeholder="e.g. alex"></div>
    <div class="wp-form-group"><label>Circuit Name</label><input type="text" id="wp-join-circuit" maxlength="100" placeholder="e.g. KRIS Dev"></div>
    <div class="wp-form-group"><label>Your Supercharges (comma-separated)</label><input type="text" id="wp-join-sc" placeholder="e.g. claude-code, product-management"></div>
    <div class="wp-form-group"><label>Server</label><input type="text" id="wp-join-server" value="https://kris-sync.scaledagile.pro"></div>
    <div class="wp-form-actions"><button class="wp-btn" onclick="wpRenderContent()">Cancel</button><button class="wp-btn primary" id="wp-join-btn" onclick="wpDoJoin()">Join</button></div>
    <div id="wp-join-error" style="display:none;color:#ef4444;font-size:12px;text-align:center"></div></div></div>`;
}

function wpShowCreateCircuit() {
  wpMenuOpen=false;
  const m=document.getElementById('wp-main');
  m.innerHTML=`<div class="wp-content-header"><span class="wp-content-title">Create a Circuit</span><button class="wp-btn small" onclick="wpRenderContent()">Cancel</button></div>
    <div class="wp-team-content"><div class="wp-form">
    <div class="wp-form-group"><label>Circuit Name</label><input type="text" id="wp-create-name" maxlength="100" placeholder="e.g. My Project"></div>
    <div class="wp-form-group"><label>Description</label><input type="text" id="wp-create-desc" maxlength="200" placeholder="What is this circuit for?"></div>
    <div class="wp-form-group"><label>Your Name</label><input type="text" id="wp-create-your-name" maxlength="100" placeholder="e.g. alex"></div>
    <div class="wp-form-group"><label>Your Supercharges (comma-separated)</label><input type="text" id="wp-create-sc" placeholder="e.g. claude-code, fullstack-dev"></div>
    <div class="wp-form-group"><label>Server</label><input type="text" id="wp-create-server" value="https://kris-sync.scaledagile.pro"></div>
    <div class="wp-form-actions"><button class="wp-btn" onclick="wpRenderContent()">Cancel</button><button class="wp-btn primary" id="wp-create-btn" onclick="wpDoCreate()">Create</button></div>
    <div id="wp-create-error" style="display:none;color:#ef4444;font-size:12px;text-align:center"></div></div></div>`;
}

function parseSC(val) { return val ? val.split(',').map(s=>s.trim()).filter(Boolean) : []; }

async function wpDoJoin() {
  const code=(document.getElementById('wp-join-code')||{}).value||'';
  const name=(document.getElementById('wp-join-name')||{}).value||'';
  const cn=(document.getElementById('wp-join-circuit')||{}).value||'';
  const sc=parseSC((document.getElementById('wp-join-sc')||{}).value||'');
  const server=(document.getElementById('wp-join-server')||{}).value||'';
  const err=document.getElementById('wp-join-error');
  const btn=document.getElementById('wp-join-btn');
  if(!code.trim()||!name.trim()){err.textContent='Code and name required';err.style.display='';return;}
  err.style.display='none'; btn.disabled=true; btn.textContent='Joining...';
  try{
    const r=await fetch('/api/wp/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code.trim(),name:name.trim(),circuit_name:cn.trim(),server:server.trim(),supercharges:sc})});
    const d=await r.json();
    if(!r.ok){err.textContent=d.detail||d.error||'Failed';err.style.display='';btn.disabled=false;btn.textContent='Join';return;}
    wpNotify('Joined circuit!'); await checkSyncAvailable(); showSync();
  }catch(e){err.textContent='Network error';err.style.display='';btn.disabled=false;btn.textContent='Join';}
}

async function wpDoCreate() {
  const cn=(document.getElementById('wp-create-name')||{}).value||'';
  const desc=(document.getElementById('wp-create-desc')||{}).value||'';
  const name=(document.getElementById('wp-create-your-name')||{}).value||'';
  const sc=parseSC((document.getElementById('wp-create-sc')||{}).value||'');
  const server=(document.getElementById('wp-create-server')||{}).value||'';
  const err=document.getElementById('wp-create-error');
  const btn=document.getElementById('wp-create-btn');
  if(!cn.trim()||!name.trim()){err.textContent='All fields required';err.style.display='';return;}
  err.style.display='none'; btn.disabled=true; btn.textContent='Creating...';
  try{
    const r=await fetch('/api/wp/create-circuit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({circuit_name:cn.trim(),description:desc.trim(),your_name:name.trim(),server:server.trim(),supercharges:sc})});
    const d=await r.json();
    if(!r.ok){err.textContent=d.detail||d.error||'Failed';err.style.display='';btn.disabled=false;btn.textContent='Create';return;}
    wpNotify(`Circuit "${cn}" created!`); await checkSyncAvailable(); showSync();
  }catch(e){err.textContent='Network error';err.style.display='';btn.disabled=false;btn.textContent='Create';}
}

// ─── Join Form (unconfigured) ────────────────────────────────────────────────
function wpRenderJoinForm() { wpRenderOnboarding('join'); }
function wpShowCreateStandalone() { wpRenderOnboarding('create'); }

function wpRenderOnboarding(mode) {
  const isCreate = mode === 'create';
  const c = document.getElementById('wp-container');

  const title = isCreate ? 'Create a Circuit' : 'Join a Circuit';
  const subtitle = isCreate
    ? 'Start a new circuit and invite others to join.'
    : 'Enter the invite code to join an existing circuit.';
  const btnText = isCreate ? 'Create Circuit' : 'Join Circuit';
  const btnAction = isCreate ? 'wpDoCreate()' : 'wpDoJoin()';
  const btnId = isCreate ? 'wp-create-btn' : 'wp-join-btn';
  const errId = isCreate ? 'wp-create-error' : 'wp-join-error';
  const switchText = isCreate ? 'join an existing circuit' : 'create a new circuit';
  const switchAction = isCreate ? 'wpRenderJoinForm()' : 'wpShowCreateStandalone()';
  const cardClass = isCreate ? 'wp-join-card wp-card-create' : 'wp-join-card';

  const codeField = isCreate ? '' :
    `<div class="wp-form-group"><label>Invite Code</label><input type="text" id="wp-join-code" placeholder="KRIS-XXXX-XXXX" class="wp-code-input"></div>`;
  const descField = isCreate ?
    `<div class="wp-form-group"><label>Circuit Description</label><input type="text" id="wp-create-desc" maxlength="200" placeholder="What is this circuit for?"></div>` : '';

  c.innerHTML = `<div class="wp-join-page"><div class="${cardClass}">
    <div class="wp-join-logo">KRIS</div>
    <div class="wp-join-subtitle">WirePulse</div>
    <h2>${title}</h2>
    <p class="wp-join-desc">${subtitle}</p>
    <div class="wp-form">
      ${codeField}
      <div class="wp-form-group"><label>Circuit Name</label><input type="text" id="${isCreate ? 'wp-create-name' : 'wp-join-circuit'}" maxlength="100" placeholder="e.g. KRIS Dev"></div>
      ${descField}
      <div class="wp-form-group"><label>Your Name</label><input type="text" id="${isCreate ? 'wp-create-your-name' : 'wp-join-name'}" maxlength="100" placeholder="e.g. alex"></div>
      <div class="wp-form-group"><label>Your Supercharges</label><input type="text" id="${isCreate ? 'wp-create-sc' : 'wp-join-sc'}" placeholder="e.g. claude-code, product-management"></div>
      <div class="wp-form-group"><label>Server</label><input type="text" id="${isCreate ? 'wp-create-server' : 'wp-join-server'}" value="https://kris-sync.scaledagile.pro"></div>
      <button class="wp-btn primary wp-onboard-btn" id="${btnId}" onclick="${btnAction}">${btnText}</button>
      <div class="wp-onboard-switch">or <a href="#" onclick="event.preventDefault();${switchAction}">${switchText}</a></div>
      <div id="${errId}" class="wp-onboard-error"></div>
    </div>
  </div></div>`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ago(s){if(!s)return'';const d=(Date.now()-new Date(s.endsWith('Z')?s:s+'Z').getTime())/1000;if(d<60)return'now';if(d<3600)return Math.floor(d/60)+'m';if(d<86400)return Math.floor(d/3600)+'h';return Math.floor(d/86400)+'d';}
function until(s){if(!s)return'';const d=(new Date(s.endsWith('Z')?s:s+'Z').getTime()-Date.now())/1000;if(d<=0)return'expired';if(d<3600)return Math.floor(d/60)+'m';if(d<86400)return Math.floor(d/3600)+'h';return Math.floor(d/86400)+'d';}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
