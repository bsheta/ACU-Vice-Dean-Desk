(function () {
  'use strict';
  function byId(id) { return document.getElementById(id); }

  var days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var dateInput = byId('view-date');
  var examDate = byId('exam-date');
  var panels = document.querySelectorAll('[data-panel]');
  var clock = byId('clock');
  var cairoDate = new Intl.DateTimeFormat('en-CA', {timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit'});
  var cairoTime = new Intl.DateTimeFormat('en-GB', {timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit'});

  function today() { return cairoDate.format(new Date()); }
  function weekday(iso) { return new Date(iso + 'T12:00:00Z').getUTCDay(); }
  function dateLabel(iso) { return days[weekday(iso)] + ' · ' + iso.split('-').reverse().join('/'); }
  function clockLabel(minutes) {
    return ('0' + Math.floor(minutes / 60)).slice(-2) + ':' + ('0' + minutes % 60).slice(-2);
  }
  function windowLabel(start, end) { return clockLabel(start) + ' – ' + clockLabel(end); }

  function showPanel() {
    var requested = window.location.hash.slice(1);
    var active = /^(rooms|teaching|exams|desk)$/.test(requested) ? requested : 'teaching';
    for (var i = 0; i < panels.length; i++) {
      var link = panels[i];
      var id = link.getAttribute('data-panel');
      var selected = id === active;
      byId(id).hidden = !selected;
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }

  function renderTable(id, rows, directions) {
    var fragment = document.createDocumentFragment();
    rows.forEach(function (values) {
      var row = document.createElement('tr');
      values.forEach(function (value, index) {
        var cell = row.insertCell(-1);
        cell.dir = directions[index] || 'auto';
        cell.textContent = value;
      });
      fragment.appendChild(row);
    });
    var target = byId(id);
    target.textContent = '';
    target.appendChild(fragment);
  }

  function matches(values, input) {
    return values.join(' ').toLowerCase().indexOf(byId(input).value.trim().toLowerCase()) >= 0;
  }

  function renderLessons() {
    var rows = operations.lessons.filter(function (row) {
      return row[0] === weekday(dateInput.value) && matches([row[3], row[4]], 'lesson-search');
    }).map(function (row) {
      return [windowLabel(row[1], row[2]), row[4], row[3], operations.rooms[row[3]][0]];
    });
    renderTable('lesson-rows', rows, ['ltr', 'ltr', 'ltr']);
    byId('lesson-count').textContent = rows.length ? rows.length + ' بند تدريس مطابق للعرض' : 'لا توجد بنود تدريس مطابقة في السجل.';
  }

  function renderRooms() {
    var iso = dateInput.value;
    var day = weekday(iso);
    var period = byId('room-period').value.split(',').map(Number);
    var reserved = {};
    function block(room, start, end) {
      if (start < period[1] && end > period[0]) reserved[room] = true;
    }
    operations.lessons.forEach(function (row) { if (row[0] === day) block(row[3], row[1], row[2]); });
    operations.busy.forEach(function (row) { if (row[0] === day) block(row[1], row[2], row[3]); });
    operations.exams.forEach(function (row) { if (row[0] === iso) block(row[3], row[1], row[2]); });

    var target = byId('room-results');
    target.textContent = '';
    var available = Object.keys(operations.rooms).sort().filter(function (room) { return !reserved[room]; });
    available.forEach(function (room) {
      var data = operations.rooms[room];
      var card = document.createElement('article');
      card.className = 'room-card';
      var heading = document.createElement('h3');
      heading.dir = 'ltr';
      heading.textContent = room;
      var detail = document.createElement('p');
      detail.textContent = data[0] + (data[1] ? ' · السعة ' + data[1] : '');
      card.appendChild(heading);
      card.appendChild(detail);
      target.appendChild(card);
    });
    byId('room-count').textContent = available.length ? available.length + ' قاعة أو معمل بلا حجز ظاهر للفترة المختارة' : 'لا توجد قاعات بلا حجز ظاهر للفترة المختارة.';
  }

  var examDays = {};
  operations.exams.forEach(function (row) {
    if (!examDays[row[0]]) examDate.add(new Option(dateLabel(row[0]), row[0]));
    examDays[row[0]] = true;
  });
  function renderExams() {
    var iso = dateInput.value;
    examDate.value = examDays[iso] ? iso : '';
    var rows = operations.exams.filter(function (row) {
      return row[0] === iso && matches(row.slice(3), 'exam-search');
    }).map(function (row) {
      return [windowLabel(row[1], row[2]), row[4] + ' · ' + row[5], row[3], row[6] || 'لم تتأكد الأسماء من كشف المراقبة'];
    });
    renderTable('exam-rows', rows, ['ltr', 'ltr', 'ltr']);
    byId('result-count').textContent = rows.length ? rows.length + ' بند امتحان بالقاعة' :
      examDays[iso] ? 'لا توجد امتحانات تطابق البحث.' : 'لا توجد امتحانات في المصدر لهذا التاريخ.';
  }

  function renderDay() {
    if (!dateInput.value) dateInput.value = today();
    byId('day-label').textContent = dateLabel(dateInput.value);
    renderLessons();
    renderRooms();
    renderExams();
  }
  function showToday() { dateInput.value = today(); renderDay(); }
  function updateClock() { clock.textContent = cairoTime.format(new Date()); }

  window.addEventListener('hashchange', showPanel);
  dateInput.addEventListener('change', renderDay);
  byId('today').addEventListener('click', showToday);
  byId('lesson-search').addEventListener('input', renderLessons);
  byId('room-period').addEventListener('change', renderRooms);
  byId('exam-search').addEventListener('input', renderExams);
  examDate.addEventListener('change', function () {
    if (examDate.value) { dateInput.value = examDate.value; renderDay(); }
  });
  byId('touch').addEventListener('click', function () { byId('touch-result').textContent = 'تم تسجيل اللمسة'; });
  showToday();
  showPanel();
  updateClock();
  window.setInterval(updateClock, 1000);
}());
