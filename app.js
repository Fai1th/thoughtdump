// ThoughtDump — client-side brain dump organizer
// ES5 only — var, function declarations, no arrow functions

var THEMES = [
  {
    key: 'work',
    emoji: '💼',
    label: 'Work / School',
    keywords: ['work','job','school','class','homework','assignment','project','meeting','boss','deadline','study','exam','test','grade','teacher','office','email','report','presentation','task','career']
  },
  {
    key: 'feelings',
    emoji: '💭',
    label: 'Feelings',
    keywords: ['feel','feeling','anxious','anxiety','sad','happy','angry','frustrated','stressed','overwhelmed','excited','scared','nervous','lonely','tired','exhausted','good','bad','weird','numb','empty','hurt','love','hate','miss','worry','afraid','grateful','proud','embarrassed','ashamed','confused','lost']
  },
  {
    key: 'ideas',
    emoji: '💡',
    label: 'Ideas',
    keywords: ['idea','what if','imagine','maybe','could','should','build','create','make','start','try','design','plan','concept','think about','wondering','could be','would be','project','app','game','write','draw','record']
  },
  {
    key: 'tasks',
    emoji: '✅',
    label: 'Tasks',
    keywords: ['need to','have to','must','should','remember to','don\'t forget','pick up','call','text','reply','send','buy','order','fix','clean','pay','schedule','check','finish','complete','get','grab','do','submit']
  },
  {
    key: 'people',
    emoji: '👥',
    label: 'People',
    keywords: ['mom','dad','friend','brother','sister','boyfriend','girlfriend','partner','teacher','coach','boss','they','he','she','her','him','we','us','family','group','team','someone','everybody','nobody','person','people']
  },
  {
    key: 'questions',
    emoji: '❓',
    label: 'Questions',
    keywords: ['why','how','what','when','where','who','should i','do i','am i','is it','will it','can i','could i','would it','wonder','not sure','don\'t know','confused about','figure out','?']
  }
];

// Word counter
document.getElementById('dump-input').addEventListener('input', function() {
  var text = this.value.trim();
  var count = text ? text.split(/\s+/).length : 0;
  document.getElementById('word-count').textContent = count + (count === 1 ? ' word' : ' words');
});

function splitIntoSentences(text) {
  // Split on newlines first, then split each line on sentence endings
  var lines = text.replace(/\r\n/g, '\n').split(/\n+/);
  var sentences = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    // Split line into sentences by . ! ? ; (keep ending char)
    var parts = line.split(/(?=[.!?;])\s+/);
    // If that didn't help, try splitting by punctuation + space
    if (parts.length <= 1) {
      // Try splitting at . ! ? followed by space or end
      var subparts = line.split(/[.!?;]+\s*/);
      for (var j = 0; j < subparts.length; j++) {
        var s = subparts[j].trim();
        if (s.length > 2) sentences.push(s);
      }
    } else {
      for (var k = 0; k < parts.length; k++) {
        var s2 = parts[k].trim();
        if (s2.length > 2) sentences.push(s2);
      }
    }
  }
  // If we got nothing back, treat entire text as one blob and split by comma too
  if (sentences.length === 0) {
    var fallback = text.split(/[.,!?;\n]+/);
    for (var f = 0; f < fallback.length; f++) {
      var sf = fallback[f].trim();
      if (sf.length > 2) sentences.push(sf);
    }
  }
  return sentences;
}

function classifySentence(sentence) {
  var lower = sentence.toLowerCase();
  var scores = {};
  for (var t = 0; t < THEMES.length; t++) {
    var theme = THEMES[t];
    var score = 0;
    for (var k = 0; k < theme.keywords.length; k++) {
      if (lower.indexOf(theme.keywords[k]) !== -1) score++;
    }
    scores[theme.key] = score;
  }

  // Find highest scoring theme
  var best = null;
  var bestScore = 0;
  for (var key in scores) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }

  return best; // null means goes to "everything else"
}

function processDump() {
  var text = document.getElementById('dump-input').value.trim();
  if (!text) {
    alert('type something first — anything.');
    return;
  }

  var sentences = splitIntoSentences(text);
  if (sentences.length === 0) {
    alert('couldn\'t parse any thoughts. try separating them with periods or new lines.');
    return;
  }

  // Group by theme
  var buckets = {};
  for (var t = 0; t < THEMES.length; t++) {
    buckets[THEMES[t].key] = [];
  }
  buckets['other'] = [];

  for (var i = 0; i < sentences.length; i++) {
    var theme = classifySentence(sentences[i]);
    if (theme && buckets[theme]) {
      buckets[theme].push(sentences[i]);
    } else {
      buckets['other'].push(sentences[i]);
    }
  }

  renderCards(buckets, sentences.length);

  document.getElementById('page-dump').style.display = 'none';
  document.getElementById('page-result').style.display = '';
  window.scrollTo(0, 0);
}

function renderCards(buckets, total) {
  var grid = document.getElementById('cards-grid');
  grid.innerHTML = '';

  document.getElementById('result-summary').textContent = total + ' thought' + (total === 1 ? '' : 's') + ' sorted into themes.';

  var hasAny = false;

  for (var t = 0; t < THEMES.length; t++) {
    var theme = THEMES[t];
    var items = buckets[theme.key];
    if (!items || items.length === 0) continue;
    hasAny = true;
    grid.appendChild(makeCard(theme.emoji, theme.label, items, t));
  }

  // "Everything else"
  var other = buckets['other'];
  if (other && other.length > 0) {
    hasAny = true;
    grid.appendChild(makeCard('📝', 'Everything Else', other, THEMES.length));
  }

  if (!hasAny) {
    var empty = document.createElement('div');
    empty.className = 'empty-card';
    empty.textContent = 'couldn\'t group anything. try writing a bit more.';
    grid.appendChild(empty);
  }
}

function makeCard(emoji, label, items, delay) {
  var card = document.createElement('div');
  card.className = 'theme-card';
  card.style.animationDelay = (delay * 0.07) + 's';

  var labelDiv = '<div class="theme-card-label"><span class="theme-card-emoji">' + emoji + '</span>' + label + '</div>';

  var listHTML = '<ul class="theme-card-items">';
  for (var i = 0; i < items.length; i++) {
    var text = items[i];
    // Truncate very long items
    if (text.length > 120) text = text.slice(0, 117) + '...';
    listHTML += '<li>' + escapeHTML(text) + '</li>';
  }
  listHTML += '</ul>';

  card.innerHTML = labelDiv + listHTML;
  return card;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function goBack() {
  document.getElementById('page-result').style.display = 'none';
  document.getElementById('page-dump').style.display = '';
  window.scrollTo(0, 0);
}
