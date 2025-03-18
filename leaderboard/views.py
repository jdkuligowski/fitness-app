# leaderboard/views.py
from rest_framework.generics import ListAPIView
from .models import Leaderboard
from .serializers.common import LeaderboardSerializer

class LeaderboardListView(ListAPIView):
    serializer_class = LeaderboardSerializer

    def get_queryset(self):
        # Example: order by total_rank ascending 
        # (lowest rank is 1, next is 2, etc.)
        return (
            Leaderboard.objects
            .select_related('user')     # ensures 1 DB join for user
            .order_by('weekly_rank')     # or '-total_score' if you prefer
        )
