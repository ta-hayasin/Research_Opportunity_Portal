// Frontend is served by the backend, so a relative URL works.
const API = '/api/opportunities';

const $ = (id) => document.getElementById(id);
const FIELDS = ['title', 'description', 'research_area', 'department', 'faculty_name',
                'required_skills', 'available_positions', 'application_deadline', 'status'];
const REQUIRED_LABELS = {
  title: 'Research title', description: 'Description', research_area: 'Research area',
  department: 'Department', faculty_name: 'Faculty name', required_skills: 'Required skills',
  available_positions: 'Available positions', application_deadline: 'Application deadline'
};

let cache = [];

// ---------- helpers ----------
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let alertTimer;
function showAlert(message, type = 'success') {
  const el = $('alert');
  el.textContent = message;
  el.className = `alert ${type}`;
  clearTimeout(alertTimer);
  alertTimer = setTimeout(() => el.classList.add('hidden'), 5000);
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }
  if (!res.ok) {
    const detail = data?.errors ? ': ' + data.errors.join('; ') : '';
    const err = new Error((data?.message || `Request failed (${res.status})`) + detail);
    err.status = res.status;
    throw err;
  }
  return data;
}

function openModal(id) { $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }

// ---------- list ----------
async function loadList() {
  try {
    cache = await request(API);
    renderList();
  } catch (e) {
    showAlert('Could not load opportunities: ' + e.message, 'error');
  }
}

function renderList() {
  const list = $('list');
  if (cache.length === 0) {
    list.innerHTML = '<p class="empty">No research opportunities yet. Click "New Opportunity" to add one.</p>';
    return;
  }
  list.innerHTML = cache.map((o) => `
    <article class="card">
      <span class="badge ${o.status}">${o.status}</span>
      <h3>${esc(o.title)}</h3>
      <p><strong>Area:</strong> ${esc(o.research_area)} &middot; <strong>Dept:</strong> ${esc(o.department)}</p>
      <p><strong>Faculty:</strong> ${esc(o.faculty_name)}</p>
      <p><strong>Positions:</strong> ${o.available_positions} &middot; <strong>Deadline:</strong> ${esc(o.application_deadline)}</p>
      <div class="btns">
        <button class="btn small" data-action="view" data-id="${o.id}">View</button>
        <button class="btn small" data-action="edit" data-id="${o.id}">Edit</button>
        ${o.status === 'Open' ? `<button class="btn small warn" data-action="close" data-id="${o.id}">Close</button>` : ''}
        <button class="btn small danger" data-action="delete" data-id="${o.id}">Delete</button>
      </div>
    </article>`).join('');
}

// ---------- details ----------
async function viewOpportunity(id) {
  try {
    const o = await request(`${API}/${id}`);
    $('detailBody').innerHTML = `
      <div class="detail">
        <h2>${esc(o.title)}</h2>
        <span class="badge ${o.status}">${o.status}</span>
        <dl>
          <dt>ID</dt><dd>${o.id}</dd>
          <dt>Description</dt><dd>${esc(o.description)}</dd>
          <dt>Research Area</dt><dd>${esc(o.research_area)}</dd>
          <dt>Faculty Member</dt><dd>${esc(o.faculty_name)}</dd>
          <dt>Department</dt><dd>${esc(o.department)}</dd>
          <dt>Required Skills</dt><dd>${esc(o.required_skills)}</dd>
          <dt>Available Positions</dt><dd>${o.available_positions}</dd>
          <dt>Application Deadline</dt><dd>${esc(o.application_deadline)}</dd>
        </dl>
      </div>`;
    openModal('detailModal');
  } catch (e) {
    showAlert(e.message, 'error');
    if (e.status === 404) loadList();
  }
}

// ---------- form ----------
function clearErrors() {
  document.querySelectorAll('.err').forEach((e) => (e.textContent = ''));
  document.querySelectorAll('.invalid').forEach((e) => e.classList.remove('invalid'));
}

function openForm(o) {
  clearErrors();
  $('oppForm').reset();
  $('oppId').value = o ? o.id : '';
  $('formTitle').textContent = o ? `Edit Opportunity #${o.id}` : 'New Opportunity';
  FIELDS.forEach((f) => { $(f).value = o ? o[f] : ''; });
  if (!o) $('status').value = 'Open';
  openModal('formModal');
}

function validateForm() {
  clearErrors();
  let ok = true;
  const fail = (f, msg) => { $('err-' + f).textContent = msg; $(f).classList.add('invalid'); ok = false; };

  for (const f of Object.keys(REQUIRED_LABELS)) {
    if (!$(f).value.trim()) fail(f, `${REQUIRED_LABELS[f]} is required`);
  }
  const pos = $('available_positions').value.trim();
  if (pos && (!/^\d+$/.test(pos))) fail('available_positions', 'Must be a whole number (0 or more)');
  return ok;
}

async function saveForm(e) {
  e.preventDefault();
  if (!validateForm()) { showAlert('Please fix the highlighted fields.', 'error'); return; }

  const payload = {};
  FIELDS.forEach((f) => { payload[f] = $(f).value.trim(); });
  payload.available_positions = Number(payload.available_positions);

  const id = $('oppId').value;
  try {
    if (id) {
      await request(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showAlert('Opportunity updated successfully.');
    } else {
      await request(API, { method: 'POST', body: JSON.stringify(payload) });
      showAlert('Opportunity created successfully.');
    }
    closeModal('formModal');
    loadList();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

async function editOpportunity(id) {
  try {
    openForm(await request(`${API}/${id}`));
  } catch (e) {
    showAlert(e.message, 'error');
    if (e.status === 404) loadList();
  }
}

// ---------- close / delete ----------
async function closeOpportunity(id) {
  try {
    await request(`${API}/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Closed' }) });
    showAlert('Opportunity status changed to Closed.');
    loadList();
  } catch (e) {
    showAlert(e.message, 'error');
    if (e.status === 404) loadList();
  }
}

async function deleteOpportunity(id) {
  if (!confirm('Are you sure you want to delete this opportunity?')) return;
  try {
    await request(`${API}/${id}`, { method: 'DELETE' });
    showAlert('Opportunity deleted successfully.');
    loadList();
  } catch (e) {
    showAlert(e.message, 'error');
    if (e.status === 404) loadList();
  }
}

// ---------- events ----------
$('newBtn').addEventListener('click', () => openForm(null));
$('oppForm').addEventListener('submit', saveForm);

document.addEventListener('click', (e) => {
  const closeTarget = e.target.closest('[data-close]');
  if (closeTarget) return closeModal(closeTarget.dataset.close);

  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  ({ view: viewOpportunity, edit: editOpportunity, close: closeOpportunity, delete: deleteOpportunity })[btn.dataset.action](id);
});

loadList();
