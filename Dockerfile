# ---------- STAGE 1: BUILD ----------
FROM node:18 AS builder
WORKDIR /app

# Manifestos (cache)
COPY package*.json ./

RUN npm ci

# Código e build
COPY . .
RUN npm run build

# ---------- STAGE 2: RUNTIME ----------
FROM node:18
WORKDIR /app

# Variáveis de ambiente serão passadas via -e no docker run (melhor prática para segredos)
ENV PORT=""
ENV DB_HOST=""
ENV DB_PORT=""
ENV DB_NAME=""
ENV DB_USER=""
ENV DB_PASS=""
ENV JWT_SECRET=""
ENV JWT_REFRESH_SECRET=""
ENV JWT_ISS=""
ENV JWT_AUD=""
ENV JWT_ALG=""
ENV ACCESS_TOKEN_TTL=""
ENV REFRESH_TOKEN_TTL=""
ENV BCRYPT_SALT_ROUNDS=""
ENV CORS_ORIGINS=""
ENV LOG_LEVEL=""
ENV API_COMUNICACOES_URL=""

# Prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# Artefatos de build
COPY --from=builder /app/dist ./dist

EXPOSE 7772
CMD ["npm", "start"]

