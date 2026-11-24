(() => {
  if (window.trackSiteEvent) return;
  const pageType = document.body?.dataset.pageType || "other";
  const sendEvent = (name, params = {}) => {
    if (typeof window.gtag !== "function") return;
    // Only categorical metadata: never forward a CEP, address or WhatsApp URL.
    const safe = { page_path: window.location.pathname, page_type: pageType };
    for (const key of ["coverage_status", "click_source", "error_type"]) {
      if (typeof params[key] === "string") safe[key] = params[key];
    }
    window.gtag("event", name, safe);
  };

  window.trackSiteEvent = sendEvent;

  const whatsappSource = link => {
    if (link.id === "result-whatsapp") return "cep_result";
    if (link.id === "cep-fallback-whatsapp") return "cep_fallback";
    if (link.classList.contains("floating")) return "floating_button";
    if (link.closest(".topbar")) return "header";
    if (link.closest(".contact-cta")) return "contact_section";
    if (link.closest("footer")) return "footer";
    if (link.closest(".hero") || link.closest(".route-hero")) return "hero";
    return "other";
  };

  document.addEventListener("click", event => {
    const link = event.target.closest?.('a[href*="wa.me/"]');
    if (!link) return;

    sendEvent("whatsapp_click", {
      click_source: whatsappSource(link),
      coverage_status: link.dataset.coverageStatus || "not_consulted"
    });
  });
})();

