# urls.py
from django.urls import path
from .views import MovementList, FilteredMovements

urlpatterns = [
    path('extract-movements/', MovementList.as_view(), name='movement-list'),
    path('filtered-movements/', FilteredMovements.as_view(), name='filtered-movement-list'),
]