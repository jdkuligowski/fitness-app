from django.urls import path
from .views import set_expo_token

urlpatterns = [
    path('set_token/', set_expo_token, name='set-expo-token'),
]