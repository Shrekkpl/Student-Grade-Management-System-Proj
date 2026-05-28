// ─── Storage ───────────────────────────────────────────────
  const STORAGE_KEY = 'sgms_students_v1';
 
  function loadData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }
 
  function saveData(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }
    catch (e) { showToast('Storage error. Data may not persist.'); }
  }
 
  // ─── State ─────────────────────────────────────────────────
  let students = loadData();
  let searchQuery = '';
 
  // ─── Helpers ───────────────────────────────────────────────
  function computeAverage(s) {
    return Math.round(((+s.prelim) + (+s.midterm) + (+s.final)) / 3 * 10) / 10;
  }
 
  function getStatus(avg) {
    if (avg >= 90) return 'excellent';
    if (avg >= 75) return 'passed';
    return 'failed';
  }
 
  function getStatusLabel(avg) {
    if (avg >= 90) return 'Excellent';
    if (avg >= 75) return 'Passed';
    return 'Failed';
  }
 
  function gradeColor(avg) {
    if (avg >= 90) return '#378ADD';
    if (avg >= 75) return '#1D9E75';
    return '#D85A30';
  }
 
  // ─── Validation ────────────────────────────────────────────
  function showError(field, message) {
    const el = document.getElementById('err-' + field);
    if (!el) return;
    if (message) { el.textContent = message; el.style.display = 'block'; }
    else { el.style.display = 'none'; }
  }
 
  function clearErrors() {
    ['id', 'name', 'subject', 'prelim', 'midterm', 'final']
      .forEach(f => showError(f, null));
  }
 
  function validateGradeField(value, field) {
    if (value === '') { showError(field, 'This field is required.'); return false; }
    const n = parseFloat(value);
    if (isNaN(n) || n < 0 || n > 100) {
      showError(field, 'Enter a valid number between 0 and 100.');
      return false;
    }
    showError(field, null);
    return true;
  }
 
  // ─── Add student ───────────────────────────────────────────
  function addStudent() {
    clearErrors();
 
    const sid     = document.getElementById('inp-id').value.trim();
    const name    = document.getElementById('inp-name').value.trim();
    const subject = document.getElementById('inp-subject').value.trim();
    const prelim  = document.getElementById('inp-prelim').value.trim();
    const midterm = document.getElementById('inp-midterm').value.trim();
    const fin     = document.getElementById('inp-final').value.trim();
 
    let valid = true;
 
    // Required field checks
    if (!sid) { showError('id', 'Student ID is required.'); valid = false; }
    else if (students.some(s => s.id.toLowerCase() === sid.toLowerCase())) {
      showError('id', 'Duplicate ID — each student must have a unique ID.');
      valid = false;
    }
 
    if (!name) { showError('name', 'Full name is required.'); valid = false; }
 
    if (!subject) { showError('subject', 'Subject is required.'); valid = false; }
 
    if (!validateGradeField(prelim,  'prelim'))  valid = false;
    if (!validateGradeField(midterm, 'midterm')) valid = false;
    if (!validateGradeField(fin,     'final'))   valid = false;
 
    if (!valid) return;
 
    // Add to array
    const student = {
      id:       sid,
      name:     name,
      subject:  subject,
      prelim:   parseFloat(prelim),
      midterm:  parseFloat(midterm),
      final:    parseFloat(fin),
      addedAt:  Date.now()
    };
 
    students.push(student);
    saveData(students);
    clearForm();
    renderTable();
    updateStats();
    showToast('Student added successfully.');
  }
 
  function clearForm() {
    ['inp-id','inp-name','inp-subject','inp-prelim','inp-midterm','inp-final']
      .forEach(id => { document.getElementById(id).value = ''; });
    clearErrors();
  }
 
  // ─── Remove student ────────────────────────────────────────
  function removeStudent(index) {
    if (!confirm('Remove this student record? This cannot be undone.')) return;
    students.splice(index, 1);
    saveData(students);
    renderTable();
    updateStats();
    showToast('Record removed.');
  }
 
  // ─── Clear all ─────────────────────────────────────────────
  function clearAll() {
    if (students.length === 0) { showToast('No records to clear.'); return; }
    openModal();
  }
 
  function openModal() {
    document.getElementById('modal-overlay').classList.add('active');
  }
 
  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  }
 
  function handleOverlayClick(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  }
 
  function confirmClearAll() {
    students = [];
    saveData(students);
    renderTable();
    updateStats();
    closeModal();
    showToast('All records cleared.');
  }
 
  // ─── Linear Search Algorithm ───────────────────────────────
  /**
   * Linear Search: iterates through every element in the array
   * and checks if it matches the query. Time complexity: O(n).
   * Required by rubric — searches by student ID or name.
   */
  function linearSearch(query, arr) {
    const q = query.toLowerCase();
    const results = [];
    for (let i = 0; i < arr.length; i++) {           // visit each element
      const idMatch   = arr[i].id.toLowerCase().includes(q);
      const nameMatch = arr[i].name.toLowerCase().includes(q);
      if (idMatch || nameMatch) {
        results.push({ student: arr[i], originalIndex: i });
      }
    }
    return results;
  }
 
  // ─── Bubble Sort Algorithm ─────────────────────────────────
  /**
   * Bubble Sort: repeatedly compares adjacent pairs and swaps
   * them if out of order. Time complexity: O(n²).
   * Supports sorting by name, average grade, or ID.
   */
  function bubbleSort(arr, key, ascending) {
    const a = [...arr];
    const n = a.length;
 
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        let shouldSwap = false;
 
        if (key === 'name') {
          const cmp = a[j].student.name.localeCompare(a[j + 1].student.name);
          shouldSwap = ascending ? cmp > 0 : cmp < 0;
        } else if (key === 'grade') {
          const avgA = computeAverage(a[j].student);
          const avgB = computeAverage(a[j + 1].student);
          shouldSwap = ascending ? avgA > avgB : avgA < avgB;
        } else if (key === 'id') {
          const cmp = a[j].student.id.localeCompare(a[j + 1].student.id);
          shouldSwap = ascending ? cmp > 0 : cmp < 0;
        }
 
        if (shouldSwap) {
          const temp = a[j];
          a[j] = a[j + 1];
          a[j + 1] = temp;
        }
      }
    }
    return a;
  }
 
  // ─── Search handler ────────────────────────────────────────
  function handleSearch() {
    searchQuery = document.getElementById('search-inp').value.trim();
    renderTable();
  }
 
  // ─── Render table ──────────────────────────────────────────
  function renderTable() {
    const sortVal  = document.getElementById('sort-sel').value;
    const [sortKey, sortDir] = sortVal.split('-');
 
    // Build working pool with original indices
    let pool = students.map((s, i) => ({ student: s, originalIndex: i }));
 
    // Apply linear search filter
    const infoEl = document.getElementById('search-info');
    let filtered;
    if (searchQuery) {
      filtered = linearSearch(searchQuery, students);
      infoEl.style.display = 'block';
      infoEl.textContent = filtered.length > 0
        ? `Linear search found ${filtered.length} result${filtered.length > 1 ? 's' : ''} for "${searchQuery}"`
        : `No results found for "${searchQuery}"`;
    } else {
      filtered = pool;
      infoEl.style.display = 'none';
    }
 
    // Apply bubble sort
    const sorted = bubbleSort(filtered, sortKey, sortDir === 'asc');
 
    const tbody  = document.getElementById('table-body');
    const emptyEl = document.getElementById('empty-state');
 
    if (sorted.length === 0) {
      tbody.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
 
    tbody.innerHTML = sorted.map(({ student: s, originalIndex: oi }) => {
      const avg    = computeAverage(s);
      const status = getStatus(avg);
      const pct    = Math.min(avg, 100);
      const color  = gradeColor(avg);
 
      return `
        <tr>
          <td title="${escHtml(s.id)}">${escHtml(s.id)}</td>
          <td title="${escHtml(s.name)}">${escHtml(s.name)}</td>
          <td title="${escHtml(s.subject)}">${escHtml(s.subject)}</td>
          <td>${s.prelim.toFixed(1)}</td>
          <td>${s.midterm.toFixed(1)}</td>
          <td>${s.final.toFixed(1)}</td>
          <td>
            <span style="font-weight:500">${avg.toFixed(1)}</span>
            <div class="grade-bar-bg">
              <div class="grade-bar" style="width:${pct}%;background:${color}"></div>
            </div>
          </td>
          <td><span class="badge ${status}">${getStatusLabel(avg)}</span></td>
          <td>
            <button class="btn-sm" onclick="removeStudent(${oi})" title="Remove student">
              <i class="ti ti-trash"></i>
            </button>
          </td>
        </tr>`;
    }).join('');
  }
 
  // ─── Update stats cards ────────────────────────────────────
  function updateStats() {
    document.getElementById('st-total').textContent = students.length;
 
    if (students.length === 0) {
      document.getElementById('st-avg').textContent  = '—';
      document.getElementById('st-pass').textContent = '0';
      document.getElementById('st-fail').textContent = '0';
      return;
    }
 
    const avgs = students.map(computeAverage);
    const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length;
 
    document.getElementById('st-avg').textContent  = mean.toFixed(1);
    document.getElementById('st-pass').textContent = avgs.filter(a => a >= 75).length;
    document.getElementById('st-fail').textContent = avgs.filter(a => a < 75).length;
  }
 
  // ─── Toast ─────────────────────────────────────────────────
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
  }
 
  // ─── XSS safety ────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }
 
  // ─── Enter key support ─────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement.closest('.panel')) {
      const inputs = ['inp-id','inp-name','inp-subject','inp-prelim','inp-midterm','inp-final'];
      if (inputs.includes(document.activeElement.id)) addStudent();
    }
  });
 
  // ─── Init ──────────────────────────────────────────────────
  renderTable();
  updateStats();