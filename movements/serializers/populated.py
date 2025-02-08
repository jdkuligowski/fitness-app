from rest_framework import serializers 
from ..models import Movement
from workout_section_movement.serializers.populated import PopulatedWorkoutSectionSerializer
from saved_mobility_details.serializers.common import SavedMobilityDetailsSerializer
from saved_hiit_details.serializers.common import SavedHiitDetailsSerializer

# define our own serializer class - this is generic and will return all fields from the Review model
class PopulatedWorkoutSerializer(serializers.ModelSerializer):
    section_movement_details = PopulatedWorkoutSectionSerializer(many=True)
    mobility_movement_details = SavedMobilityDetailsSerializer(many=True)
    hiit_movement_details = SavedHiitDetailsSerializer(many=True)
    class Meta:
        model = Movement
        fields = '__all__'