(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  var panels = document.querySelectorAll('[data-panel]');
  function showPanel() {
    var requested = window.location.hash.slice(1);
    var active = /^(teaching|exams|desk)$/.test(requested) ? requested : 'teaching';
    for (var i = 0; i < panels.length; i++) {
      var link = panels[i];
      var id = link.getAttribute('data-panel');
      var selected = id === active;
      byId(id).hidden = !selected;
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }
  window.addEventListener('hashchange', showPanel);
  showPanel();

  var departmentPages = {arc: [1, 2], basic: [3, 4, 5], cbe: [6], ee: [7, 8, 9], me: [10, 11, 12, 13, 14]};
  var department = byId('department');
  var sheet = byId('sheet');
  function showSheet() {
    var n = sheet.value;
    var image = 'assets/timetable-' + (n < 10 ? '0' : '') + n + '.png';
    var label = department.options[department.selectedIndex].text + ' · صفحة ' +
      (sheet.selectedIndex + 1) + ' من ' + sheet.options.length;
    byId('sheet-image').src = image;
    byId('sheet-image').alt = 'جدول ' + label;
    byId('full-sheet').href = image;
    byId('sheet-caption').textContent = label + ' · اضغط على الجدول لفتح الصورة بالحجم الكامل';
  }
  function selectDepartment() {
    var pages = departmentPages[department.value];
    sheet.options.length = 0;
    for (var i = 0; i < pages.length; i++) sheet.add(new Option(i + 1, pages[i]));
    showSheet();
  }
  department.addEventListener('change', selectDepartment);
  sheet.addEventListener('change', showSheet);
  selectDepartment();

  var examDate = byId('exam-date');
  var examSearch = byId('exam-search');
  var examRows = byId('exam-rows');
  var days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  function dateLabel(iso) {
    var parts = iso.split('-');
    var date = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    return days[date.getUTCDay()] + ' ' + parts[2] + '/' + parts[1];
  }

  var previousDate = '';
  for (var i = 0; i < midterm.length; i++) {
    var date = midterm[i][0];
    if (date !== previousDate) examDate.add(new Option(dateLabel(date), date));
    previousDate = date;
  }
  function renderExams() {
    var term = examSearch.value.toLowerCase().trim();
    var date = examDate.value;
    var rows = document.createDocumentFragment();
    var count = 0;
    for (var i = 0; i < midterm.length; i++) {
      var record = midterm[i];
      if (date && record[0] !== date) continue;
      if ([record[3], record[4], record[5].join(' ')].join(' ').toLowerCase().indexOf(term) < 0) continue;
      var row = document.createElement('tr');
      var labels = [dateLabel(record[0]), record[1] + ' – ' + record[2], record[4], record[5].join('، ')];
      for (var j = 0; j < labels.length; j++) {
        var cell = row.insertCell(-1);
        if (j > 0) cell.dir = 'ltr';
        cell.textContent = labels[j];
        if (j === 2) {
          var code = document.createElement('span');
          code.className = 'course-code';
          code.textContent = record[3];
          cell.insertBefore(code, cell.firstChild);
        }
      }
      rows.appendChild(row);
      count++;
    }
    examRows.textContent = '';
    examRows.appendChild(rows);
    byId('result-count').textContent = count ? 'عدد جلسات الامتحان المعروضة: ' + count : 'لا توجد امتحانات تطابق البحث.';
  }
  examDate.addEventListener('change', renderExams);
  examSearch.addEventListener('input', renderExams);
  renderExams();

  var clock = byId('clock');
  var cairoTime;
  try {
    cairoTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    clock.parentNode.hidden = true;
  }
  function updateClock() { clock.textContent = cairoTime.format(new Date()); }
  if (cairoTime) {
    updateClock();
    window.setInterval(updateClock, 1000);
  }
  byId('touch').addEventListener('click', function () { byId('touch-result').textContent = 'تم تسجيل اللمسة'; });
}());
