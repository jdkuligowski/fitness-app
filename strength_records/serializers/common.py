from rest_framework import serializers
from ..models import StrengthSet
from movements.serializers.common import MovementSerializer


class StrengthSetSerializer(serializers.ModelSerializer):
    movement = MovementSerializer(read_only=True)

    class Meta:
        model = StrengthSet
        fields = '__all__'
