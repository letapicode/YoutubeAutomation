FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04
WORKDIR /workspace
COPY scripts/ ./scripts/
RUN chmod +x ./scripts/bootstrap.sh && ./scripts/bootstrap.sh
COPY ytapp/package.json ytapp/package-lock.json ./ytapp/
RUN cd ytapp && npm install --ignore-scripts
RUN cd ytapp/src-tauri && cargo fetch
