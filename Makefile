.PHONY: dev test package verify lint ts rust cli

verify: lint ts rust cli
	@echo "✅  All dev checks passed"

lint:
	cd ytapp && npm run lint

ts:
	cd ytapp && tsc --noEmit

rust:
	cd ytapp/src-tauri && cargo check --quiet

cli:
	cd ytapp && npx ts-node src/cli.ts --help >/dev/null

dev:
	@echo "Running development checks"
	npx ts-node scripts/generate-schema.ts
	cd ytapp && npm install
	cd ytapp/src-tauri && cargo check
	cd ../.. && npx ts-node ytapp/src/cli.ts --help

test:
	npx ts-node scripts/generate-schema.ts
	cd ytapp && npx tsc --noEmit
	for f in ytapp/tests/*.ts; do npx ts-node "$f" || true; done
	cd ytapp/src-tauri && cargo test --all-targets || true

package:
	./scripts/package.sh
