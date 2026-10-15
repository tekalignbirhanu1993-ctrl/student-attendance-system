
document.addEventListener('DOMContentLoaded', () => {
  const A = window.App;
  if (!A) return;

  const { store } = A;
  const content = document.getElementById('page-content');

  content.innerHTML = `
    <div class="page-heading">
      <div>
        <span class="eyebrow">INSIGHTS & EXPORTS</span>
        <h1>Attendance reports</h1>
        <p>Filter records and export attendance details.</p>
      </div>
      <button class="button primary" id="export-csv">↓ Export CSV</button>
    </div>

    <div class="panel" style="margin-bottom:18px">
      <div class="panel-body">
        <div class="toolbar-row">
          <label for="from-date">From</label>
          <input class="field" type="date" id="from-date">

          <label for="to-date">To</label>
          <input class="field" type="date" id="to-date"
                 value="${store.today()}">

          <label for="report-grade">Grade</label>
          <select class="field" id="report-grade">
            <option value="">All grades</option>
            ${[9, 10, 11, 12].map(grade =>
              `<option value="${grade}">Grade ${grade}</option>`
            ).join('')}
          </select>

          <label for="report-status">Status</label>
          <select class="field" id="report-status">
            <option value="">All statuses</option>
            ${['present', 'absent', 'late', 'excused'].map(status =>
              `<option value="${status}">
                ${status[0].toUpperCase() + status.slice(1)}
              </option>`
            ).join('')}
          </select>

          <button class="button secondary" id="apply-filters">
            Apply filters
          </button>
        </div>
      </div>
    </div>

    <div class="stats-grid" id="report-stats"></div>

    <div class="report-cards" style="margin-bottom:18px">
      <article class="report-card">
        <h3>Daily attendance</h3>
        <p>Attendance records for today.</p>
        <button class="button secondary" data-quick="daily">
          Use today
        </button>
      </article>

      <article class="report-card">
        <h3>Absent student list</h3>
        <p>Find students recorded absent.</p>
        <button class="button secondary" data-quick="absent">
          Show absences
        </button>
      </article>

      <article class="report-card">
        <h3>Grade summary</h3>
        <p>Compare records across grades.</p>
        <button class="button secondary" data-quick="grade">
          All grades
        </button>
      </article>
    </div>

    <section class="panel">
      <header class="panel-header">
        <div>
          <h2>Attendance detail</h2>
          <p id="result-count">Filtered records</p>
        </div>
      </header>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Grade / section</th>
              <th>Status</th>
              <th>Recorded by</th>
            </tr>
          </thead>
          <tbody id="report-rows"></tbody>
        </table>
      </div>
    </section>
  `;

  const from = document.getElementById('from-date');
  const to = document.getElementById('to-date');
  const grade = document.getElementById('report-grade');
  const status = document.getElementById('report-status');

  from.value = new Date(Date.now() - 6 * 86400000)
    .toISOString().slice(0, 10);

  let filtered = [];

  function run() {
    const data = store.get();

    filtered = data.attendance
      .filter(record => {
        const student = data.students.find(
          item => item.id === record.studentId
        ) || {};

        return (
          record.date >= from.value &&
          record.date <= to.value &&
          (!grade.value || String(student.grade) === grade.value) &&
          (!status.value || record.status === status.value)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const total = filtered.length;

    const counts = ['present', 'absent', 'late', 'excused']
      .map(value => [
        value,
        filtered.filter(record => record.status === value).length
      ]);

    document.getElementById('report-stats').innerHTML = `
      <article class="stat-card">
        <div class="stat-head">
          Matching records <span class="stat-icon">▤</span>
        </div>
        <strong class="stat-value">${total}</strong>
        <div class="stat-foot">Within selected filters</div>
      </article>
      ${counts.slice(0, 3).map(([name, count]) => `
        <article class="stat-card">
          <div class="stat-head">
            ${name[0].toUpperCase() + name.slice(1)}
            <span class="stat-icon">
              ${{ present: '✓', absent: '!', late: '◷' }[name]}
            </span>
          </div>
          <strong class="stat-value">${count}</strong>
          <div class="stat-foot">
            ${total ? Math.round(count / total * 100) : 0}% of records
          </div>
        </article>
      `).join('')}
    `;

    document.getElementById('result-count').textContent =
      `${total} attendance record(s)`;

    document.getElementById('report-rows').innerHTML = total
      ? filtered.map(record => {
          const student = data.students.find(
            item => item.id === record.studentId
          ) || {};

          const teacher = data.teachers.find(
            item => item.id === record.recordedBy
          ) || {};

          const initials = (student.name || '?')
            .split(' ').map(part => part[0]).slice(0, 2).join('');

          return `
            <tr>
              <td>${A.formatDate(record.date)}</td>
              <td>
                <div class="student-cell">
                  <span class="student-initial">${A.esc(initials)}</span>
                  <span>
                    <b>${A.esc(student.name || 'Unknown')}</b>
                    <small>${A.esc(student.id || record.studentId)}</small>
                  </span>
                </div>
              </td>
              <td>
                Grade ${student.grade || '?'}-${student.section || '?'}
              </td>
              <td>${A.statusBadge(record.status)}</td>
              <td>
                ${A.esc(teacher.name || record.recordedBy || '—')}
              </td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              No records match the selected filters.
            </div>
          </td>
        </tr>
      `;
  }

  document.getElementById('apply-filters').onclick = run;

  document.getElementById('export-csv').onclick = () => {
    if (!filtered.length) {
      A.toast('There are no matching records to export.', 'warning');
      return;
    }

    const data = store.get();

    const rows = [
      [
        'Date', 'Student ID', 'Student name', 'Grade',
        'Section', 'Status', 'Remarks', 'Recorded by'
      ],
      ...filtered.map(record => {
        const student = data.students.find(
          item => item.id === record.studentId
        ) || {};

        return [
          record.date,
          record.studentId,
          student.name || '',
          student.grade || '',
          student.section || '',
          record.status,
          record.remarks || '',
          record.recordedBy || ''
        ];
      })
    ];

    const csv = rows.map(row =>
      row.map(value =>
        `"${String(value).replace(/"/g, '""')}"`
      ).join(',')
    ).join('\r\n');

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'attendance-report.csv';
    link.click();

    URL.revokeObjectURL(url);
    A.toast('CSV report exported.');
  };

  document.querySelectorAll('[data-quick]').forEach(button => {
    button.onclick = () => {
      if (button.dataset.quick === 'daily') {
        from.value = store.today();
        to.value = store.today();
        status.value = '';
        grade.value = '';
      }

      if (button.dataset.quick === 'absent') {
        status.value = 'absent';
      }

      if (button.dataset.quick === 'grade') {
        grade.value = '';
      }

      run();
    };
  });

  run();
});
