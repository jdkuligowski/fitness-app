from rest_framework import serializers
from ..models import MobilityWorkoutDetails
from movements.serializers.common import MovementSerializer
# from running_session_details.serializers.common import RunningDetailsSerializer

class MobilityWorkoutDetailsSerializer(serializers.ModelSerializer):
    # movements = MovementSerializer()
    
    class Meta:
        model = MobilityWorkoutDetails
        fields = '__all__'