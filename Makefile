.PHONY: dev test package

# Install dependencies and perform a quick sanity check

dev:
	cd ytapp && npm install && \
	(cd src-tauri && cargo check) && \
	npx ts-node src/cli.ts --help

# Run TypeScript and Rust tests

test:
	cd ytapp && for f in tests/*.ts; do npx ts-node $$f; done && \
	(cd src-tauri && cargo test)

# Build Tauri bundles

package:
	./scripts/package.sh
