from django.urls import path
from .views import MovementStatsAPIView

urlpatterns = [
    path('', MovementStatsAPIView.as_view(), name='movement-stats'),
]