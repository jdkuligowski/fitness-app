from rest_framework import serializers
from ..models import SavedRunningSplitTime

class SavedRunSplitsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRunningSplitTime
        fields = '__all__'