from rest_framework import serializers
from ..models import ConditioningOverview
from conditioning_details.serializers.common import ConditioningDetailsSerializer

class ConditioningOverviewSerializer(serializers.ModelSerializer):
    conditioning_details = ConditioningDetailsSerializer(many=True)

    class Meta:
        model = ConditioningOverview
        fields = '__all__'