from rest_framework import serializers
from ..models import RunningSession

class RunningSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RunningSession
        fields = '__all__'