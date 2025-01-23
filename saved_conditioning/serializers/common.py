from rest_framework import serializers
from ..models import ConditioningWorkout
from conditioning_summary.serializers.common import ConditioningOverviewSerializer

class SavedConditioningSerializer(serializers.ModelSerializer):
    conditioning_overview = ConditioningOverviewSerializer()
    class Meta:
        model = ConditioningWorkout
        fields = '__all__'