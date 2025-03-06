from django.urls import path
from .views import SuggestedStrengthView

urlpatterns = [
    path('all/', SuggestedStrengthView.as_view(), name='suggested-workouts'),
]