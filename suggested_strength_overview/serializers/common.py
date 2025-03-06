from rest_framework import serializers
from ..models import SuggestedStrength
from suggested_strength_details.serializers.common import SuggestedStrengthDetailsSerializer

class SuggestedStrengthSerializer(serializers.ModelSerializer):
    details = SuggestedStrengthDetailsSerializer(many=True)

    class Meta:
        model = SuggestedStrength
        fields = '__all__'