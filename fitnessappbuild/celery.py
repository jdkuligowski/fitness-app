import os
from celery import Celery
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fitnessappbuild.settings")  # <-- your project name

app = Celery("fitnessapp")  # give it a name, e.g. the project name

# Load config from Django settings, with a prefix
app.config_from_object("django.conf:settings", namespace="CELERY")

# Discover tasks in all registered Django app configs (looks for tasks.py files)
app.autodiscover_tasks()
