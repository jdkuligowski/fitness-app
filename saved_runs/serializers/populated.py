from rest_framework import serializers
from saved_run_intervals.serializers.populated import PopulatedRunningIntervalSerializer
from ..models import SavedRunningSession

class PopulatedSavedRunningSessionSerializer(serializers.ModelSerializer):
    saved_intervals = PopulatedRunningIntervalSerializer(many=True)

    class Meta:
        model = SavedRunningSession
        fields = '__all__'
