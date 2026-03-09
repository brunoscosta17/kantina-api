# Guia de Integração e Testes Funcionais do Pix: Mercado Pago
Este guia documenta como o fluxo de geração e pagamento via Pix da Kantina funciona e qual o passo a passo exato para uma Cantina configurar a sua conta no Mercado Pago e integrá-la ao app.

## 🌟 O Fluxo Funcional (Como foi Arquitetado)

A Kantina possui integração direta e nativa com o **Mercado Pago** para receber as recargas ("top-ups") das carteiras dos alunos sem taxas de intermediários de software (a única taxa descontada é a oficial do Banco Central através do Mercado Pago PJ: 0.99%).

O fluxo arquitetado na nossa API e no App foi:

1. **Ação do Usuário:** O responsável loga no app, vai na carteira do dependente e solicita "Adicionar Saldo" escolhendo o método "Pix". E digita o valor. Exemplo: R$ 10,00.
2. **Kantina API -> Mercado Pago:** O `kantina-app` envia o valor para a nossa API na rota secreta (`/wallets/:id/pix-charge`). Nosso `pix.service.ts` recebe esse pedido, busca as credenciais confidenciais Salvas daquela cantina (Tenant) e atira um POST de Payload Dinâmico para o Mercado Pago criar um Id de Pagamento (`mp_xxxx`). Para burlar a validação severa do MP, nosso backend finge o e-mail do pagador dinamicamente validado e com formato do Google (`kantina.test.XXXXXXXX@gmail.com`).
3. **App Kantina -> Geração QRCode:** O Mercado Pago cria e "Pende" o pagamento de R$ 10,00 no registro deles e devolve na mesma hora a String Gigante (Pix Copia e Cola Payload) e o Base64 do QR Code para a nossa API. A nossa API engole isso, insere na tabela do banco (`WalletTransaction` como `pending`), e mostra a tela bonita de Pix pro usuário. 

   🚨 *(O seu aplicativo local nesse momento pode estar rodando no `localhost:8081`, mas com a API oficial da Vercel/Railway lá no `.env`, essas telas vêm do provedor Original)*
4. **Pagamento (Mágica Ocorre):** O Responsável pega o Bank App Oficial (Nubank etc), escaneia o QRCode ou cola a chave e confirma. A transação acontece na CIP do Banco Central e chega ao Servidor do Mercado Pago. O MP aprova a transada, deduz 1% de taxa deles, e salva os R$ 9,90 no cofre da cantina.
16. **Kantina API -> Recálculo e Liberação:** Nosso `pix-webhook.controller.ts` recebe essa bomba, intercepta, vai no MP checar se o status daquele boleto realmente foi "approved" e se sim, atualiza a transação para `paid` no banco de dados da escola, incrementa a carteira do aluno ANA em **+ 1000 cents (R$ 10,00 reais BRUTOS)** - (o custo financeiro fica por conta da própria empresa operante da Kantina). O webhook então dispara a **Notificação Push/App** nos celulares dos responsáveis e do Operador do Caixa da escola.
17. **App Kantina -> Sucesso em Tempo Real:** Enquanto tudo isso acontece nos fundos, o celular do usuário que está na tela do QR Code faz um *Polling Automático* a cada 5 segundos perguntando à API se a transação `requestId` já mudou para `paid`. Assim que o webhook do passo 6 finaliza, a resposta do Polling reflete "pago" instantaneamente: o Cronômetro some, e um ✅ gigante verde aparece avisando que o saldo foi creditado na mesma hora.
18. **Central de Avisos:** O ícone de sininho na Home do aplicativo recebe um emblema numérico vermelho informando que há uma notificação não lida com o comprovante de pagamento guardado.

---

## 🔑 Como Obter Credenciais de Produção no Mercado Pago

Para cada **NOVA CANTINA** que você vender e incluir no seu software da Kantina Escolar, os diretores dessa cantina precisarão lhe entregar os dois códigos secretos dele (ou você ensinar como ele mesmo configura e digita lá no Painel de *Settings* do App Operacional).

Eis o passo a passo completo oficial que você usará e ensinará:

### Passo 1: Conta Oficial
A Cantina obrigatoriamente precisa ter a Conta deles no site Oficial do Mercado Pago criada, logada, e com o processo de segurança validado KYC (Biometria facial, chaves ativas). 

### Passo 2: O Portal Developers
Logado na conta da Cantina no MP, você deve acessar o Painel Oculto de Integrações de Sofware: 

👉 **`https://www.mercadopago.com.br/developers/panel/applications`**

Ou pesquise "Mercado Pago Developers" > Entre no site > Painel.

### Passo 3: Criando a Aplicação da Kantina Escolas
No painel do Developer:
1. Clique no botão gigante: **CRIAR APLICAÇÃO**.
2. O Mercado vai perguntar qual o Nome: Coloque algo oficial da escola, como `Kantina Escolas API - Nossa Escola`.
3. Selecione qual o objetivo de integração: (Marque Checkout Pagamentos Web/App).
4. Selecione qual plataforma ou tecnologia: Se tiver *Outros* ou *Own Integration / Custom*, escolha essa, pois não é Shopify ou Magento. Em "Produto", marque **Pagamentos Online**.

### Passo 4: Obtendo "O Ouro" (Access Token)
Dentro do cartão dessa nova "Aplicação" que vocês acabaram de criar do nada na página, haverá um menu esquerdo.
1. No menu lateral, clique em **Credenciais de Produção** (Não caia no erro de usar "Credenciais de Teste").
2. Ele vai pedir o Padrão de Indústria (Sua categoria). Marque Educação / Alimentos e Escolas. Aceite os termos.
3. BOOM! Vão aparecer dois códigos mascarados lá. Dê "Exibir" no **`Access Token`** e no **`Public Key`**.
4. Copie o Access Token (Ele é imenso, começa com `APP_USR_XXXXXXXX-XXXXXXX...`). 
5. Esse Token do MP é o que a sua API da nuvem (Railway) vai usar pra se passar pela escola e fazer a geração da cobrança de fundo. 
6. Copie eles, entre no App Mobile da Kantina pelo **Operador da Loja**, vá em **Ajustes > Pix**, Cole esses dois códigos com atenção e clique no botãozão para Validar e "Usar Como Padrão". 

### Passo 5: Engatando a Máquina de Avisos (Webhooks)
Com o aplicativo gerando Pix com as credenciais acima, nós precisamos ensinar o Mercado Pago a "**Avisar seu Software na Nuvem Railway do Brasil quando esse pai de aluno pagar pra gente creditar o saldo sozinho**". 

Lá no mesmo Menu Lateral da Aplicação criada da fase 4, logo embaixo de "Credenciais de Produção" estará o botão mágico:
1. Clique no menu **Notifications** > **Webhooks**.
2. Lá estarão dois simples botõezinhos para você inserir. 
3. Em URL, cole estritamente e exatamente a URL final oficial do App que vai cuidar dessas chamadas:
   👉 **`https://kantina-api-production.up.railway.app/wallets/pix-webhook`**
4. Em qual Tipo de Evento Notificar, o Menu deve mostrar vários quadradinhos para você marcar. Achando a tabela Eventos, Marque apenas **Pagamentos / Payments**.
5. Salve. 

> *Nota técnica:* Sua escola não precisa usar o botão "Teste" de envio fake de evento. O próprio fluxo completo que você já fez será testado rodando e pagando R$ 1 real do celular para confirmar a veridicação oficial na hora.

## Fim! Pode ir lucrar! 🚀
