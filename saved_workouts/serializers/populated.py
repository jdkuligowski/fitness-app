from rest_framework import serializers 
from ..models import Workout
from workout_sections.serializers.populated import PopulatedSectionSerializer

class PopulatedWorkoutSerializer(serializers.ModelSerializer):
    workout_sections = PopulatedSectionSerializer(many=True)  # Reference the workout sections

    class Meta:
        model = Workout
        fields = ['id', 'name', 'description', 'status', 'complexity', 'duration', 
                  'comments', 'workout_number', 'scheduled_date', 'workout_sections']
