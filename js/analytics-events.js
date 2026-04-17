/**
 * Analytics Events — Agência MOA
 * Script de rastreamento avançado via Umami custom events.
 *
 * Rastreia:
 *  - Profundidade de rolagem (25%, 50%, 75%, 90%)
 *  - Cliques em CTAs e botões
 *  - Cliques no WhatsApp (flutuante e fixo)
 *  - Tempo de engajamento (30s, 60s, 120s)
 *  - Visibilidade de seções (quando entram na viewport)
 *  - Cliques em links externos
 *  - Saída da página com % de scroll atingido
 *
 * Uso: incluir após o script do Umami.
 * Todos os eventos ficam visíveis em Analytics > Events no painel Umami.
 */

(function () {
  'use strict';

  // Envia evento direto para a API do Umami em todos os IDs cadastrados
  // (evita o conflito de window.umami quando há múltiplos scripts na página)
  var UMAMI_HOST = 'https://analytics.agenciamoa.com.br';
  var UMAMI_IDS = []; // preenchido pelo HTML via data-umami-ids

  (function loadIds() {
    var el = document.querySelector('script[data-umami-ids]');
    if (el) {
      UMAMI_IDS = el.getAttribute('data-umami-ids').split(',');
    }
  })();

  function track(event, data) {
    UMAMI_IDS.forEach(function (id) {
      try {
        var payload = {
          website: id,
          hostname: window.location.hostname,
          language: navigator.language,
          referrer: document.referrer,
          screen: window.screen.width + 'x' + window.screen.height,
          title: document.title,
          url: window.location.pathname,
          name: event,
          data: data || {}
        };
        var body = JSON.stringify({ payload: payload, type: 'event' });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(UMAMI_HOST + '/api/send', new Blob([body], { type: 'application/json' }));
        } else {
          fetch(UMAMI_HOST + '/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
        }
      } catch (e) {}
    });
  }

  // Inicia imediatamente (não depende mais de window.umami)
  (function () {

    // ── 1. SCROLL DEPTH ─────────────────────────────────────────
    var scrollMarks = { 25: false, 50: false, 75: false, 90: false };

    function getScrollPercent() {
      var el = document.documentElement;
      var scrollTop = window.scrollY || el.scrollTop;
      var scrollHeight = el.scrollHeight - el.clientHeight;
      return scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
    }

    window.addEventListener('scroll', function () {
      var pct = getScrollPercent();
      [25, 50, 75, 90].forEach(function (mark) {
        if (!scrollMarks[mark] && pct >= mark) {
          scrollMarks[mark] = true;
          track('scroll_depth', { porcentagem: mark + '%' });
        }
      });
    }, { passive: true });

    // ── 2. TEMPO DE ENGAJAMENTO ──────────────────────────────────
    var tempos = [30, 60, 120];
    tempos.forEach(function (seg) {
      setTimeout(function () {
        track('tempo_pagina', { segundos: seg });
      }, seg * 1000);
    });

    // ── 3. CLIQUES EM CTAs E BOTÕES ──────────────────────────────
    document.addEventListener('click', function (e) {
      var el = e.target.closest('a, button');
      if (!el) return;

      var tag = el.tagName.toLowerCase();
      var href = el.getAttribute('href') || '';
      var text = (el.innerText || el.getAttribute('aria-label') || '').trim().substring(0, 60);
      var classes = el.className || '';

      // WhatsApp
      if (href.includes('wa.me') || href.includes('whatsapp')) {
        track('clique_whatsapp', { texto: text, local: getLocal(el) });
        return;
      }

      // Links de email ou telefone
      if (href.startsWith('mailto:')) {
        track('clique_email', { email: href.replace('mailto:', '') });
        return;
      }
      if (href.startsWith('tel:')) {
        track('clique_telefone', { numero: href.replace('tel:', '') });
        return;
      }

      // Links externos
      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        track('link_externo', { url: href, texto: text });
        return;
      }

      // Botões primários / CTAs
      if (classes.includes('btn-primary') || classes.includes('btn-secondary') || classes.includes('nav-cta')) {
        track('clique_cta', { texto: text, href: href, local: getLocal(el) });
        return;
      }

      // Qualquer outro botão
      if (tag === 'button') {
        track('clique_botao', { texto: text });
      }
    });

    // ── 4. VISIBILIDADE DE SEÇÕES ────────────────────────────────
    var sectionsSeen = {};
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id || entry.target.className.split(' ')[0];
          if (id && !sectionsSeen[id]) {
            sectionsSeen[id] = true;
            track('secao_vista', { secao: id });
          }
        }
      });
    }, { threshold: 0.4 });

    document.querySelectorAll('section[id], div[id]').forEach(function (el) {
      sectionObserver.observe(el);
    });

    // ── 5. SAÍDA DA PÁGINA ───────────────────────────────────────
    window.addEventListener('beforeunload', function () {
      var maxScroll = Math.max.apply(null,
        Object.keys(scrollMarks).filter(function (k) { return scrollMarks[k]; }).map(Number)
      );
      track('saida_pagina', {
        scroll_maximo: maxScroll ? maxScroll + '%' : '<25%',
        tempo_segundos: Math.round(performance.now() / 1000)
      });
    });

    // ── HELPER ───────────────────────────────────────────────────
    function getLocal(el) {
      var section = el.closest('section, nav, footer, header, #hero');
      if (!section) return 'desconhecido';
      return section.id || section.tagName.toLowerCase();
    }

  })(); // fim init

})();
