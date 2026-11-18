(function () {
  'use strict';
  function byId(id) { return document.getElementById(id); }

  var language = 'ar';
  var days = {
    ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };
  var englishBuildings = {
    'مبنى هندسة': 'Engineering Building',
    'مبنى الفصول والمدرجات': 'Classrooms and Lecture Halls Building',
    'مبنى صيدلة وأسنان': 'Pharmacy and Dentistry Building'
  };
  var languageButtons = document.querySelectorAll('[data-language]');
  var localized = [];
  ['textContent', 'placeholder', 'alt', 'aria-label'].forEach(function (attribute) {
    var key = attribute === 'textContent' ? 'data-en' : 'data-en-' + attribute;
    document.querySelectorAll('[' + key + ']').forEach(function (element) {
      var arabic = attribute === 'textContent' ? element.textContent : element.getAttribute(attribute);
      localized.push({element: element, attribute: attribute, ar: arabic, en: element.getAttribute(key)});
    });
  });

  function translate(arabic, english) { return language === 'en' ? english : arabic; }
  function building(value) { return language === 'en' ? englishBuildings[value] || value : value; }

  function setLanguage(value) {
    language = value === 'en' ? 'en' : 'ar';
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
    localized.forEach(function (entry) {
      if (entry.attribute === 'textContent') entry.element.textContent = entry[language];
      else entry.element.setAttribute(entry.attribute, entry[language]);
    });
    languageButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-language') === language));
    });
    try { localStorage.setItem('acu-desk-language', language); } catch (error) { /* Storage can be disabled. */ }
    Object.keys(examDays).forEach(function (iso, index) { examDate.options[index + 1].text = dateLabel(iso); });
    if (byId('touch-result').textContent) renderTouchResult();
    renderDay();
    updateClock(true);
  }
  var dateInput = byId('view-date');
  var examDate = byId('exam-date');
  var panels = document.querySelectorAll('[data-panel]');
  var clock = byId('clock');
  var cairoDate = new Intl.DateTimeFormat('en-CA', {timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit'});
  var cairoTime = new Intl.DateTimeFormat('en-GB', {timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit'});

  function today(now) { return cairoDate.format(now || new Date()); }
  function weekday(iso) { return new Date(iso + 'T12:00:00Z').getUTCDay(); }
  function dateLabel(iso) { return days[language][weekday(iso)] + ' · ' + iso.split('-').reverse().join('/'); }
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
      return [windowLabel(row[1], row[2]), row[4], row[3], building(operations.rooms[row[3]][0])];
    });
    renderTable('lesson-rows', rows, ['ltr', 'ltr', 'ltr']);
    byId('lesson-count').textContent = rows.length ? rows.length + translate(' بند تدريس مطابق للعرض', rows.length === 1 ? ' matching class' : ' matching classes') : translate('لا توجد بنود تدريس مطابقة في السجل.', 'No matching classes in the schedule.');
  }

  function availableRooms(iso, period) {
    var day = weekday(iso);
    var reserved = {};
    function block(room, start, end) {
      if (start < period[1] && end > period[0]) reserved[room] = true;
    }
    operations.lessons.forEach(function (row) { if (row[0] === day) block(row[3], row[1], row[2]); });
    operations.busy.forEach(function (row) { if (row[0] === day) block(row[1], row[2], row[3]); });
    operations.exams.forEach(function (row) { if (row[0] === iso) block(row[3], row[1], row[2]); });

    return Object.keys(operations.rooms).sort().filter(function (room) { return !reserved[room]; });
  }

  function renderRooms() {
    var target = byId('room-results');
    target.textContent = '';
    var period = byId('room-period').value.split(',').map(Number);
    var available = availableRooms(dateInput.value, period);
    available.forEach(function (room) {
      var data = operations.rooms[room];
      var card = document.createElement('article');
      card.className = 'room-card';
      var heading = document.createElement('h3');
      heading.dir = 'ltr';
      heading.textContent = room;
      var detail = document.createElement('p');
      detail.textContent = building(data[0]) + (data[1] ? translate(' · السعة ', ' · Capacity ') + data[1] : '');
      card.appendChild(heading);
      card.appendChild(detail);
      target.appendChild(card);
    });
    byId('room-count').textContent = available.length ? available.length + translate(' قاعة أو معمل بلا حجز ظاهر للفترة المختارة', available.length === 1 ? ' room or lab without a recorded booking' : ' rooms and labs without a recorded booking') : translate('لا توجد قاعات بلا حجز ظاهر للفترة المختارة.', 'No rooms without a recorded booking for this period.');
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
      return [windowLabel(row[1], row[2]), row[4] + ' · ' + row[5], row[3], row[6] || translate('لم تتأكد الأسماء من كشف المراقبة', 'Invigilators could not be confirmed from the roster')];
    });
    renderTable('exam-rows', rows, ['ltr', 'ltr', 'ltr']);
    byId('result-count').textContent = rows.length ? rows.length + translate(' بند امتحان بالقاعة', rows.length === 1 ? ' exam-room entry' : ' exam-room entries') :
      examDays[iso] ? translate('لا توجد امتحانات تطابق البحث.', 'No exams match your search.') :
      translate('لا توجد امتحانات في المصدر لهذا التاريخ.', 'No exams are listed for this date.');
  }

  function renderDay() {
    if (!dateInput.value) dateInput.value = today();
    byId('day-label').textContent = dateLabel(dateInput.value);
    renderLessons();
    renderRooms();
    renderExams();
  }
  function showToday() { dateInput.value = today(); renderDay(); }
  var lastWidgetMinute = '';
  function renderWidget(id, summary, items) {
    byId(id + '-summary').textContent = summary;
    var list = byId(id);
    list.textContent = '';
    items.slice(0, 3).forEach(function (label) {
      var item = document.createElement('li');
      item.dir = 'auto';
      item.textContent = label;
      list.appendChild(item);
    });
  }

  function renderNow(iso, minute) {
    var day = weekday(iso);
    function isRunning(start, end) { return start <= minute && minute < end; }
    function summary(count, ar, en, single, emptyAr, emptyEn) {
      return count ? count + translate(ar, count === 1 ? single : en) : translate(emptyAr, emptyEn);
    }

    var classes = operations.lessons.filter(function (row) {
      return row[0] === day && isRunning(row[1], row[2]);
    }).map(function (row) { return row[3] + ' · ' + row[4]; });
    var exams = operations.exams.filter(function (row) {
      return row[0] === iso && isRunning(row[1], row[2]);
    }).map(function (row) { return row[3] + ' · ' + row[4] + ' · ' + row[5]; });
    var duringDay = day <= 4 && minute >= 540 && minute < 900;
    var rooms = duringDay ? availableRooms(iso, [minute, minute + 1]) : [];

    renderWidget('now-teaching', summary(classes.length, ' بنود تدريس جارية', ' classes in progress', ' class in progress',
      'لا توجد محاضرات جارية في السجل', 'No classes in progress'), classes);
    renderWidget('now-exams', summary(exams.length, ' قاعات امتحان نشطة', ' active exam-room entries', ' active exam-room entry',
      'لا توجد امتحانات جارية في السجل', 'No exams in progress'), exams);
    renderWidget('now-rooms', duringDay ?
      summary(rooms.length, ' قاعة أو معمل بلا حجز ظاهر', ' rooms or labs with no recorded booking', ' room or lab with no recorded booking',
        'لا تظهر قاعات متاحة الآن', 'No rooms appear available now') :
      translate('خارج أيام أو ساعات التدريس', 'Outside scheduled teaching hours'), rooms);
  }

  function openWidget(event) {
    event.preventDefault();
    var panel = event.currentTarget.getAttribute('data-widget');
    if (panel === 'teaching') byId('lesson-search').value = '';
    if (panel === 'exams') byId('exam-search').value = '';
    showToday();
    window.location.hash = panel;
    showPanel();
    byId(panel).scrollIntoView();
  }

  function updateClock(force) {
    var now = new Date();
    var display = cairoTime.format(now);
    var iso = today(now);
    var key = iso + ' ' + display;
    if (force !== true && key === lastWidgetMinute) return;
    lastWidgetMinute = key;
    clock.textContent = display;
    var parts = display.split(':').map(Number);
    renderNow(iso, parts[0] * 60 + parts[1]);
  }

  window.addEventListener('hashchange', showPanel);
  dateInput.addEventListener('change', renderDay);
  byId('today').addEventListener('click', showToday);
  byId('lesson-search').addEventListener('input', renderLessons);
  byId('room-period').addEventListener('change', renderRooms);
  byId('exam-search').addEventListener('input', renderExams);
  examDate.addEventListener('change', function () {
    if (examDate.value) { dateInput.value = examDate.value; renderDay(); }
  });
  function renderTouchResult() { byId('touch-result').textContent = translate('تم تسجيل اللمسة', 'Touch registered'); }
  byId('touch').addEventListener('click', renderTouchResult);
  languageButtons.forEach(function (button) {
    button.addEventListener('click', function () { setLanguage(button.getAttribute('data-language')); });
  });
  try { language = localStorage.getItem('acu-desk-language'); } catch (error) { /* Storage can be disabled. */ }
  document.querySelectorAll('[data-widget]').forEach(function (link) { link.addEventListener('click', openWidget); });
  setLanguage(language);
  showPanel();
  window.setInterval(updateClock, 1000);
}());
