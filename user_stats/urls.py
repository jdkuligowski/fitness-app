from django.urls import path
from user_stats.views import UserStatsView

urlpatterns = [
    path('<int:user_id>/', UserStatsView.as_view(), name='user-stats'),
]
