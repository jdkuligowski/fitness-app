from django.urls import path
from .views import CompleteRunningWorkoutAPIView

urlpatterns = [
    path('complete-workout/<int:workout_id>/', CompleteRunningWorkoutAPIView.as_view(), name='complete-workout'),
]
