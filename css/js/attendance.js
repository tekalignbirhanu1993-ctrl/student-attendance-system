
document.addEventListener('DOMContentLoaded', () => {
  const A = window.App;
  if (!A) return;

  const { store } = A;
  const content = document.getElementById('page-content');

  let chosen = {};
  let dirty = false;

  const classes = store.get().classes.filter(
    item => item.teacherId === A.user.teacherId
  );

  const params = new URLSearchParams(location.search);

  content.innerHTML = `
    <div class="page-heading">
      <div>
        <span class="eyebrow">CLASS REGISTER</span>
        <h1>Take attendance</h1>
        <p>Mark each student once, then save the register.</p>
      </div>
      <span class="status unmarked" id="save-state">
        No unsaved changes
      </span>
    </div>

    <div class="panel" style="margin-bottom:18px">
      <div class="panel-body">
        <div class="toolbar-row">
          <label for="class-select">Class</label>
          <select class="field" id="class-select">
            ${classes.map(item => `
              <option value="${item.id}"
                ${params.get('class') === item.id ? 'selected' : ''}>
                ${item.name}
              </option>
            `).join('')}
          </select>

          <label for="attendance-date">Date</label>
          <input class="field" type="date"
                 id="attendance-date"
                 value="${store.today()}"
                 max="${store.today()}">

          <input class="field search" id="search-student"
                 placeholder="Search name or ID…"
                 aria-label="Search student">
        </div>

        <div class="attendance-summary" id="attendance-summary"></div>

        <div class="toolbar-row">
          <button class="button secondary" id="mark-all">
            ✓ Mark all present
          </button>
          <button class="button ghost" id="clear-marks">
            Clear unsubmitted marks
          </button>
          <span class="muted tiny">
            Present, absent, late, excused
          </span>
        </div>
      </div>
    </div>

    <div class="attendance-list" id="attendance-list"></div>

    <div class="sticky-save">
      <span class="muted tiny" id="completion-text"></span>
      <button class="button primary" id="save-attendance">
        Save attendance
      </button>
    </div>
  `;

  const classSelect = document.getElementById('class-select');
  const dateInput = document.getElementById('attendance-date');
  const searchInput = document.getElementById('search-student');

  function init() {
    chosen = {};

    const classId = classSelect.value;
    const date = dateInput.value;

    store.get().students
      .filter(student =>
        student.status !== 'inactive' &&
        `${student.grade}-${student.section}` === classId
      )
      .forEach(student => {
        const record = store.get().attendance.find(item =>
          item.studentId === student.id &&
          item.classId === classId &&
          item.date === date
        );

        chosen[student.id] = record ? record.status : '';
      });

    dirty = false;
    window.AttendanceUnsaved = false;

    updateState();
    render();
  }

  function updateState() {
    const state = document.getElementById('save-state');

    state.textContent = dirty
      ? 'Unsaved changes'
      : 'No unsaved changes';

    state.className = 'status ' + (dirty ? 'late' : 'unmarked');
  }

  function render() {
    const query = searchInput.value.toLowerCase();

    const list = store.get().students.filter(student =>
      student.status !== 'inactive' &&
      `${student.grade}-${student.section}` === classSelect.value &&
      `${student.name} ${student.id}`.toLowerCase().includes(query)
    );

    const values = Object.values(chosen);

    document.getElementById('attendance-summary').innerHTML = [
      ['present', 'Present'],
      ['absent', 'Absent'],
      ['late', 'Late'],
      ['excused', 'Excused'],
      ['', 'Unmarked']
    ].map(([key, label]) => `
      <span class="summary-chip">
        ${label}
        <b>${key
          ? values.filter(value => value === key).length
          : values.filter(value => !value).length}
        </b>
      </span>
    `).join('');

    document.getElementById('completion-text').textContent =
      `${values.filter(Boolean).length} of ${values.length} students marked`;

    document.getElementById('attendance-list').innerHTML = list.length
      ? list.map(student => `
          <article class="attendance-person">
            <div class="person-main">
              <span class="student-initial">
                ${A.esc(student.name.split(' ')
                  .map(part => part[0]).slice(0, 2).join(''))}
              </span>
              <span>
                <b>${A.esc(student.name)}</b>
                <small>
                  ${A.esc(student.id)} · Grade
                  ${student.grade}-${student.section}
                </small>
              </span>
            </div>

            <div class="status-options">
              ${[
                ['present', 'P'],
                ['absent', 'A'],
                ['late', 'L'],
                ['excused', 'E']
              ].map(([status, letter]) => `
                <button
                  class="status-btn ${
                    chosen[student.id] === status
                      ? `selected ${status}`
                      : ''
                  }"
                  data-student="${student.id}"
                  data-status="${status}"
                  aria-pressed="${chosen[student.id] === status}"
                  title="${status}">
                  ${letter}
                  <span class="status-word">
                    ${status[0].toUpperCase() + status.slice(1)}
                  </span>
                </button>
              `).join('')}
            </div>
          </article>
        `).join('')
      : '<div class="panel empty-state">No students found.</div>';

    document.querySelectorAll('[data-student]').forEach(button => {
      button.onclick = () => {
        chosen[button.dataset.student] = button.dataset.status;
        dirty = true;
        window.AttendanceUnsaved = true;
        updateState();
        render();
      };
    });
  }

  classSelect.onchange = () => {
    if (dirty && !confirm('Discard unsaved attendance changes?')) {
      return;
    }
    init();
  };

  dateInput.onchange = () => {
    if (dirty && !confirm('Discard unsaved attendance changes?')) {
      return;
    }
    init();
  };

  searchInput.oninput = render;

  document.getElementById('mark-all').onclick = () => {
    Object.keys(chosen).forEach(id => {
      chosen[id] = 'present';
    });

    dirty = true;
    window.AttendanceUnsaved = true;
    updateState();
    render();
  };

  document.getElementById('clear-marks').onclick = () => {
    if (!confirm('Clear all selected statuses?')) return;

    Object.keys(chosen).forEach(id => {
      chosen[id] = '';
    });

    dirty = true;
    window.AttendanceUnsaved = true;
    updateState();
    render();
  };

  document.getElementById('save-attendance').onclick = () => {
    const data = store.get();
    const date = dateInput.value;
    const classId = classSelect.value;
    const timestamp = new Date().toISOString();

    let saved = 0;

    Object.entries(chosen).forEach(([studentId, status]) => {
      if (!status) return;

      let record = data.attendance.find(item =>
        item.studentId === studentId &&
        item.classId === classId &&
        item.date === date
      );

      if (record) {
        record.status = status;
        record.updatedAt = timestamp;
        record.recordedBy = A.user.teacherId;
      } else {
        data.attendance.push({
          id: `a-${studentId}-${date}`,
          studentId,
          classId,
          date,
          status,
          remarks: '',
          recordedBy: A.user.teacherId,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }

      saved++;
    });

    store.addActivity(
      `Saved attendance for ${classId} (${saved} students)`,
      A.user.name
    );

    store.save();

    dirty = false;
    window.AttendanceUnsaved = false;

    updateState();
    A.toast(`Attendance saved for ${saved} students.`);
    init();
  };

  init();

  window.addEventListener('beforeunload', event => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
});
