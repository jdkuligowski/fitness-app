from rest_framework import serializers
from ..models import SavedRunningSession

class SavedRunsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRunningSession
        fields = '__all__'