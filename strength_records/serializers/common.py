from rest_framework import serializers
from ..models import StrengthSet


class StrengthSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = StrengthSet
        fields = '__all__'
