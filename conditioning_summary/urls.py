# urls.py
from django.urls import path
from .views import ConditioningWorkoutsList

urlpatterns = [
    path('all/', ConditioningWorkoutsList.as_view(), name='conditioning-list'),
]