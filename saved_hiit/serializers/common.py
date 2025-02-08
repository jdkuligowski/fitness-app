from rest_framework import serializers
from ..models import SavedHIITWorkout

class SavedHiitSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedHIITWorkout
        fields = '__all__'