# Estágio 1: Instalar dependências
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install --omit=dev

# Estágio 2: Copiar código e rodar a aplicação
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "start"]