from django.urls import path
from .views import CompleteHIITWorkoutAPIView

urlpatterns = [
    path('complete-workout/<int:workout_id>/', CompleteHIITWorkoutAPIView.as_view(), name='complete-hiit-workout'),
]
