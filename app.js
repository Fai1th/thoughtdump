// ThoughtDump — client-side brain dump organizer
// ES5 only — var, function declarations, no arrow functions

var THEMES = [
  {
    key: 'tasks',
    emoji: '✅',
    label: 'To Do',
    accent: '#4ade80',
    keywords: ['need to','have to','must','should','remember to','don\'t forget','pick up','call','text','reply','send','buy','order','fix','clean','pay','schedule','check','finish','complete','get','grab','do','submit','return','print','book','sign','apply','renew','update','follow up']
  },
  {
    key: 'work',
    emoji: '📋',
    label: 'Work / School',
    accent: '#60a5fa',
    keywords: ['work','job','school','class','homework','assignment','project','meeting','boss','deadline','study','exam','test','grade','teacher','office','email','report','presentation','career','lecture','quiz','period','subject','math','science','history','english','art','gym']
  },
  {
    key: 'feelings',
    emoji: '💭',
    label: 'Feelings',
    accent: '#a78bfa',
    keywords: ['feel','feeling','anxious','anxiety','sad','happy','angry','frustrated','stressed','overwhelmed','excited','scared','nervous','lonely','tired','exhausted','good','bad','weird','numb','empty','hurt','love','hate','miss','worry','afraid','grateful','proud','embarrassed','ashamed','confused','lost','depressed','annoyed','relieved','hopeful','bored']
  },
  {
    key: 'ideas',
    emoji: '💡',
    label: 'Ideas',
    accent: '#fbbf24',
    keywords: ['idea','what if','imagine','maybe','could','build','create','make','start','try','design','plan','concept','think about','wondering','could be','would be','app','game','write','draw','record','what about','how about','pitch','concept','vision','goal','dream','what if we','i want to make','been thinking']
  },
  {
    key: 'people',
    emoji: '👥',
    label: 'People',
    accent: '#f472b6',
    keywords: ['mom','dad','friend','brother','sister','boyfriend','girlfriend','partner','teacher','coach','boss','they','he','she','her','him','we','us','family','group','team','someone','person','people','my friend','talked to','need to tell','should message','wants me to','asked me to','told me']
  },
  {
    key: 'questions',
    emoji: '❓',
    label: 'Questions',
    accent: '#fb923c',
    keywords: ['why','how','what','when','where','who','should i','do i','am i','is it','will it','can i','could i','would it','wonder','not sure','don\'t know','confused about','figure out','?','not sure if','what does','what should','is this','does this']
  }
];

var HEAVY_WORDS = ['anxious','anxiety','depressed','depression','overwhelmed','stressed','exhausted','can\'t','can not','hopeless','worthless','crying','scared','alone','empty','hurt','suicidal','numb','panic','breaking'];

var currentBuckets = null;
var currentTotal = 0;
var checkedItems = {};

// Word counter
document.getElementById('dump-input').addEventListener('input', function() {
  var text = this.value.trim();
  var count = text ? text.split(/\s+/).length : 0;
  document.getElementById('word-count').textContent = count + (count === 1 ? ' word' : ' words');
});

// Ctrl+Enter to process
document.getElementById('dump-input').addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    processDump();
  }
});

function splitIntoThoughts(text) {
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by line breaks, periods, exclamation, question marks, semicolons
  // Also split by " and " and " but " at start of thought boundaries
  var chunks = text.split(/\n+/);
  var thoughts = [];

  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i].trim();
    if (!chunk) continue;

    // Split further on sentence endings
    var parts = chunk.split(/(?<=[.!?;])\s+/);
    if (parts.length > 1) {
      for (var p = 0; p < parts.length; p++) {
        var part = parts[p].trim().replace(/^[.!?;]+/, '');
        if (part.length > 3) thoughts.push(part);
      }
    } else {
      // Try splitting on period/!/?/; + space
      var subs = chunk.split(/[.!?;]+\s*/);
      if (subs.length > 1) {
        for (var s = 0; s < subs.length; s++) {
          var sub = subs[s].trim();
          if (sub.length > 3) thoughts.push(sub);
        }
      } else {
        if (chunk.length > 3) thoughts.push(chunk);
      }
    }
  }

  // Remove duplicates and very short fragments
  var seen = {};
  var clean = [];
  for (var j = 0; j < thoughts.length; j++) {
    var t = thoughts[j].trim();
    if (t.length < 4) continue;
    if (seen[t.toLowerCase()]) continue;
    seen[t.toLowerCase()] = true;
    clean.push(t);
  }

  return clean;
}

function classifyThought(thought) {
  var lower = thought.toLowerCase();
  var scores = {};
  for (var t = 0; t < THEMES.length; t++) {
    var theme = THEMES[t];
    var score = 0;
    for (var k = 0; k < theme.keywords.length; k++) {
      if (lower.indexOf(theme.keywords[k]) !== -1) {
        score += theme.keywords[k].split(' ').length; // multi-word phrases score higher
      }
    }
    scores[theme.key] = score;
  }

  var best = null;
  var bestScore = 0;
  for (var key in scores) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }

  return best;
}

function detectHeavy(text) {
  var lower = text.toLowerCase();
  var count = 0;
  for (var i = 0; i < HEAVY_WORDS.length; i++) {
    if (lower.indexOf(HEAVY_WORDS[i]) !== -1) count++;
  }
  return count >= 2;
}

function isTask(thought) {
  var lower = thought.toLowerCase();
  var taskPhrases = ['need to','have to','must ','should ','remember to','don\'t forget','pick up','call ','text ','reply ','send ','buy ','order ','fix ','clean ','pay ','schedule ','check ','finish ','complete ','get ','do ','submit ','return ','print ','book ','sign ','apply '];
  for (var i = 0; i < taskPhrases.length; i++) {
    if (lower.indexOf(taskPhrases[i]) !== -1) return true;
  }
  return false;
}

function saveDump(text, buckets, total) {
  try {
    var history = JSON.parse(localStorage.getItem('td_history') || '[]');
    history.unshift({
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      text: text.slice(0, 200),
      total: total,
      ts: Date.now()
    });
    if (history.length > 5) history = history.slice(0, 5);
    localStorage.setItem('td_history', JSON.stringify(history));
  } catch(e) {}
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('td_history') || '[]'); } catch(e) { return []; }
}

function renderHistory() {
  var history = loadHistory();
  var el = document.getElementById('history-list');
  if (!el) return;
  if (history.length === 0) {
    el.innerHTML = '<div class="history-empty">No previous dumps yet.</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < history.length; i++) {
    var h = history[i];
    html += '<div class="history-item" onclick="loadDump(' + i + ')">' +
      '<div class="history-meta"><span class="history-date">' + escapeHTML(h.date) + '</span><span class="history-count">' + h.total + ' thoughts</span></div>' +
      '<div class="history-preview">' + escapeHTML(h.text) + (h.text.length >= 200 ? '...' : '') + '</div>' +
      '</div>';
  }
  el.innerHTML = html;
}

function loadDump(i) {
  var history = loadHistory();
  if (!history[i]) return;
  document.getElementById('dump-input').value = history[i].text;
  var count = history[i].text.trim().split(/\s+/).length;
  document.getElementById('word-count').textContent = count + (count === 1 ? ' word' : ' words');
  toggleHistory(false);
}

function toggleHistory(force) {
  var el = document.getElementById('history-panel');
  if (!el) return;
  var show = force !== undefined ? force : el.style.display === 'none';
  el.style.display = show ? '' : 'none';
  if (show) renderHistory();
}

function processDump() {
  var text = document.getElementById('dump-input').value.trim();
  if (!text) {
    document.getElementById('dump-input').focus();
    document.getElementById('dump-input').classList.add('shake');
    setTimeout(function() { document.getElementById('dump-input').classList.remove('shake'); }, 500);
    return;
  }

  var thoughts = splitIntoThoughts(text);
  if (thoughts.length === 0) {
    thoughts = [text]; // treat whole thing as one thought
  }

  var buckets = {};
  for (var t = 0; t < THEMES.length; t++) buckets[THEMES[t].key] = [];
  buckets['other'] = [];

  for (var i = 0; i < thoughts.length; i++) {
    var theme = classifyThought(thoughts[i]);
    if (theme && buckets[theme]) {
      buckets[theme].push(thoughts[i]);
    } else {
      buckets['other'].push(thoughts[i]);
    }
  }

  currentBuckets = buckets;
  currentTotal = thoughts.length;
  checkedItems = {};

  saveDump(text, buckets, thoughts.length);
  renderResult(buckets, thoughts.length, detectHeavy(text));

  document.getElementById('page-dump').style.display = 'none';
  document.getElementById('page-result').style.display = '';
  window.scrollTo(0, 0);
}

function renderResult(buckets, total, heavy) {
  var grid = document.getElementById('cards-grid');
  grid.innerHTML = '';

  // Summary
  var tasksCount = (buckets['tasks'] || []).length;
  var summaryParts = [total + ' thought' + (total === 1 ? '' : 's')];
  if (tasksCount > 0) summaryParts.push(tasksCount + ' action item' + (tasksCount === 1 ? '' : 's'));
  document.getElementById('result-summary').textContent = summaryParts.join(' · ');

  // Heavy mood banner
  var heavyBanner = document.getElementById('heavy-banner');
  if (heavyBanner) heavyBanner.style.display = heavy ? '' : 'none';

  var delay = 0;
  var hasAny = false;

  // Tasks first (highest priority)
  var taskItems = buckets['tasks'] || [];
  if (taskItems.length > 0) {
    hasAny = true;
    grid.appendChild(makeCard('tasks', '✅', 'To Do', taskItems, '#4ade80', delay++, true));
  }

  // Rest of themes
  for (var t = 0; t < THEMES.length; t++) {
    var theme = THEMES[t];
    if (theme.key === 'tasks') continue;
    var items = buckets[theme.key] || [];
    if (items.length === 0) continue;
    hasAny = true;
    grid.appendChild(makeCard(theme.key, theme.emoji, theme.label, items, theme.accent, delay++, false));
  }

  // Everything else
  var other = buckets['other'] || [];
  if (other.length > 0) {
    hasAny = true;
    grid.appendChild(makeCard('other', '📝', 'Everything Else', other, '#888', delay++, false));
  }

  if (!hasAny) {
    var empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="empty-icon">🤷</div><div>Nothing sorted. Try writing more — separate thoughts with new lines or periods.</div>';
    grid.appendChild(empty);
  }
}

function makeCard(key, emoji, label, items, accentColor, delay, checkable) {
  var card = document.createElement('div');
  card.className = 'theme-card';
  card.style.animationDelay = (delay * 0.06) + 's';
  card.style.setProperty('--card-accent', accentColor);

  var headerHTML = '<div class="theme-card-header">' +
    '<div class="theme-card-label"><span class="theme-emoji">' + emoji + '</span>' + label + '</div>' +
    '<span class="theme-card-count">' + items.length + '</span>' +
    '</div>';

  var listHTML = '<ul class="theme-card-items">';
  for (var i = 0; i < items.length; i++) {
    var text = items[i];
    if (text.length > 140) text = text.slice(0, 137) + '...';
    var id = key + '_' + i;
    if (checkable) {
      listHTML += '<li class="task-item" id="item_' + id + '">' +
        '<button class="task-check" onclick="toggleCheck(\'' + id + '\')" aria-label="Mark done">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" stroke-width="1.5"/></svg>' +
        '</button>' +
        '<span class="task-text">' + escapeHTML(text) + '</span>' +
        '</li>';
    } else {
      listHTML += '<li>' + escapeHTML(text) + '</li>';
    }
  }
  listHTML += '</ul>';

  card.innerHTML = headerHTML + listHTML;
  return card;
}

function toggleCheck(id) {
  checkedItems[id] = !checkedItems[id];
  var li = document.getElementById('item_' + id);
  if (!li) return;
  if (checkedItems[id]) {
    li.classList.add('checked');
    li.querySelector('.task-check').innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="3" fill="currentColor" stroke="currentColor" stroke-width="1.5"/><path d="M4 7l2.5 2.5L10 5" stroke="#070710" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  } else {
    li.classList.remove('checked');
    li.querySelector('.task-check').innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" stroke-width="1.5"/></svg>';
  }
}

function exportDump() {
  if (!currentBuckets) return;
  var lines = ['ThoughtDump — ' + new Date().toLocaleDateString(), ''];

  if ((currentBuckets['tasks'] || []).length > 0) {
    lines.push('✅ TO DO');
    var tasks = currentBuckets['tasks'];
    for (var i = 0; i < tasks.length; i++) {
      var checked = checkedItems['tasks_' + i];
      lines.push((checked ? '[x] ' : '[ ] ') + tasks[i]);
    }
    lines.push('');
  }

  for (var t = 0; t < THEMES.length; t++) {
    var theme = THEMES[t];
    if (theme.key === 'tasks') continue;
    var items = currentBuckets[theme.key] || [];
    if (items.length === 0) continue;
    lines.push(theme.emoji + ' ' + theme.label.toUpperCase());
    for (var j = 0; j < items.length; j++) lines.push('• ' + items[j]);
    lines.push('');
  }

  var text = lines.join('\n');
  var blob = new Blob([text], { type: 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'thoughtdump-' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function copyDump() {
  if (!currentBuckets) return;
  var lines = [];
  for (var t = 0; t < THEMES.length; t++) {
    var theme = THEMES[t];
    var items = currentBuckets[theme.key] || [];
    if (items.length === 0) continue;
    lines.push(theme.emoji + ' ' + theme.label);
    for (var j = 0; j < items.length; j++) lines.push('  • ' + items[j]);
    lines.push('');
  }
  var text = lines.join('\n');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  var btn = document.getElementById('copy-btn');
  if (btn) { btn.textContent = 'Copied!'; setTimeout(function() { btn.textContent = 'Copy'; }, 2000); }
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function goBack() {
  document.getElementById('page-result').style.display = 'none';
  document.getElementById('page-dump').style.display = '';
  window.scrollTo(0, 0);
}
