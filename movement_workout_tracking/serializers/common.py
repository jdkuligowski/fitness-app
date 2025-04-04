from rest_framework import serializers
from ..models import GeneratedWorkoutPlan, MovementUsage

class WorkoutGenerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedWorkoutPlan
        fields = '__all__'



class MovementUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovementUsage
        fields = '__all__'