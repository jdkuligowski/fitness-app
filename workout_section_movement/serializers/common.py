from rest_framework import serializers
from ..models import SectionMovement

class SectionMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionMovement
        fields = '__all__'