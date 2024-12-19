from rest_framework import serializers 
from ..models import Section
from workout_section_movement.serializers.populated import PopulatedWorkoutSectionSerializer

class PopulatedSectionSerializer(serializers.ModelSerializer):
    section_movement_details = PopulatedWorkoutSectionSerializer(many=True)  # Reference the movement details

    class Meta:
        model = Section
        fields = ['id', 'section_name', 'section_order', 'section_type', 'section_movement_details']
