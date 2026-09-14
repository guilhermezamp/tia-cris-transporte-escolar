const PHONE = "5511993591031";
const COVERED = [
  "COHAB I","Cidade Líder","Jardim Brasília","Jardim Eliane","Jardim Fernandes",
  "Jardim Ipanema","Jardim Nossa Senhora do Carmo","Jardim Marília","Jardim Maringá","Jardim Santa Maria",
  "Parque do Carmo","Parque Savoy City"
];

const form = document.querySelector("#cep-form");
const input = document.querySelector("#cep-input");
const statusBox = document.querySelector("#cep-status");
const result = document.querySelector("#cep-result");
const neighborhood = document.querySelector("#result-neighborhood");
const address = document.querySelector("#result-address");
const resultMessage = document.querySelector("#result-message");
const whatsapp = document.querySelector("#result-whatsapp");
const resultIcon = document.querySelector("#result-icon");

const normalize = value => (value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const isCovered = bairro => {
  const searched = normalize(bairro);
  return COVERED.some(item => {
    const listed = normalize(item);
    return searched === listed || searched.includes(listed) || listed.includes(searched);
  });
};

input.addEventListener("input", event => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
  event.target.value = digits.length > 5 ? digits.slice(0, 5) + "-" + digits.slice(5) : digits;
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

    const covered = isCovered(data.bairro);
    const fullAddress = [data.logradouro, data.bairro, data.localidade, data.uf].filter(Boolean).join(" — ");

    neighborhood.textContent = data.bairro || "Bairro não informado";
    address.textContent = fullAddress;
    resultIcon.textContent = covered ? "✓" : "?";
    resultIcon.classList.toggle("attention", !covered);
    resultMessage.textContent = covered
      ? "Este bairro está na área atendida. Fale com a Tia Cris para confirmar endereço, horário e disponibilidade."
      : "Este bairro não aparece na rota principal. Envie o endereço para a Tia Cris verificar se há possibilidade de atendimento.";

    const text = covered
      ? `Olá, Tia Cris! Consultei o CEP ${input.value}. O endereço é ${fullAddress}. Vi que o bairro está na área atendida e gostaria de confirmar a rota.`
      : `Olá, Tia Cris! Consultei o CEP ${input.value}. O endereço é ${fullAddress}. Gostaria de verificar se existe possibilidade de atendimento nessa região.`;

    whatsapp.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
    statusBox.textContent = "";
    result.hidden = false;
    result.scrollIntoView({behavior:"smooth", block:"nearest"});
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