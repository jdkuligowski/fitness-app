from django.urls import path
from .views import CompleteMobilityWorkoutAPIView

urlpatterns = [
    path('complete-workout/<int:workout_id>/', CompleteMobilityWorkoutAPIView.as_view(), name='complete-mobility-workout'),
]
