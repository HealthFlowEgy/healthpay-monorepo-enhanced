# Install dependencies only when needed
FROM docker.io/node:20.1.0-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk add --no-cache openssl

WORKDIR /usr/src/app
COPY . ./
RUN npm install --ignore-scripts
RUN npm install -g @nestjs/cli@10.4.9
RUN npx prisma generate --schema=./libs/prisma/src/prisma/schema.prisma 
RUN nest build hp-fence

# Production image, copy all the files and run nest
FROM docker.io/node:20.1.0-alpine AS runner
RUN apk add --no-cache dumb-init
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/dist/apps/hp-fence ./
COPY --from=deps /usr/src/app/libs/prisma/src/prisma ./prisma
COPY --from=deps /usr/src/app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD npx prisma migrate deploy --schema=./prisma/schema.prisma; dumb-init node main.js
