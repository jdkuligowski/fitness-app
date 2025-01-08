from rest_framework import serializers
from workout_sections.serializers.populated import PopulatedSectionSerializer
from running_sessions.serializers.populated import PopulatedSavedRunningSessionSerializer
from ..models import Workout

class PopulatedWorkoutSerializer(serializers.ModelSerializer):
    workout_sections = PopulatedSectionSerializer(many=True)  # Gym workout sections
    running_sessions = PopulatedSavedRunningSessionSerializer(many=True)  # Running sessions

    class Meta:
        model = Workout
        fields = '__all__'

