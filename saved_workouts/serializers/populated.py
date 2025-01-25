from rest_framework import serializers
from workout_sections.serializers.populated import PopulatedSectionSerializer
from running_sessions.serializers.populated import PopulatedSavedRunningSessionSerializer
from saved_mobility.serializers.common import SavedMobilitySerializer
from ..models import Workout

class PopulatedWorkoutSerializer(serializers.ModelSerializer):
    workout_sections = PopulatedSectionSerializer(many=True)  # Gym workout sections
    running_sessions = PopulatedSavedRunningSessionSerializer(many=True)  # Running sessions
    mobility_sessions = SavedMobilitySerializer(many=True)
    
    class Meta:
        model = Workout
        fields = '__all__'

