from rest_framework import serializers 

from ..models import SectionMovement
from workout_section_sets.serializers.common import WorkoutSetsSerializer
from movements.serializers.common import MovementSerializer


# define our own serializer class - this is generic and will return all fields from the Review model
class PopulatedWorkoutSectionSerializer(serializers.ModelSerializer):
    workout_sets = WorkoutSetsSerializer(many=True)
    movements = MovementSerializer()
    class Meta:
        model = SectionMovement
        fields = '__all__'