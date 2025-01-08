from rest_framework import serializers
from ..models import RunningSession
from running_session_details.serializers.common import RunningDetailsSerializer
from saved_run_intervals.serializers.populated import PopulatedRunningIntervalSerializer
from saved_runs.serializers.populated import PopulatedSavedRunningSessionSerializer
from running_session_details.serializers.common import RunningDetailsSerializer

class PopulatedRunningSessionSerializer(serializers.ModelSerializer):
    # Include saved sessions and intervals for detailed information
    saved_sessions = PopulatedSavedRunningSessionSerializer(many=True) 
    intervals = RunningDetailsSerializer(many=True)

    class Meta:
        model = RunningSession
        fields = '__all__'
        
