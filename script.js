const PHONE = "5511993591031";

const COVERAGE = {
  confirmed: [
    "COHAB I", "Cidade Líder", "Jardim Brasília", "Jardim Eliane",
    "Jardim Fernandes", "Jardim Ipanema", "Jardim Nossa Senhora do Carmo",
    "Jardim Marília", "Jardim Maringá", "Jardim Santa Maria",
    "Parque do Carmo", "Parque Savoy City", "Vila Nhocuné",
    "Jardim Samara", "Patriarca", "Vila Guilhermina", "Artur Alvim",
    "Arthur Alvim", "Cidade A. E. Carvalho",
    "Cidade Antônio Estevão de Carvalho", "Itaquera", "Vila Talarico", "Fazenda Aricanduva"
  ],
  possible: [
    "Vila Eutália", "Vila Euthalia",
    "Vila Matilde", "Vila Dalila"
  ]
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

const normalize = value => (value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const matchesList = (bairro, list) => {
  const searched = normalize(bairro);
  return list.some(item => {
    const listed = normalize(item);
    return searched === listed || searched.includes(listed) || listed.includes(searched);
  });
};

const classifyNeighborhood = bairro => {
  if (matchesList(bairro, COVERAGE.confirmed)) return "confirmed";
  if (matchesList(bairro, COVERAGE.possible)) return "possible";
  return "denied";
};

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
  statusBox.textContent = "";

  if (cep.length !== 8) {
    statusBox.textContent = "Digite um CEP válido com 8 números.";
    input.focus();
    return;
  }

  const button = form.querySelector("button");
  button.disabled = true;
  button.querySelector("span").textContent = "Consultando…";
  statusBox.textContent = "Buscando endereço no ViaCEP…";

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error("Falha na consulta");
    const data = await response.json();
    if (data.erro) throw new Error("CEP não encontrado");

    const category = classifyNeighborhood(data.bairro);
    const fullAddress = [data.logradouro, data.bairro, data.localidade, data.uf]
      .filter(Boolean).join(" — ");

    result.classList.remove("confirmed", "possible", "denied");
    result.classList.add(category);
    neighborhood.textContent = data.bairro || "Bairro não informado";
    address.textContent = fullAddress;

    if (category === "confirmed") {
      resultLabel.textContent = "Região atendida";
      resultIcon.textContent = "✓";
      resultMessage.textContent = "Ótima notícia! Este bairro faz parte da área atendida pela Tia Cris. Fale pelo WhatsApp para confirmar os detalhes da rota.";
      whatsapp.textContent = "Confirmar detalhes pelo WhatsApp ↗";
      whatsapp.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(
        `Olá, Tia Cris! Consultei o CEP ${input.value}. O endereço é ${fullAddress}. Vi que o bairro está na área atendida e gostaria de confirmar os detalhes da rota.`
      )}`;
      whatsapp.hidden = false;
    } else if (category === "possible") {
      resultLabel.textContent = "Atendimento sob consulta";
      resultIcon.textContent = "!";
      resultMessage.textContent = "Este bairro pode ser atendido, dependendo do endereço, horário e disponibilidade da rota. Consulte a Tia Cris pelo WhatsApp.";
      whatsapp.textContent = "Consultar disponibilidade no WhatsApp ↗";
      whatsapp.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(
        `Olá, Tia Cris! Consultei o CEP ${input.value}. O endereço é ${fullAddress}. Gostaria de verificar a disponibilidade de atendimento para esta região.`
      )}`;
      whatsapp.hidden = false;
    } else {
      resultLabel.textContent = "Região não atendida";
      resultIcon.textContent = "×";
      resultMessage.textContent = "Infelizmente, no momento a Tia Cris não realiza atendimento neste bairro. Agradecemos seu interesse e a consulta.";
      whatsapp.hidden = true;
      whatsapp.removeAttribute("href");
    }

    statusBox.textContent = "";
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    statusBox.textContent = error.message === "CEP não encontrado"
      ? "CEP não encontrado. Confira os números e tente novamente."
      : "Não foi possível consultar agora. Tente novamente ou fale pelo WhatsApp.";
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Consultar";
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();