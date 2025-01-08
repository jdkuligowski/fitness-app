from rest_framework import serializers
from ..models import RunningSession
from running_session_details.serializers.common import RunningDetailsSerializer

class RunningSessionSerializer(serializers.ModelSerializer):
    intervals = RunningDetailsSerializer(many=True)

    class Meta:
        model = RunningSession
        fields = '__all__'