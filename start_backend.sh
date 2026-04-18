#!/bin/bash
cd backend && uv run uvicorn app.main:app --reload
