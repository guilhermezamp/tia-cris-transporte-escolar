const PHONE = "5511993591031";

const coveragePromise = fetch("cep-coverage.json", { cache: "no-cache" })
  .then(response => {
    if (!response.ok) throw new Error("Base de atendimento indisponível");
    return response.json();
  });

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
  const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
  event.target.value = digits.length > 5
    ? digits.slice(0, 5) + "-" + digits.slice(5)
    : digits;
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const cep = input.value.replace(/\D/g, "");
  result.hidden = true;
  fallbackWhatsapp.hidden = true;
  statusBox.textContent = "";

  if (cep.length !== 8) {
    statusBox.textContent = "Digite um CEP válido com 8 números.";
    input.focus();
    return;
  }

  const button = form.querySelector("button");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.querySelector("span").textContent = "Consultando…";
  statusBox.textContent = "Buscando endereço no ViaCEP…";

  try {
    const [response, coverage] = await Promise.all([
      fetch(`https://viacep.com.br/ws/${cep}/json/`),
      coveragePromise
    ]);
    if (!response.ok) throw new Error("Falha na consulta");
    const data = await response.json();
    if (data.erro) throw new Error("CEP não encontrado");

    const { category, serviceRegion } = classifyCep(cep, coverage);
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
      whatsapp.textContent = "Confirmar detalhes pelo WhatsApp ↗";
      whatsapp.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(
        `Olá, Tia Cris! Consultei o CEP ${input.value}. O endereço é ${fullAddress}. Vi que o CEP está na área atendida e gostaria de confirmar os detalhes da rota.\n\nNome do responsável:\nInstituição de ensino:\nTurno:\nSérie ou etapa escolar:`
      )}`;
      whatsapp.hidden = false;
    } else if (category === "possible") {
      resultLabel.textContent = "Atendimento sob consulta";
      resultIcon.textContent = "!";
      resultMessage.textContent = `Este CEP está sob consulta${serviceRegion ? ` na região de ${serviceRegion}` : ""}. O atendimento depende do endereço, horário e disponibilidade da rota. Consulte a Tia Cris pelo WhatsApp.`;
      whatsapp.textContent = "Consultar disponibilidade no WhatsApp ↗";
      whatsapp.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(
        `Olá, Tia Cris! Consultei o CEP ${input.value}. O endereço é ${fullAddress}. Gostaria de verificar a disponibilidade de atendimento para este CEP.\n\nNome do responsável:\nInstituição de ensino:\nTurno:\nSérie ou etapa escolar:`
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
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    statusBox.textContent = error.message === "CEP não encontrado"
      ? "CEP não encontrado. Confira os números e tente novamente."
      : "Não foi possível consultar agora. Você pode tentar novamente ou consultar diretamente pelo WhatsApp.";
    fallbackWhatsapp.hidden = false;
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.querySelector("span").textContent = "Consultar";
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();