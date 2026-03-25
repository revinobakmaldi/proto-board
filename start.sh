#!/bin/bash
cd /root/proto-board/backend && venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8013
