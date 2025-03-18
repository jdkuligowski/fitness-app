from rest_framework import serializers
from ..models import Leaderboard
from jwt_auth.serializers.common import UserSerializer

class LeaderboardSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Leaderboard
        fields = '__all__'