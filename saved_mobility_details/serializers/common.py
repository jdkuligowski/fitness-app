from rest_framework import serializers
from ..models import SavedMobilityDetails
from movements.serializers.common import MovementSerializer

class SavedMobilityDetailsSerializer(serializers.ModelSerializer):
    movements = MovementSerializer()
    class Meta:
        model = SavedMobilityDetails
        fields = '__all__'