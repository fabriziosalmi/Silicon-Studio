VENV   := backend/.venv
PYTHON := $(VENV)/bin/python
PIP    := $(VENV)/bin/pip
DEPS   := $(VENV)/.deps
CONSTRAINTS := backend/constraints.txt

.PHONY: setup run test hooks clean

# ── Setup ────────────────────────────────────────────────
# Creates the venv, installs Python + JS deps.
# Re-runs pip only when pyproject.toml changes.

setup: $(DEPS) node_modules

$(DEPS): backend/pyproject.toml $(CONSTRAINTS)
	python3 -m venv $(VENV)
	$(PIP) install -c $(CONSTRAINTS) -e "backend/.[dev]"
	@touch $@

node_modules: package.json
	npm install
	@touch $@

# ── Run ──────────────────────────────────────────────────
# Starts both backend and frontend in dev mode.

run: $(DEPS) node_modules
	npm run dev

# ── Test ─────────────────────────────────────────────────

test: $(DEPS)
	$(PYTHON) backend/scripts/check_constraints_sync.py
	$(PYTHON) backend/scripts/run_pytest_clean.py

hooks:
	bash scripts/install_git_hooks.sh

# ── Clean ────────────────────────────────────────────────

clean:
	rm -rf $(VENV) node_modules dist out
