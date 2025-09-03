SHELL := /bin/bash
LOGDIR := logs
PIDDIR := .pids
REDIS_URL ?= redis://localhost:6379

# ----- EDIT THESE PATHS + ENVS -----
ROOT := $(abspath .)

GATEWAY_DIR := $(ROOT)/gateway-fast
GATEWAY_ENV := resume-agent-gateway-fast

TRANS_DIR   := $(ROOT)/services/transcription
TRANS_ENV   := transcription

PERS_DIR    := $(ROOT)/services/personality
PERS_ENV    := personality

WORKER_DIR  := $(ROOT)/gateway-fast
WORKER_ENV  := resume-agent-gateway-fast
# -----------------------------------

.PHONY: init start-gateway start-transcription start-personality start-worker start-all \
        stop-gateway stop-transcription stop-personality stop-worker stop-all ps logs \
        dashboard up kill-dashboard dry

init:
	@mkdir -p $(LOGDIR) $(PIDDIR)

# -------- START (background; survives SSH logout) --------
start-gateway: init
	@echo "Starting gateway-fast…"
	@nohup conda run -n $(GATEWAY_ENV) --no-capture-output bash -lc "cd '$(GATEWAY_DIR)' && PYTHONUNBUFFERED=1 python run.py" \
	  > $(LOGDIR)/gateway.out 2>&1 & echo $$! > $(PIDDIR)/gateway.pid

start-transcription: init
	@echo "Starting transcription…"
	@nohup conda run -n $(TRANS_ENV) --no-capture-output bash -lc "cd '$(TRANS_DIR)' && PYTHONUNBUFFERED=1 python run.py" \
	  > $(LOGDIR)/transcription.out 2>&1 & echo $$! > $(PIDDIR)/transcription.pid

start-personality: init
	@echo "Starting personality…"
	@nohup conda run -n $(PERS_ENV) --no-capture-output bash -lc "cd '$(PERS_DIR)' && PYTHONUNBUFFERED=1 python run.py" \
	  > $(LOGDIR)/personality.out 2>&1 & echo $$! > $(PIDDIR)/personality.pid

start-worker: init
	@echo "Starting redis worker…"
	@nohup conda run -n $(WORKER_ENV) --no-capture-output bash -lc "cd '$(WORKER_DIR)' && rq worker --url $(REDIS_URL) default" \
	  > $(LOGDIR)/worker.out 2>&1 & echo $$! > $(PIDDIR)/worker.pid

start-all: start-gateway start-transcription start-personality start-worker
	@echo "All services started."

# -------- STOP (by saved PID) --------
stop-gateway:
	@[ -f $(PIDDIR)/gateway.pid ] && kill $$(cat $(PIDDIR)/gateway.pid) 2>/dev/null || true
	@rm -f $(PIDDIR)/gateway.pid

stop-transcription:
	@[ -f $(PIDDIR)/transcription.pid ] && kill $$(cat $(PIDDIR)/transcription.pid) 2>/dev/null || true
	@rm -f $(PIDDIR)/transcription.pid

stop-personality:
	@[ -f $(PIDDIR)/personality.pid ] && kill $$(cat $(PIDDIR)/personality.pid) 2>/dev/null || true
	@rm -f $(PIDDIR)/personality.pid

stop-worker:
	@[ -f $(PIDDIR)/worker.pid ] && kill $$(cat $(PIDDIR)/worker.pid) 2>/dev/null || true
	@rm -f $(PIDDIR)/worker.pid

stop-all: stop-gateway stop-transcription stop-personality stop-worker
	@echo "All services stopped."

# -------- Status / Logs --------
ps:
	@echo "Listening ports (common):"; \
	 (lsof -i:5000 -sTCP:LISTEN || true); \
	 (lsof -i:5001 -sTCP:LISTEN || true); \
	 (lsof -i:5002 -sTCP:LISTEN || true); \
	 echo; echo "RQ worker:"; pgrep -af "rq worker" || echo "not running"

logs:
	@echo "Tailing logs (Ctrl-C to stop; services keep running)…"
	@touch $(LOGDIR)/gateway.out $(LOGDIR)/transcription.out $(LOGDIR)/personality.out $(LOGDIR)/worker.out
	@tail -n +1 -F $(LOGDIR)/gateway.out $(LOGDIR)/transcription.out $(LOGDIR)/personality.out $(LOGDIR)/worker.out

# -------- Dry-run (show commands without executing) --------
dry:
	@$(MAKE) -n start-all

# ===== tmux / tmuxp dashboard =====
TMUX_SESSION := logs
GATEWAY_LOG := $(LOGDIR)/gateway.out
TRANS_LOG   := $(LOGDIR)/transcription.out
PERS_LOG    := $(LOGDIR)/personality.out
WORKER_LOG  := $(LOGDIR)/worker.out

# One-shot: start services then open quad-panel log view
up: start-all dashboard

# Open a 2x2 tmux log dashboard.
# Prefer tmuxp if installed; otherwise fall back to plain tmux commands.
dashboard:
	@mkdir -p $(LOGDIR)
	@touch $(GATEWAY_LOG) $(TRANS_LOG) $(PERS_LOG) $(WORKER_LOG)
	@if command -v tmuxp >/dev/null 2>&1; then \
		echo "Using tmuxp…"; \
		printf "%s\n" \
		  "session_name: $(TMUX_SESSION)" \
		  "windows:" \
		  "  - window_name: services" \
		  "    layout: tiled" \
		  "    panes:" \
		  "      - tail -f $(GATEWAY_LOG)" \
		  "      - tail -f $(TRANS_LOG)" \
		  "      - tail -f $(PERS_LOG)" \
		  "      - tail -f $(WORKER_LOG)" \
		  > .tmuxp.yml; \
		tmuxp load .tmuxp.yml; \
	else \
		echo "tmuxp not found; using plain tmux"; \
		( tmux has-session -t $(TMUX_SESSION) 2>/dev/null && tmux kill-session -t $(TMUX_SESSION) ) || true; \
		tmux new-session -d -s $(TMUX_SESSION) "tail -f $(GATEWAY_LOG)"; \
		tmux split-window -h "tail -f $(TRANS_LOG)"; \
		tmux split-window -v "tail -f $(PERS_LOG)"; \
		tmux select-pane -L; \
		tmux split-window -v "tail -f $(WORKER_LOG)"; \
		tmux select-layout tiled; \
		tmux attach -t $(TMUX_SESSION); \
	fi

# Close the dashboard session (does NOT stop your services)
kill-dashboard:
	@tmux kill-session -t $(TMUX_SESSION) 2>/dev/null || true
