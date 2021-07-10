FROM node:lts-buster
RUN sed -i "s/\(CipherString *= *\).*/\1DEFAULT@SECLEVEL=1 /" "/etc/ssl/openssl.cnf"
COPY ["package.json", "package-lock.json", "/app/"]
COPY ["client", "/app/client/"]
COPY ["dist", "/app/dist/"]
COPY ["node_modules", "/app/node_modules/"]
COPY ["entrypoint.sh", "/"]
ENTRYPOINT ["/entrypoint.sh"]
