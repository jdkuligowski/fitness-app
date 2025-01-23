from rest_framework import serializers 
from ..models import Section
from workout_section_movement.serializers.populated import PopulatedWorkoutSectionSerializer
from saved_conditioning.serializers.common import SavedConditioningSerializer

class PopulatedSectionSerializer(serializers.ModelSerializer):
    section_movement_details = PopulatedWorkoutSectionSerializer(many=True)  # Reference the movement details
    conditioning_elements = SavedConditioningSerializer(many=True)
    
    class Meta:
        model = Section
        fields = '__all__'
