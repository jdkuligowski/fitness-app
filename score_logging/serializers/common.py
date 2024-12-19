from rest_framework import serializers
from ..models import ScoreLog


class ScoreLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoreLog
        fields = ['user', 'score_type', 'score_value', 'timestamp']
