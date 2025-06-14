#!/bin/bash
cd backend
python -m pytest tests/ --cov=. --cov-report=html --cov-report=term
