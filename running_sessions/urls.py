from django.urls import path
from .views import RunningWorkoutsView

urlpatterns = [
    path('all/', RunningWorkoutsView.as_view(), name='running-workouts'),
]