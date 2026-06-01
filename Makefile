RANGE ?=

.PHONY: api-contract-check

api-contract-check:
	@./scripts/api_contract_guard.sh $(RANGE)
