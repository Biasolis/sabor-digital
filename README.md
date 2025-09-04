# 🚀 App de Delivery (Estilo iFood) - Ambiente de Produção com Docker

Este guia explica como configurar e executar toda a aplicação (**Frontend React + Backend Supabase**) localmente usando **Docker**.

---

## 📦 Pré-requisitos

- **Docker Desktop**: Certifique-se de que o Docker Desktop está instalado e em execução.  
  👉 [Download Docker](https://www.docker.com)

---

## 📂 Estrutura do Projeto

- **docker-compose.yml** → Orquestra todos os serviços (Supabase + Aplicação).
- **Dockerfile** → Define a imagem de produção da aplicação React.
- **nginx.conf** → Configuração do servidor Nginx para servir a aplicação.
- **supabase/migrations/schema.sql** → Scripts para criar e configurar a base de dados local do zero.
- **.env.example** → Modelo de variáveis de ambiente.

---

## 🛠️ Passo a Passo para Executar

### 1️⃣ Preparar os Arquivos de Senhas

No arquivo **docker-compose.yml**, altere os seguintes campos para valores **únicos e seguros**:

- `services.db.environment.POSTGRES_PASSWORD`
- `services.kong.environment.KONG_PG_PASSWORD`
- `services.gotrue.environment.GOTRUE_DB_DATABASE_URL`
- `services.gotrue.environment.GOTRUE_JWT_SECRET`
- `services.realtime.environment.JWT_SECRET`
- `services.postgrest.environment.PGRST_DB_URI`
- `services.postgrest.environment.PGRST_JWT_SECRET`
- `services.storage.environment.DATABASE_URL`
- `services.storage.environment.JWT_SECRET`

⚠️ **Importante:**  
- O valor de `POSTGRES_PASSWORD` deve ser **o mesmo em todos os locais** onde for usado.  
- O mesmo se aplica a `JWT_SECRET`.

---

### 2️⃣ Configurar as Variáveis de Ambiente do Frontend

- Faça uma cópia do arquivo **.env.example** e renomeie para **.env**.  
- **Não altere os valores!**  
  - `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` já estão configurados para a instância local criada pelo Docker.

---

### 3️⃣ Iniciar a Aplicação

No terminal, na raiz do projeto, execute:

```bash
docker-compose up --build -d



-- 7. PASSO MANUAL PÓS-INICIALIZAÇÃO: PROMOVER PRIMEIRO ADMIN
-- ====================================================================================
-- Após iniciar o Docker e registar-se na aplicação com o e-mail de administrador,
-- execute o seguinte comando no SQL Editor para promover o seu utilizador.
-- Substitua 'admin@exemplo.com' pelo e-mail que usou para se registar.

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@exemplo.com';