ARG NODE_VERSION=22
ARG ALPINE_VERSION=
ARG USER=node
ARG GROUP=${USER}

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

FROM base AS build
WORKDIR /build
COPY . .
RUN npm ci --build-from-resource \
    && npm run build

FROM base AS app
ARG USER
ARG GROUP
WORKDIR /app
COPY --chown=${USER}:${GROUP} --from=build /build/dist ./dist
COPY --chown=${USER}:${GROUP} --from=build /build/node_modules ./node_modules
COPY --chown=${USER}:${GROUP} --from=build /build/package.json ./package.json
COPY --chown=${USER}:${GROUP} --from=build /build/npm-shrinkwrap.json ./npm-shrinkwrap.json
USER ${USER}
RUN npm prune --omit=dev
EXPOSE 3000
CMD ["node", "dist/index.js"]
