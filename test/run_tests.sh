#!/bin/bash
cd backend
python -m pytest tests/ -v --tb=short
