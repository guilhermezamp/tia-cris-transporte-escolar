const PHONE = "5511993591031";

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-cache" });
    if (!response.ok) throw new Error("service_unavailable");
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

let coveragePromise;
const loadCoverage = () => {
  if (!coveragePromise) {
    coveragePromise = fetchJson("/cep-coverage.json").then(data => {
      if (!data.ceps || !Array.isArray(data.regions)) throw new Error("service_unavailable");
      return data;
    }).catch(error => { coveragePromise = null; throw error; });
  }
  return coveragePromise;
};
const isCampaign = document.body.dataset.pageType === "transport_2027";
const requestText = (intro) => `${intro}${isCampaign ? " para o ano letivo de 2027, com destino ao Colégio da Polícia Militar — Unidade Penha" : ""}.\n\nBairro ou CEP:\n${isCampaign ? "" : "Instituição de ensino:\n"}Turno (se já definido):\nSérie ou etapa escolar:\nPrevisão de início:`;

const classifyCep = (cep, coverage) => {
  const code = coverage.ceps[cep];
  if (!code) return { category: "denied", serviceRegion: "" };

  const category = code.startsWith("c") ? "confirmed" : "possible";
  const serviceRegion = coverage.regions[Number(code.slice(1))] || "";
  return { category, serviceRegion };
};

const form = document.querySelector("#cep-form");
const input = document.querySelector("#cep-input");
const statusBox = document.querySelector("#cep-status");
const result = document.querySelector("#cep-result");
const resultLabel = document.querySelector("#result-label");
const neighborhood = document.querySelector("#result-neighborhood");
const address = document.querySelector("#result-address");
const resultMessage = document.querySelector("#result-message");
const whatsapp = document.querySelector("#result-whatsapp");
const resultIcon = document.querySelector("#result-icon");
const fallbackWhatsapp = document.querySelector("#cep-fallback-whatsapp");

input.addEventListener("input", event => {
  result.hidden = true;
  fallbackWhatsapp.hidden = true;
  statusBox.textContent = "";
  input.removeAttribute("aria-invalid");
  delete whatsapp.dataset.coverageStatus;
  const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
  event.target.value = digits.length > 5
    ? digits.slice(0, 5) + "-" + digits.slice(5)
    : digits;
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (form.querySelector("button").disabled) return;
  const cep = input.value.replace(/\D/g, "");
  result.hidden = true;
  fallbackWhatsapp.hidden = true;
  statusBox.textContent = "";

  if (cep.length !== 8) {
    input.setAttribute("aria-invalid", "true");
    window.trackSiteEvent?.("cep_invalid");
    statusBox.textContent = "Digite um CEP válido com 8 números.";
    input.focus();
    return;
  }

  const button = form.querySelector("button");
  input.removeAttribute("aria-invalid");
  input.disabled = true;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.querySelector("span").textContent = "Consultando…";
  statusBox.textContent = "Consultando a região…";

  try {
    const [data, coverage] = await Promise.all([
      fetchJson(`https://viacep.com.br/ws/${cep}/json/`),
      loadCoverage()
    ]);
    if (data.erro) throw new Error("CEP não encontrado");

    const { category, serviceRegion } = classifyCep(cep, coverage);
    window.trackSiteEvent?.("cep_result", {
      coverage_status: category
    });
    whatsapp.dataset.coverageStatus = category;
    const fullAddress = [data.logradouro, data.bairro, data.localidade, data.uf]
      .filter(Boolean).join(" — ");

    result.classList.remove("confirmed", "possible", "denied");
    result.classList.add(category);
    neighborhood.textContent = data.bairro || "Bairro não informado";
    address.textContent = fullAddress;

    if (category === "confirmed") {
      resultLabel.textContent = "Região atendida";
      resultIcon.textContent = "✓";
      resultMessage.textContent = `Ótima notícia! Este CEP faz parte da região atendida pela Tia Cris${serviceRegion ? ` (${serviceRegion})` : ""}. Fale pelo WhatsApp, de segunda a sexta, das 9h às 19h, para confirmar os detalhes da rota.`;
      whatsapp.textContent = isCampaign ? "Pedir orçamento para 2027" : "Pedir orçamento pelo WhatsApp";
      whatsapp.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(
        requestText("Olá, Tia Cris! Consultei a cobertura no site e gostaria de pedir um orçamento")
      )}`;
      whatsapp.hidden = false;
    } else if (category === "possible") {
      resultLabel.textContent = "Atendimento sob consulta";
      resultIcon.textContent = "!";
      resultMessage.textContent = `Este CEP está sob consulta${serviceRegion ? ` na região de ${serviceRegion}` : ""}. O atendimento depende do endereço, horário e disponibilidade da rota. Consulte a Tia Cris pelo WhatsApp.`;
      whatsapp.textContent = "Consultar disponibilidade no WhatsApp";
      whatsapp.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(
        requestText("Olá, Tia Cris! Minha região está sob consulta e gostaria de verificar a disponibilidade")
      )}`;
      whatsapp.hidden = false;
    } else {
      resultLabel.textContent = "Região não atendida";
      resultIcon.textContent = "×";
      resultMessage.textContent = "Infelizmente, no momento a Tia Cris não realiza atendimento neste CEP. Agradecemos seu interesse e a consulta.";
      whatsapp.hidden = true;
      whatsapp.removeAttribute("href");
    }

    statusBox.textContent = "";
    result.hidden = false;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    window.trackSiteEvent?.("cep_error", {
      error_type: error.message === "CEP não encontrado" ? "not_found" : "service_unavailable"
    });
    statusBox.textContent = error.message === "CEP não encontrado"
      ? "CEP não encontrado. Confira os números e tente novamente."
      : "Não foi possível consultar agora. Você pode tentar novamente ou consultar diretamente pelo WhatsApp.";
    fallbackWhatsapp.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(requestText("Olá, Tia Cris! Não consegui consultar o CEP e gostaria de verificar uma rota"))}`;
    fallbackWhatsapp.hidden = false;
  } finally {
    input.disabled = false;
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.querySelector("span").textContent = "Consultar";
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();
