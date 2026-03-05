// ThoughtDump Pro — License key system
// Gumroad product permalinks (update after creating Gumroad products)
var PRODUCT_PERMALINKS = ['thoughtdump-pro', 'pillar-pass'];

var pro = (function() {
  var KEY_STORAGE = 'thoughtdump_license_key';
  var STATUS_STORAGE = 'thoughtdump_pro_status';

  function isActive() {
    return localStorage.getItem(STATUS_STORAGE) === 'active';
  }

  function getKey() {
    return localStorage.getItem(KEY_STORAGE) || '';
  }

  function activate(key, callback) {
    key = key.trim().toUpperCase();
    if (!key) { callback(false, 'Please enter a license key.'); return; }

    var found = false;

    function tryNext(i) {
      if (i >= PRODUCT_PERMALINKS.length) {
        if (!found) callback(false, 'Invalid or expired license key.');
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.gumroad.com/v2/licenses/verify', true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.onload = function() {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data.success && !found) {
            found = true;
            localStorage.setItem(KEY_STORAGE, key);
            localStorage.setItem(STATUS_STORAGE, 'active');
            callback(true, 'Pro unlocked! Welcome to ThoughtDump Pro.');
          } else {
            tryNext(i + 1);
          }
        } catch(e) { tryNext(i + 1); }
      };
      xhr.onerror = function() { tryNext(i + 1); };
      xhr.send('product_permalink=' + encodeURIComponent(PRODUCT_PERMALINKS[i]) + '&license_key=' + encodeURIComponent(key));
    }

    tryNext(0);
  }

  function deactivate() {
    localStorage.removeItem(KEY_STORAGE);
    localStorage.removeItem(STATUS_STORAGE);
  }

  return { isActive: isActive, getKey: getKey, activate: activate, deactivate: deactivate };
})();

// Pro UI overlay
function showProModal(feature) {
  var existing = document.getElementById('pro-modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'pro-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.87);z-index:1000;display:flex;align-items:center;justify-content:center;padding:2rem;';

  modal.innerHTML = '<div style="background:#0e0e1e;border:1px solid #1a1a2e;border-radius:12px;padding:2.5rem;max-width:440px;width:100%;text-align:center;">' +
    '<div style="font-size:0.7rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#a78bfa;margin-bottom:1rem;">ThoughtDump Pro</div>' +
    '<div style="font-size:1.5rem;font-weight:900;letter-spacing:-0.03em;margin-bottom:0.75rem;">unlock ' + (feature || 'this feature') + '</div>' +
    '<p style="color:#5a5a7a;font-size:0.9rem;line-height:1.6;margin-bottom:2rem;">Get unlimited saves, export, and history for $1.99/month — or all Pillar products for $7.99/mo.</p>' +
    '<div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.5rem;">' +
      '<input id="pro-key-input" type="text" placeholder="enter license key..." style="background:#07070f;border:1px solid #1a1a2e;color:#eeeef4;padding:0.85rem 1rem;border-radius:8px;font-size:0.9rem;outline:none;width:100%;text-align:center;letter-spacing:0.05em;" />' +
      '<button onclick="submitProKey()" style="background:#a78bfa;color:#07070f;border:none;padding:0.85rem;border-radius:8px;font-size:0.9rem;font-weight:700;cursor:pointer;width:100%;">activate pro</button>' +
    '</div>' +
    '<div id="pro-msg" style="font-size:0.82rem;color:#5a5a7a;min-height:1.2em;margin-bottom:1.25rem;"></div>' +
    '<div style="display:flex;gap:1rem;justify-content:center;">' +
      '<a href="https://fai1th.gumroad.com" target="_blank" style="font-size:0.82rem;color:#a78bfa;text-decoration:none;">get a key →</a>' +
      '<button onclick="document.getElementById(\'pro-modal\').remove()" style="background:none;border:none;color:#5a5a7a;font-size:0.82rem;cursor:pointer;">maybe later</button>' +
    '</div>' +
  '</div>';

  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
}

function submitProKey() {
  var key = document.getElementById('pro-key-input').value;
  var msg = document.getElementById('pro-msg');
  msg.textContent = 'verifying...';
  pro.activate(key, function(success, message) {
    msg.style.color = success ? '#3dbf8a' : '#e85b5b';
    msg.textContent = message;
    if (success) setTimeout(function() { document.getElementById('pro-modal').remove(); location.reload(); }, 1200);
  });
}

// Show pro badge in nav if active
window.addEventListener('DOMContentLoaded', function() {
  if (pro.isActive()) {
    var nav = document.querySelector('.nav-links');
    if (nav) {
      var badge = document.createElement('span');
      badge.style.cssText = 'font-size:0.65rem;font-weight:700;color:#a78bfa;background:rgba(167,139,250,0.1);padding:0.2rem 0.5rem;border-radius:4px;letter-spacing:0.05em;';
      badge.textContent = 'PRO';
      nav.insertBefore(badge, nav.firstChild);
    }
  }
});
