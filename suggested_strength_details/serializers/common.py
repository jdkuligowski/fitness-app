from rest_framework import serializers
from ..models import SuggestedStrengthDetails

class SuggestedStrengthDetailsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = SuggestedStrengthDetails
        fields = '__all__'