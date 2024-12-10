# Usar una imagen base ligera con la versión adecuada de Node.js
FROM node:lts-alpine3.21 AS deps

# Instalar pnpm
RUN npm install -g pnpm

# Instalar libc6-compat si es necesario
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# Build the app with cache dependencies
FROM node:lts-alpine3.21 AS builder

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .  
RUN pnpm build


# Production image, copy all the files and run next
FROM node:lts-alpine3.21 AS runner

# Instalar pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod

COPY --from=builder /app/dist ./dist

CMD [ "node", "dist/main" ]
