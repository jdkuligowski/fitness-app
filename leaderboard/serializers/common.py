from rest_framework import serializers
from ..models import Leaderboard

class LeaderboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leaderboard
        fields = ['user', 'total_score', 'weekly_score', 'monthly_score', 'last_updated']