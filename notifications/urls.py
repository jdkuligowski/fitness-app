from django.urls import path
from .views import SetExpoToken

urlpatterns = [
    path('set_token/', SetExpoToken.as_view(), name='set-expo-token'),
]