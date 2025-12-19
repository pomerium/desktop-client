.PHONY: all
all: npm-install lint package

.PHONY: npm-install
npm-install:
	npm ci

.PHONY: package
package:
	npm run package

.PHONY: lint
lint: lint-actions lint-ui

.PHONY: lint-ui
lint-ui:
	npm run lint

.PHONY: lint-actions
lint-actions:
	find .github/workflows -type f \( -iname \*.yaml -o -iname \*.yml \) \
    | xargs -I {} action-validator --verbose {}
