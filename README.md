# Tia Cris Transporte Escolar

Site institucional responsivo da **Tia Cris Transporte Escolar**, com rotas na Penha para estudantes e famílias de toda a comunidade.

## Recursos

- Identidade visual própria com Ducato e iniciais TC
- Informações de experiência, documentação e regiões atendidas
- Consulta automática de CEP pela API pública do ViaCEP
- Comparação do bairro consultado com a área de atendimento
- Encaminhamento personalizado para o WhatsApp
- Layout responsivo e acessível
- SEO técnico com título e descrição local, canonical, dados estruturados, robots.txt e sitemap.xml
- FAQ com informações de atendimento
- Mensagens de WhatsApp preenchidas com os dados necessários para avaliar a rota
- Publicação automática pelo GitHub Pages

## Contato

**Telefone e WhatsApp:** [11 99359-1031](https://wa.me/5511993591031)  
**Horário de atendimento pelo WhatsApp:** das 9h às 19h  
**Faixa escolar:** Educação Infantil ao Ensino Médio

## Publicação

O workflow `.github/workflows/pages.yml` publica o conteúdo da branch `main` no GitHub Pages após cada atualização.

> Serviço independente, sem vínculo institucional com instituições de ensino, a Polícia Militar, a Guarda Civil Metropolitana ou outros órgãos públicos.


## Atualização de 24/11/2026

- Consulta de CEP na página Transporte 2027, com a mesma base de cobertura da inicial.
- Mensagens de orçamento preservam o contexto 2027/Unidade Penha sem inserir automaticamente CEP ou endereço nos links.
- Tratamento de falhas com tempo limite de 10 segundos por requisição e nova tentativa, sem recarregar a página.
- Eventos personalizados incluem `page_type` e `page_path`; WhatsApp inclui `click_source` e `coverage_status`.
- Metadados do sitemap atualizados; canonical e robots preservados.

### Validação

Execute `node tests/site.test.cjs`. No navegador, confira a inicial e a página 2027 com:

| Entrada | Resultado esperado |
| --- | --- |
| 03514-001 | Região atendida, botão de orçamento |
| 03557-000 | Atendimento sob consulta, botão de disponibilidade |
| 01001-000 | Região não atendida, sem botão de confirmação no resultado |
| 123 | Erro de formato, sem consulta externa |

Os CEPs são exemplos públicos da base para testes, sem associação a um cliente. A disponibilidade final continua dependendo da confirmação da Tia Cris.

### Configuração necessária no GA4

Na propriedade G-RCFSHQJ4Z1, cadastrar dimensões de escopo Evento se ainda não existirem:

| Nome sugerido | Parâmetro |
| --- | --- |
| Página do site | page_type |
| Origem do botão WhatsApp | click_source |
| Cobertura do CEP | coverage_status |
| Tipo de erro de CEP | error_type |

`coverage_status`: confirmed = região atendida; possible = sob consulta; denied = fora da área; not_consulted = clique sem resultado de CEP associado. Não representa vaga garantida.

A coleta já envia os parâmetros; sua disponibilização nas explorações depende do cadastro no painel. Um clique no WhatsApp não comprova envio de mensagem, orçamento ou contratação. Não cadastrar nomes, telefones ou endereços como dimensões. Os testes automatizados usam uma função gtag simulada, sem envio ao GA4.

### Links identificados para próximas divulgações

Usar somente nos canais externos; não adicionar UTM aos links internos do site.

- WhatsApp: https://tiacristransporteescolar.com.br/matriculas-2027-transporte-escolar-unidade-penha/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=transporte_2027
- Instagram: https://tiacristransporteescolar.com.br/matriculas-2027-transporte-escolar-unidade-penha/?utm_source=instagram&utm_medium=social&utm_campaign=transporte_2027
- Parceiros: https://tiacristransporteescolar.com.br/matriculas-2027-transporte-escolar-unidade-penha/?utm_source=parceiros&utm_medium=referral&utm_campaign=transporte_2027

As campanhas não foram enviadas automaticamente. Para medir contratos, registrar separadamente a origem, se houve orçamento e se houve contratação, usando um controle privado.
