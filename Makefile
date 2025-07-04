.PHONY: dev test package verify lint ts rust cli schema

# Use globally installed ts-node if available, otherwise fallback to npx.
TS_NODE := $(shell command -v ts-node >/dev/null 2>&1 && echo ts-node || echo npx ts-node)

verify: schema lint ts rust cli
	@echo "✅  All dev checks passed"

schema:
	$(TS_NODE) --project ytapp/tsconfig.json scripts/generate-schema.ts

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
	$(TS_NODE) --project ytapp/tsconfig.json scripts/generate-schema.ts
	cd ytapp && npm install
	cd ytapp/src-tauri && cargo check
	cd ../.. && $(TS_NODE) ytapp/src/cli.ts --help

test:
	$(TS_NODE) --project ytapp/tsconfig.json scripts/generate-schema.ts
	cd ytapp && npx tsc --noEmit
	fail=0; for f in ytapp/tests/*.ts; do $(TS_NODE) "$$f" || fail=1; done; [ $$fail -eq 0 ]
	cd ytapp/src-tauri && cargo test --all-targets

package:
	./scripts/package.sh
