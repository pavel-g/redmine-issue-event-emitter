FROM node:lts-bullseye AS build
WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:lts-bullseye AS prod

ARG CREATED
ARG REVISION=LOCAL
ARG REF_NAME

RUN sed -i "s/\(CipherString *= *\).*/\1DEFAULT@SECLEVEL=1 /" "/etc/ssl/openssl.cnf"
COPY --from=build ["/build/package.json", "/build/package-lock.json", "/app/"]
COPY --from=build ["/build/client", "/app/client/"]
COPY --from=build ["/build/dist", "/app/dist/"]
COPY --from=build ["/build/node_modules", "/app/node_modules/"]
COPY --from=build ["/build/entrypoint.sh", "/"]

# https://github.com/opencontainers/image-spec/blob/main/annotations.md
LABEL org.opencontainers.image.created=${CREATED}
LABEL org.opencontainers.image.authors="pavel@gnedov.info"
LABEL org.opencontainers.image.url="https://github.com/pavel-g/redmine-issue-event-emitter"
LABEL org.opencontainers.image.documentation="https://github.com/pavel-g/redmine-issue-event-emitter"
LABEL org.opencontainers.image.source="https://github.com/pavel-g/redmine-issue-event-emitter"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.revision=${REVISION}
LABEL org.opencontainers.image.vendor="pavel@gnedov.info"
LABEL org.opencontainers.image.licenses="MIT License"
LABEL org.opencontainers.image.ref.name=${REF_NAME}
LABEL org.opencontainers.image.title="Redmine issue event emitter"
LABEL org.opencontainers.image.description="Redmine issue event emitter"
LABEL org.opencontainers.image.base.name="ghcr.io/pavel-g/redmine-issue-event-emitter:latest"

ENTRYPOINT ["/entrypoint.sh"]
