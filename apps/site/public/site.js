/* Interatividade do site — JavaScript puro, sem dependências.
   Substitui o React mantendo todos os comportamentos. */
(function () {
  "use strict";

  /* ---------- header: sombra ao rolar ---------- */
  var header = document.querySelector(".header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- menu mobile ---------- */
  var burger = document.querySelector(".burger");
  var menu = document.querySelector(".mobile-menu");
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle("open", open);
      menu.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a") || e.target.closest(".mobile-menu__close")) setMenu(false);
    });
  }

  /* ---------- reveal ao rolar ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    /* garantia: nada fica invisível acima da dobra */
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
      });
    }, 900);
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- contadores (faixa de confiança) ---------- */
  document.querySelectorAll(".trust__item > b").forEach(function (el) {
    var final = el.textContent;
    var m = final.match(/^(\+?)([\d.]+)(\D*)$/);
    if (!m) return;
    var pre = m[1], num = parseInt(m[2].replace(/\./g, ""), 10), suf = m[3];
    var fmt = function (n) { return pre + n.toLocaleString("pt-BR") + suf; };
    var started = false;
    var run = function () {
      if (started) return; started = true;
      var t0 = performance.now(), dur = 1300;
      var tick = function (t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(num * e));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    var seen = function () {
      var r = el.getBoundingClientRect();
      return r.top < (window.innerHeight || 800) * 0.92 && r.bottom > 0;
    };
    if (seen()) { run(); return; }
    var ws = function () { if (seen()) { run(); window.removeEventListener("scroll", ws); } };
    window.addEventListener("scroll", ws, { passive: true });
  });

  /* ---------- FAQ sanfona ---------- */
  var qas = document.querySelectorAll(".faq .qa");
  qas.forEach(function (qa) {
    var btn = qa.querySelector(".qa__q");
    var ans = qa.querySelector(".qa__a");
    if (!btn || !ans) return;
    btn.addEventListener("click", function () {
      var isOpen = btn.classList.contains("open");
      qas.forEach(function (other) {
        var b = other.querySelector(".qa__q"), a = other.querySelector(".qa__a");
        b.classList.remove("open"); b.setAttribute("aria-expanded", "false");
        a.style.maxHeight = "0";
      });
      if (!isOpen) {
        btn.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        ans.style.maxHeight = "800px";
      }
    });
  });

  /* ---------- vídeo (fachada -> iframe) ---------- */
  document.querySelectorAll(".video-facade").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var frame = btn.closest(".video-frame");
      var vid = "7O5reDOPB08";
      var ifr = document.createElement("iframe");
      ifr.src = "https://www.youtube.com/embed/" + vid + "?autoplay=1&rel=0";
      ifr.title = "Anderson V. V. Silva, vídeo";
      ifr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      ifr.allowFullscreen = true;
      frame.innerHTML = "";
      frame.appendChild(ifr);
    });
  });

  /* ---------- formulário de contato ---------- */
  var form = document.querySelector("#contato form");
  if (form) {
    var LIMITS = { nome: 60, contato: 80, msg: 600 };
    var clean = function (v, max) {
      return String(v).replace(/[<>]/g, "").replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, max);
    };
    var msgField = form.querySelector("#cf-msg");
    var counter = form.querySelector(".field__count");
    if (msgField && counter) {
      msgField.addEventListener("input", function () {
        msgField.value = clean(msgField.value, LIMITS.msg);
        counter.textContent = msgField.value.length + "/" + LIMITS.msg;
      });
    }
    var errEl = null;
    var showErr = function (txt) {
      if (!errEl) {
        errEl = document.createElement("p");
        errEl.className = "form__err";
        form.insertBefore(errEl, form.querySelector("button[type=submit]"));
      }
      errEl.textContent = txt;
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (errEl) errEl.textContent = "";
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) return; /* honeypot */
      try {
        var last = +localStorage.getItem("andsilva_last_submit") || 0;
        if (Date.now() - last < 20000) {
          showErr("Você acabou de enviar uma mensagem. Aguarde alguns segundos.");
          return;
        }
      } catch (_) {}
      var nome = clean(form.querySelector("#cf-nome").value, LIMITS.nome).trim();
      var contato = clean(form.querySelector("#cf-contato").value, LIMITS.contato).trim();
      var msg = clean(msgField ? msgField.value : "", LIMITS.msg).trim();
      if (nome.length < 2) { showErr("Por favor, escreva seu nome."); return; }
      if (contato.length < 5) { showErr("Informe um WhatsApp ou e-mail válido pra eu te responder."); return; }
      var pareceEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contato);
      var digitos = (contato.match(/\d/g) || []).length;
      if (!pareceEmail && digitos < 8) { showErr("Informe um e-mail válido ou um WhatsApp com DDD."); return; }
      try { localStorage.setItem("andsilva_last_submit", String(Date.now())); } catch (_) {}
      var texto = "Olá, Anderson! Meu nome é " + nome + ". " +
        (msg || "Gostaria de agendar uma conversa.") + " (Contato: " + contato + ")";
      window.open("https://wa.me/5511992471876?text=" + encodeURIComponent(texto), "_blank", "noopener");
      var ok = document.createElement("div");
      ok.className = "form__ok";
      ok.textContent = "Tudo certo! Abri o WhatsApp com sua mensagem pronta. Em breve a gente conversa. \uD83E\uDDE1";
      form.replaceWith(ok);
    });
  }

  /* ---------- ano do rodapé ---------- */
  var ano = document.getElementById("ano-atual");
  if (ano) ano.textContent = String(new Date().getFullYear());
})();
