from rest_framework import serializers
from ..models import SavedRunningInterval

class SavedRunIntervalsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRunningInterval
        fields = '__all__'