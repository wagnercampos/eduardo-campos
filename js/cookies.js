/**
 * Cookie Consent — Agência MOA
 * Aviso de cookies LGPD para sites da MOA.
 *
 * Uso: <script defer src="js/cookies.js"></script>
 * Customização via atributos data-* na tag script:
 *   data-privacy-url  — link para política de privacidade (opcional)
 *   data-accent-color — cor do botão principal (padrão: #ff691d)
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'moa_cookies_consent';

  // Já decidiu antes? Não exibe.
  if (localStorage.getItem(STORAGE_KEY)) return;

  var script = document.currentScript ||
    document.querySelector('script[src*="cookies.js"]');

  var accentColor = (script && script.getAttribute('data-accent-color')) || '#ff691d';
  var privacyUrl  = (script && script.getAttribute('data-privacy-url'))  || null;

  var privacyLink = privacyUrl
    ? ' <a href="' + privacyUrl + '" target="_blank" rel="noopener" style="color:' + accentColor + ';text-decoration:underline;">Política de Privacidade</a>.'
    : '.';

  var css = [
    '#moa-cookie-banner{',
      'position:fixed;bottom:0;left:0;right:0;z-index:99999;',
      'background:#1b1b1b;border-top:2px solid ' + accentColor + ';',
      'font-family:"DM Sans",system-ui,sans-serif;font-size:14px;',
      'color:#f5f5f5;padding:16px 24px;',
      'display:flex;align-items:center;justify-content:space-between;gap:16px;',
      'flex-wrap:wrap;',
      'box-shadow:0 -4px 24px rgba(0,0,0,0.4);',
      'transform:translateY(100%);transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);',
    '}',
    '#moa-cookie-banner.visible{transform:translateY(0);}',
    '#moa-cookie-banner p{margin:0;line-height:1.5;flex:1;min-width:200px;}',
    '#moa-cookie-banner .moa-cookie-btns{display:flex;gap:10px;flex-shrink:0;}',
    '#moa-cookie-accept{',
      'background:' + accentColor + ';color:#1b1b1b;',
      'border:none;border-radius:2px;padding:10px 20px;',
      'font-family:inherit;font-size:13px;font-weight:700;',
      'letter-spacing:0.04em;cursor:pointer;',
      'transition:opacity 0.2s;white-space:nowrap;',
    '}',
    '#moa-cookie-accept:hover{opacity:0.85;}',
    '#moa-cookie-reject{',
      'background:transparent;color:#f5f5f5;',
      'border:1px solid rgba(245,245,245,0.25);border-radius:2px;',
      'padding:10px 16px;font-family:inherit;font-size:13px;',
      'cursor:pointer;transition:border-color 0.2s;white-space:nowrap;',
    '}',
    '#moa-cookie-reject:hover{border-color:rgba(245,245,245,0.6);}',
    '@media(max-width:600px){',
      '#moa-cookie-banner{flex-direction:column;align-items:flex-start;}',
      '#moa-cookie-banner .moa-cookie-btns{width:100%;}',
      '#moa-cookie-accept,#moa-cookie-reject{flex:1;text-align:center;}',
    '}',
  ].join('');

  var html = [
    '<div id="moa-cookie-banner" role="dialog" aria-live="polite" aria-label="Aviso de cookies">',
      '<p>',
        'Usamos cookies para melhorar sua experiência e analisar o desempenho do site, ',
        'conforme a <strong>LGPD</strong>' + privacyLink,
      '</p>',
      '<div class="moa-cookie-btns">',
        '<button id="moa-cookie-reject">Rejeitar</button>',
        '<button id="moa-cookie-accept">Aceitar cookies</button>',
      '</div>',
    '</div>',
  ].join('');

  function inject() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstChild);

    // Anima entrada após um frame
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var banner = document.getElementById('moa-cookie-banner');
        if (banner) banner.classList.add('visible');
      });
    });

    function dismiss(value) {
      localStorage.setItem(STORAGE_KEY, value);
      var banner = document.getElementById('moa-cookie-banner');
      if (!banner) return;
      banner.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
      banner.classList.remove('visible');
      setTimeout(function () { banner.remove(); }, 400);
    }

    document.getElementById('moa-cookie-accept').addEventListener('click', function () {
      dismiss('accepted');
    });
    document.getElementById('moa-cookie-reject').addEventListener('click', function () {
      dismiss('rejected');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();
