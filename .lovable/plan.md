

# Plano Completo: Migrar Estrutura do Backup para o Projeto Atual

## Resumo

Adicionar as tabelas do backup original (caregivers, elderly, medications, medication_reminders, health_records, diary_entries, user_activities), criar paginas e componentes para gerencia-las, e atualizar o trigger `handle_new_user()` para auto-atribuir admin.

---

## Fase 1: Banco de Dados (Migracao SQL)

### 1.1 Novas Tabelas

- **caregivers** - Dados profissionais do cuidador (especialidade, experiencia, disponibilidade, certificacoes, bio, foto). Referencia `profiles.id`.
- **elderly** - Cadastro de idosos vinculados a um cliente (nome, data_nascimento, condicoes_medicas, necessidades_especiais, contato_emergencia). Referencia `profiles.id` como responsavel.
- **medications** - Medicamentos vinculados a um idoso (nome, dosagem, frequencia, horarios, observacoes).
- **medication_reminders** - Lembretes de medicamento (horario, status: pendente/administrado/ignorado).
- **health_records** - Registros de saude do idoso (pressao, temperatura, glicemia, peso, observacoes, data).
- **diary_entries** - Diario de cuidados (entrada de texto do cuidador sobre o dia do idoso, humor, alimentacao, atividades).
- **user_activities** - Log de atividades do sistema (user_id, acao, detalhes, timestamp).

### 1.2 Politicas RLS

Cada tabela tera politicas para:
- Admin: acesso total (leitura, escrita, exclusao)
- Cuidador: leitura/escrita nos idosos que atende (via appointments)
- Cliente: leitura/escrita nos seus proprios idosos e dados vinculados

### 1.3 Atualizar `handle_new_user()`

Alterar a funcao para atribuir automaticamente a role `admin` para os emails `admin@cuidadofacil.com` e `ramos660@hotmail.com`.

---

## Fase 2: Paginas e Componentes

### 2.1 Area do Cliente - Novas abas

- **Meus Idosos**: Listar, cadastrar e editar idosos vinculados ao cliente
- **Medicamentos**: Gerenciar medicamentos de cada idoso
- **Saude**: Visualizar registros de saude (preenchidos pelo cuidador)
- **Diario**: Ler entradas do diario de cuidados

### 2.2 Area do Cuidador - Novas abas

- **Meu Perfil Profissional**: Editar dados de cuidador (especialidade, certificacoes, bio)
- **Idosos Atendidos**: Lista dos idosos dos agendamentos ativos
- **Registros de Saude**: Criar/editar registros de saude dos idosos atendidos
- **Diario**: Escrever entradas de diario sobre os idosos atendidos
- **Lembretes de Medicamento**: Visualizar e marcar medicamentos como administrados

### 2.3 Admin - Melhorias

- **Dashboard**: Substituir dados estaticos por consultas reais ao banco (contagem de usuarios, agendamentos, etc.)
- **Atividades Recentes**: Usar tabela `user_activities` para mostrar log real

---

## Fase 3: Detalhes Tecnicos

### Migracao SQL (executada via ferramenta de migracao)

```text
Tabelas criadas:
  caregivers        -> id (uuid, PK, FK profiles.id), specialty, experience_years, availability, certifications, bio, avatar_url, hourly_rate, active, created_at, updated_at
  elderly           -> id (uuid, PK), responsible_id (FK profiles.id), name, birth_date, medical_conditions, special_needs, emergency_contact, emergency_phone, photo_url, notes, created_at, updated_at
  medications       -> id (uuid, PK), elderly_id (FK elderly.id), name, dosage, frequency, schedule_times (jsonb), start_date, end_date, notes, active, created_at
  medication_reminders -> id (uuid, PK), medication_id (FK medications.id), scheduled_time (timestamptz), status (enum: pending/administered/skipped), administered_by (FK profiles.id nullable), notes, created_at
  health_records    -> id (uuid, PK), elderly_id (FK elderly.id), recorded_by (FK profiles.id), blood_pressure, temperature, blood_sugar, weight, heart_rate, notes, recorded_at, created_at
  diary_entries     -> id (uuid, PK), elderly_id (FK elderly.id), author_id (FK profiles.id), content, mood, meals, activities, created_at
  user_activities   -> id (uuid, PK), user_id (FK profiles.id nullable), action, details, created_at
```

### Arquivos a criar/modificar

- `src/pages/AreaCliente.tsx` - Adicionar abas: Idosos, Medicamentos, Saude, Diario
- `src/pages/AreaCuidador.tsx` - Adicionar abas: Perfil Profissional, Idosos, Saude, Diario, Lembretes
- `src/components/admin/AdminDashboard.tsx` - Consultas reais ao banco
- Novos componentes auxiliares conforme necessario (formularios de idoso, registros de saude, etc.)

### Ordem de implementacao

1. Migracao SQL (todas as tabelas + RLS + trigger update)
2. Tipos serao atualizados automaticamente
3. Componentes da Area do Cliente (idosos e medicamentos primeiro)
4. Componentes da Area do Cuidador (registros de saude e diario)
5. Dashboard admin com dados reais

