from django.urls import path
from .views import MobilityWorkoutsView

urlpatterns = [
    path('all/', MobilityWorkoutsView.as_view(), name='mobility-workouts'),
]