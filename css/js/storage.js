
/* Demo-only data layer.
   LocalStorage is not secure storage. */
(function () {
  const KEY = 'highschoolAttendanceDemo_v1';
  const today = new Date().toISOString().slice(0, 10);

  const users = [
    {
      id: 'u-owner',
      username: 'owner',
      password: 'demo123',
      name: 'School Owner',
      role: 'owner'
    },
    {
      id: 'u-teacher',
      username: 'teacher',
      password: 'demo123',
      name: 'bekele amare',
      role: 'teacher',
      teacherId: 't-01'
    },
    {
      id: 'u-student',
      username: 'student',
      password: 'demo123',
      name: 'Samuel Tesfaye',
      role: 'student',
      studentId: 's-001'
    }
  ];

  const students = [
    ['s-001', 'Samuel Tesfaye', 9, 'A'],
    ['s-002', 'Hana Alemu', 9, 'A'],
    ['s-003', 'Dawit Kebede', 9, 'A'],
    ['s-004', 'Mekdes Girma', 9, 'B'],
    ['s-005', 'Nahom Tadesse', 9, 'B'],
    ['s-006', 'Liya Abebe', 10, 'A'],
    ['s-007', 'Yonas Worku', 10, 'A'],
    ['s-008', 'Selamawit Fikru', 10, 'B'],
    ['s-009', 'Bereket Mulu', 10, 'B'],
    ['s-010', 'Eden Haile', 11, 'A'],
    ['s-011', 'Michael Solomon', 11, 'A'],
    ['s-012', 'Ruth Getachew', 11, 'B'],
    ['s-013', 'Abel Demissie', 11, 'B'],
    ['s-014', 'Martha Girma', 12, 'A'],
    ['s-015', 'Robel Assefa', 12, 'A'],
    ['s-016', 'Tigist Bekele', 12, 'B'],
    ['s-017', 'Henok Daniel', 12, 'B']
  ].map(([id, name, grade, section]) => ({
    id,
    name,
    grade,
    section,
    email: '',
    status: 'active'
  }));

  const teachers = [
    {
      id: 't-01',
      name: 'bekele amare',
      username: 'teacher',
      subjects: 'Mathematics, Physics',
      classes: ['9-A', '10-A', '11-A', '12-A']
    }
  ];

  const classes = [9, 10, 11, 12].flatMap(grade =>
    ['A', 'B'].map(section => ({
      id: `${grade}-${section}`,
      grade,
      section,
      name: `Grade ${grade} · Section ${section}`,
      teacherId: 't-01'
    }))
  );

  function seed() {
    const records = [];
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().slice(0, 10));
    }

    students.forEach((student, studentIndex) => {
      dates.forEach((date, dayIndex) => {
        if (dayIndex === 0 && studentIndex % 6 === 0) return;

        const n = (studentIndex * 7 + dayIndex * 3) % 23;

        records.push({
          id: `a-${student.id}-${date}`,
          studentId: student.id,
          classId: `${student.grade}-${student.section}`,
          date,
          status:
            n < 17 ? 'present' :
            n < 19 ? 'late' :
            n < 21 ? 'absent' : 'excused',
          remarks: '',
          recordedBy: 't-01',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    });

    return {
      users,
      students,
      teachers,
      classes,
      attendance: records,
      settings: {
        schoolName: ' G/Abafransua HighSchool',
        academicYear: '2026/2027',
        term: 'Semester 1'
      },
      activity: []
    };
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);

      if (!raw) return seed();

      const saved = JSON.parse(raw);

      if (
        !saved ||
        !Array.isArray(saved.students) ||
        !Array.isArray(saved.attendance)
      ) {
        return seed();
      }

      return saved;
    } catch (error) {
      return seed();
    }
  }

  let data = read();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  function get() {
    return data;
  }

  function reset() {
    data = seed();
    save();
  }

  function addActivity(text, user = 'System') {
    data.activity.unshift({
      id: 'log-' + Date.now(),
      text,
      user,
      date: new Date().toISOString()
    });

    data.activity = data.activity.slice(0, 30);
    save();
  }

  window.AttendanceStore = {
    KEY,
    get,
    save,
    reset,
    addActivity,
    today,
    seed
  };

  if (!localStorage.getItem(KEY)) {
    save();
  }
})();
