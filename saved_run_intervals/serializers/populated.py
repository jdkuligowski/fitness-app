from rest_framework import serializers
from saved_run_interval_times.serializers.common import SavedRunSplitsSerializer
from ..models import SavedRunningInterval

class PopulatedRunningIntervalSerializer(serializers.ModelSerializer):
    split_times = SavedRunSplitsSerializer(many=True)

    class Meta:
        model = SavedRunningInterval
        fields = '__all__'
