# --- Estágio 1: Build da Aplicação React ---
FROM node:18-alpine AS build

WORKDIR /app

# Copia os arquivos de dependência e instala
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copia o resto do código da aplicação
COPY . .

# Compila a aplicação para produção
RUN npm run build

# --- Estágio 2: Servidor de Produção com Nginx ---
FROM nginx:1.23-alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d

# Copia os arquivos compilados da nossa aplicação (do estágio de build)
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 80 para o tráfego web
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]