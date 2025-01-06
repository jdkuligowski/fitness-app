from rest_framework import serializers
from ..models import RunningInterval

class RunningDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RunningInterval
        fields = '__all__'