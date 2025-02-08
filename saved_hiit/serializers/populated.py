from rest_framework import serializers
from saved_hiit_details.serializers.populated import PopulatedHiitDetailsSerializer
from ..models import SavedHIITWorkout

class PopulatedHiitSessionSerializer(serializers.ModelSerializer):
    hiit_details = PopulatedHiitDetailsSerializer(many=True)

    class Meta:
        model = SavedHIITWorkout
        fields = '__all__'
