from rest_framework import serializers
from ..models import SavedHIITDetails
from saved_hiit_detail_movements.serializers.common import SavedHiitMovementSerializer

class PopulatedHiitDetailsSerializer(serializers.ModelSerializer):
    hiit_movements = SavedHiitMovementSerializer(many=True) 

    class Meta:
        model = SavedHIITDetails
        fields = '__all__'
        
