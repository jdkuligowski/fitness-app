from rest_framework import serializers 
from ..models import Movement
from workout_section_movement.serializers.populated import PopulatedWorkoutSectionSerializer

# define our own serializer class - this is generic and will return all fields from the Review model
class PopulatedWorkoutSerializer(serializers.ModelSerializer):
    section_movement_details = PopulatedWorkoutSectionSerializer(many=True)

    class Meta:
        model = Movement
        fields = '__all__'