FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install Node.js LTS
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH=/root/.cargo/bin:$PATH

WORKDIR /workspace
COPY . .
RUN chmod +x scripts/install_tauri_deps.sh scripts/bootstrap.sh && \
    ./scripts/bootstrap.sh
