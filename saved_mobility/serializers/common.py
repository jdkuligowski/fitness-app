from rest_framework import serializers
from ..models import SavedMobilitySession
from saved_mobility_details.serializers.common import SavedMobilityDetailsSerializer

class SavedMobilitySerializer(serializers.ModelSerializer):
    mobility_details = SavedMobilityDetailsSerializer(many=True)
    class Meta:
        model = SavedMobilitySession
        fields = '__all__'