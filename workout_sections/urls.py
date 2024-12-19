from django.urls import path
from .views import SaveWorkoutAPIView

urlpatterns = [
    path('save-workout-details/', SaveWorkoutAPIView.as_view(), name='save-workout'),
]