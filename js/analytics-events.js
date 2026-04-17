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

  // Aguarda o Umami estar disponível
  function waitUmami(cb, tries) {
    tries = tries || 0;
    if (window.umami && typeof window.umami.track === 'function') {
      cb();
    } else if (tries < 20) {
      setTimeout(function () { waitUmami(cb, tries + 1); }, 300);
    }
  }

  function track(event, data) {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(event, data || {});
    }
  }

  waitUmami(function () {

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

  }); // fim waitUmami

})();
