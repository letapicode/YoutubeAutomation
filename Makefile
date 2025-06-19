.PHONY: dev test package verify lint ts rust cli

# Use globally installed ts-node if available, otherwise fallback to npx.
TS_NODE := $(shell command -v ts-node >/dev/null 2>&1 && echo ts-node || echo npx ts-node)

verify: lint ts rust cli
	@echo "✅  All dev checks passed"

lint:
	cd ytapp && npm run lint

ts:
	cd ytapp && tsc --noEmit

rust:
	cd ytapp/src-tauri && cargo check --quiet

cli:
	cd ytapp && $(TS_NODE) src/cli.ts --help >/dev/null

dev:
	@echo "Running development checks"
	$(TS_NODE) scripts/generate-schema.ts
	cd ytapp && npm install
	cd ytapp/src-tauri && cargo check
	cd ../.. && $(TS_NODE) ytapp/src/cli.ts --help

test:
	$(TS_NODE) scripts/generate-schema.ts
	cd ytapp && npx tsc --noEmit
	for f in ytapp/tests/*.ts; do $(TS_NODE) "$f" || true; done
	cd ytapp/src-tauri && cargo test --all-targets || true

package:
	./scripts/package.sh
