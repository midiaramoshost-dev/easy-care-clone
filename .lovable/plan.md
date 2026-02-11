

# Paridade com Site de Referencia (Exceto Slideshow) + Estrutura Backend

## Resumo

Ajustar todas as secoes da homepage e paginas do projeto para ter paridade exata com o site de referencia `cuidado-facil-landing-44.lovable.app`, **mantendo o slideshow atual intacto**. Tambem criar a estrutura backend completa para suportar planos, agendamentos, avaliacoes e contatos.

---

## 1. Ajustes no Frontend (Homepage)

### 1.1 NewStatsSection
- Alterar valores: "10.000+" para "500+", "24/7" manter, "98%" manter, "4.9" para "5"
- Alterar labels: "Familias Atendidas" para "Familias Atendidas", "Monitoramento Continuo" para "Monitoramento", "Taxa de Satisfacao" para "Satisfacao", "Avaliacao Media" para "Avaliacao"

### 1.2 TrustBadges
- Alterar texto de confianca: "10.000 familias" para "500 familias"
- Trocar nomes de empresas por "Empresa 1" a "Empresa 5" (conforme referencia)
- Manter badges de seguranca (SSL, ISO, LGPD, Uptime) como estao

### 1.3 NewFeaturesSection
- Reduzir de 8 para 6 features, alinhando com a referencia:
  - Seguranca Total, Cuidado Humanizado, Equipe Conectada, Relatorios Inteligentes, Disponivel 24/7, Resultados Comprovados
- Remover: Alertas Personalizados e App Intuitivo
- Atualizar titulo/subtitulo para "Recursos que fazem a diferenca" / "Tecnologia de ponta aliada ao cuidado humano"

### 1.4 TechnologySection
- Atualizar titulo: "Tecnologia que cuida"
- Atualizar descricao para alinhar com referencia
- Manter features (IA, alertas, analise, relatorios)

### 1.5 NewTestimonialsSection
- Trocar depoimentos para os da referencia:
  - Dr. Carlos Mendes (Geriatra - CRM 12345)
  - Ana Beatriz Santos (Filha e Administradora)
  - Enfermeira Marcia Silva (Cuidadora Profissional)
- Atualizar titulo: "Avaliacoes e Depoimentos de Clientes CuidadoFacil"
- Atualizar subtitulo: "Depoimentos reais de profissionais e familias que transformaram o cuidado"

### 1.6 PricingSection
- Manter estrutura atual (ja esta alinhada com referencia)
- Os planos do backend serao carregados dinamicamente (ver secao 2)

### 1.7 NewCTASection
- Atualizar texto: "Comece hoje mesmo"
- Atualizar descricao: "Junte-se a milhares de familias que ja descobriram como cuidar melhor de quem mais amam. Teste gratis por 7 dias."
- Atualizar rodape: "Sem compromisso - Cancele quando quiser - Suporte incluido"

### 1.8 Header
- Quando deslogado, mostrar links: Admin, Area do Cuidador, Area do Cliente, Comecar Agora (como na referencia que mostra todos os links)

---

## 2. Estrutura Backend (Tabelas no Banco de Dados)

### 2.1 Tabela `plans` (Planos de assinatura)
```text
plans
- id (uuid, PK)
- name (text) - "Basico", "Familia", "Profissional"
- price (numeric) - 0, 49, 99
- period (text) - null, "/mes", "/mes"
- description (text)
- features (jsonb) - array de strings
- popular (boolean, default false)
- cta_text (text)
- active (boolean, default true)
- sort_order (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```
RLS: SELECT para todos (publico), INSERT/UPDATE/DELETE apenas para admins.

### 2.2 Tabela `appointments` (Agendamentos)
```text
appointments
- id (uuid, PK)
- client_id (uuid, FK profiles)
- caregiver_id (uuid, FK profiles)
- scheduled_date (date)
- start_time (time)
- end_time (time)
- type (text) - "Cuidado Diario", "Fisioterapia", etc.
- status (text, default 'pending') - pending, confirmed, completed, cancelled
- notes (text, nullable)
- address (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```
RLS: Clientes veem seus proprios, cuidadores veem os atribuidos a eles, admins veem todos.

### 2.3 Tabela `reviews` (Avaliacoes)
```text
reviews
- id (uuid, PK)
- appointment_id (uuid, FK appointments)
- reviewer_id (uuid, FK profiles)
- reviewed_id (uuid, FK profiles)
- rating (integer, 1-5)
- comment (text, nullable)
- created_at (timestamptz)
```
RLS: Reviewer pode inserir, ambas as partes podem ver, admins veem todos.

### 2.4 Tabela `contacts` (Mensagens de contato / "Fale Conosco")
```text
contacts
- id (uuid, PK)
- name (text)
- email (text)
- phone (text, nullable)
- message (text)
- type (text) - "cliente", "cuidador", "geral"
- status (text, default 'new') - new, read, replied
- created_at (timestamptz)
```
RLS: INSERT publico (anonimo), SELECT apenas para admins.

### 2.5 Seed dos Planos
Inserir os 3 planos iniciais (Basico, Familia, Profissional) com os dados atuais do PricingSection.

---

## 3. Integracao Frontend-Backend

### 3.1 PricingSection Dinamico
- Criar hook `usePlans` que busca planos da tabela `plans` ordenados por `sort_order`
- Fallback para dados estaticos caso a query falhe
- Usar `@tanstack/react-query` para cache

### 3.2 Pagina ComecarAgora
- Integrar formulario com tabela `contacts` para salvar leads
- Redirecionar para `/auth` apos envio para criar conta

---

## Secao Tecnica

### Arquivos a Criar
- `src/hooks/usePlans.ts` - Hook para buscar planos

### Arquivos a Modificar
- `src/components/NewStatsSection.tsx` - Ajustar valores
- `src/components/TrustBadges.tsx` - Ajustar texto e empresas
- `src/components/NewFeaturesSection.tsx` - Reduzir para 6 features, atualizar titulos
- `src/components/TechnologySection.tsx` - Atualizar titulo
- `src/components/NewTestimonialsSection.tsx` - Trocar depoimentos
- `src/components/NewCTASection.tsx` - Atualizar textos
- `src/components/PricingSection.tsx` - Integrar com hook usePlans
- `src/components/Header.tsx` - Mostrar links de navegacao para nao-logados
- `src/pages/ComecarAgora.tsx` - Integrar com tabela contacts

### Migracoes SQL
Uma migracao criando: `plans`, `appointments`, `reviews`, `contacts` com RLS policies e dados seed para planos.

### Ordem de Execucao
1. Criar migracao SQL (tabelas + RLS + seed)
2. Criar hook `usePlans`
3. Atualizar componentes da homepage (paralelo)
4. Atualizar Header e ComecarAgora
5. Testar fluxo completo

