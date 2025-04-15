# movement_summary_stats/serializers.py
from rest_framework import serializers
from ..models import MovementSummary
from movements.serializers.common import MovementSerializer

class MovementSummarySerializer(serializers.ModelSerializer):
    movement = MovementSerializer(read_only=True)

    class Meta:
        model = MovementSummary
        fields = '__all__'
