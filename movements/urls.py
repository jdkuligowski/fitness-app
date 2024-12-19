# urls.py
from django.urls import path
from .views import MovementList

urlpatterns = [
    path('extract-movements/', MovementList.as_view(), name='movement-list'),
]