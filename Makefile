STAGE ?=
BRANCH ?=
BASE_SHA ?=
HEAD_SHA ?=HEAD
RANGE ?=

.PHONY: stage-pre stage-post convention-check api-contract-check

stage-pre:
	@if [ -z "$(STAGE)" ]; then echo "Usage: make stage-pre STAGE=S1"; exit 1; fi
	@./scripts/stage_guard.sh pre $(STAGE)

stage-post:
	@if [ -z "$(STAGE)" ]; then echo "Usage: make stage-post STAGE=S1"; exit 1; fi
	@./scripts/stage_guard.sh post $(STAGE)

convention-check:
	@if [ -z "$(BRANCH)" ]; then echo "Usage: make convention-check BRANCH=codex/s1-xxx [BASE_SHA=.. HEAD_SHA=..]"; exit 1; fi
	@./scripts/check_stage_convention.sh "$(BRANCH)" "$(BASE_SHA)" "$(HEAD_SHA)"

api-contract-check:
	@./scripts/api_contract_guard.sh $(RANGE)
