/* Integração com o CRM do ecossistema.
   Roda em fase de captura, ANTES do handler original (site.js), que segue
   intacto: valida, abre o WhatsApp e mostra a confirmação. Aqui apenas
   registramos o lead — fire-and-forget, sem afetar a experiência. */
(function () {
  "use strict";
  var form = document.querySelector("#contato form");
  if (!form) return;

  form.addEventListener(
    "submit",
    function () {
      try {
        var hp = form.querySelector('input[name="website"]');
        if (hp && hp.value) return; /* honeypot — não registra spam */

        var nome = form.querySelector("#cf-nome");
        var contato = form.querySelector("#cf-contato");
        var msg = form.querySelector("#cf-msg");
        if (!nome || nome.value.trim().length < 2) return;
        if (!contato || contato.value.trim().length < 5) return;

        var payload = JSON.stringify({
          name: nome.value.trim().slice(0, 60),
          contact: contato.value.trim().slice(0, 80),
          message: msg ? msg.value.trim().slice(0, 600) : "",
          source: "SITE",
          page: location.pathname,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/leads", new Blob([payload], { type: "application/json" }));
        } else {
          fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          });
        }
      } catch (_) {
        /* nunca quebrar o fluxo original do formulário */
      }
    },
    true
  );
})();
