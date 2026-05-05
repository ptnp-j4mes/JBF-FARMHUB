# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM base AS build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN rm -f .env .env.*
RUN npm run build
RUN npm prune --omit=dev

# ---- Runtime ----
FROM base AS final
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0"]
