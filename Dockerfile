FROM node:lts-buster AS build
WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:lts-buster AS prod
RUN sed -i "s/\(CipherString *= *\).*/\1DEFAULT@SECLEVEL=1 /" "/etc/ssl/openssl.cnf"
COPY --from=build ["/build/package.json", "/build/package-lock.json", "/app/"]
COPY --from=build ["/build/client", "/app/client/"]
COPY --from=build ["/build/dist", "/app/dist/"]
COPY --from=build ["/build/node_modules", "/app/node_modules/"]
COPY --from=build ["/build/entrypoint.sh", "/"]

# https://github.com/opencontainers/image-spec/blob/main/annotations.md
LABEL org.opencontainers.image.authors="pavel@gnedov.info"
LABEL org.opencontainers.image.url="https://github.com/pavel-g/redmine-issue-event-emitter"
LABEL org.opencontainers.image.documentation="https://github.com/pavel-g/redmine-issue-event-emitter"
LABEL org.opencontainers.image.source="https://github.com/pavel-g/redmine-issue-event-emitter"
LABEL org.opencontainers.image.vendor="pavel@gnedov.info"
LABEL org.opencontainers.image.licenses="MIT License"
LABEL org.opencontainers.image.title="Redmine issue event emitter"

ENTRYPOINT ["/entrypoint.sh"]
