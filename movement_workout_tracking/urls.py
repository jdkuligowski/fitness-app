# urls.py
from django.urls import path
from .views import StoreWorkoutPlansView

urlpatterns = [
    path('store-plans/', StoreWorkoutPlansView.as_view(), name='store-plans'),
]