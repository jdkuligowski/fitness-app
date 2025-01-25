from rest_framework import serializers
from ..models import MobilityWorkout
from mobility_details.serializers.common import MobilityWorkoutDetailsSerializer

class MobilityWorkoutSerializer(serializers.ModelSerializer):
    details = MobilityWorkoutDetailsSerializer(many=True)

    class Meta:
        model = MobilityWorkout
        fields = '__all__'