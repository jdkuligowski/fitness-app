from rest_framework import serializers
from ..models import SavedHIITMovement
from movements.serializers.common import MovementSerializer

class SavedHiitMovementSerializer(serializers.ModelSerializer):
    movements = MovementSerializer()
    class Meta:
        model = SavedHIITMovement
        fields = '__all__'