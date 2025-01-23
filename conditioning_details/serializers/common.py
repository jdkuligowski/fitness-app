from rest_framework import serializers
from ..models import ConditioningDetail

class ConditioningDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConditioningDetail
        fields = '__all__'