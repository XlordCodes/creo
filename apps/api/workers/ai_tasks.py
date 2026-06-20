"""DEPRECATED — This module contained a stub generate_ai_analysis task.

The real implementation lives in workers/onboarding_tasks.py and calls
OpenAI GPT-4o via services/ai_analysis.py. The router in
routers/questionnaires.py imports from onboarding_tasks directly.

This file is kept empty to prevent Celery autodiscover from registering
the old stub, which would shadow the real task.
"""
