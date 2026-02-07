

# Plano: Sistema de Autenticacao para CuidadoFacil

## Resumo

Vou implementar um sistema completo de autenticacao com login e cadastro, diferenciando entre **clientes**, **cuidadores** e **admins**. As areas protegidas (Admin, Cuidador e Cliente) so serao acessiveis apos login, com verificacao de perfil.

---

## Arquitetura do Sistema

```text
+-------------------+     +------------------+     +-------------------+
|   Pagina de Auth  |---->|   Lovable Cloud  |---->|  Paginas Protegidas|
|  (Login/Cadastro) |     |   (Autenticacao) |     |  (Admin/Cuidador/  |
+-------------------+     +------------------+     |   Cliente)         |
                                  |               +-------------------+
                                  v
                          +------------------+
                          |  Tabela profiles |
                          |  Tabela user_roles|
                          +------------------+
```

---

## Etapas de Implementacao

### 1. Estrutura do Banco de Dados

Criar as seguintes tabelas:

**Tabela `profiles`** - Dados do perfil do usuario
- `id` (uuid, chave primaria, referencia auth.users)
- `full_name` (texto)
- `phone` (texto)
- `address` (texto)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Enum `app_role`** - Tipos de usuarios
- `admin`
- `cuidador`
- `cliente`

**Tabela `user_roles`** - Papeis dos usuarios (separada por seguranca)
- `id` (uuid, chave primaria)
- `user_id` (uuid, referencia auth.users)
- `role` (app_role)

**Funcao `has_role`** - Verificacao segura de papel

### 2. Pagina de Autenticacao (`/auth`)

Nova pagina com:
- Abas para Login e Cadastro
- Campos: email, senha
- Selecao de tipo (cliente ou cuidador) no cadastro
- Validacao com Zod
- Mensagens de erro amigaveis
- Redirecionamento automatico apos login

### 3. Contexto de Autenticacao (`AuthContext`)

Hook e provider para:
- Gerenciar estado de autenticacao
- Fornecer funcoes de login, logout e cadastro
- Verificar papel do usuario
- Disponibilizar dados do perfil

### 4. Protecao de Rotas

Componente `ProtectedRoute` que:
- Verifica se usuario esta logado
- Verifica se tem o papel correto para a rota
- Redireciona para /auth se nao autorizado

### 5. Atualizacao das Paginas Existentes

- **Admin.tsx**: Proteger com papel `admin`
- **AreaCuidador.tsx**: Proteger com papel `cuidador`
- **AreaCliente.tsx**: Proteger com papel `cliente`
- **Header.tsx**: Mostrar botao de Login/Logout dinamico

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar tabelas profiles, user_roles, funcao has_role |
| `src/pages/Auth.tsx` | Criar pagina de login/cadastro |
| `src/contexts/AuthContext.tsx` | Criar contexto de autenticacao |
| `src/components/ProtectedRoute.tsx` | Criar componente de protecao |
| `src/App.tsx` | Envolver com AuthProvider, adicionar rotas protegidas |
| `src/components/Header.tsx` | Adicionar botao login/logout dinamico |
| `src/pages/Admin.tsx` | Envolver com ProtectedRoute (admin) |
| `src/pages/AreaCuidador.tsx` | Envolver com ProtectedRoute (cuidador) |
| `src/pages/AreaCliente.tsx` | Envolver com ProtectedRoute (cliente) |

---

## Fluxo do Usuario

1. Usuario acessa `/admin`, `/cuidador` ou `/cliente`
2. Se nao logado, e redirecionado para `/auth`
3. Usuario faz login ou cria conta
4. No cadastro, escolhe se e cliente ou cuidador
5. Apos autenticacao, e redirecionado para a area apropriada
6. Se tentar acessar area sem permissao, ve mensagem de acesso negado

---

## Secao Tecnica

### Politicas RLS

```sql
-- Profiles: usuarios so veem/editam seu proprio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- User Roles: usuarios so veem seus proprios papeis
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);
```

### Trigger para Criar Perfil

Automaticamente cria um perfil quando um usuario se cadastra:

```sql
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Funcao has_role (Security Definer)

```sql
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT exists (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

---

## Observacoes Importantes

- Papeis sao armazenados em tabela separada (seguranca)
- Funcao `has_role` usa SECURITY DEFINER para evitar recursao RLS
- Email de confirmacao esta ativo por padrao (pode desativar nas configuracoes se quiser testes rapidos)
- Senhas validadas com minimo 6 caracteres
- Redirecionamento automatico configura `emailRedirectTo` corretamente

