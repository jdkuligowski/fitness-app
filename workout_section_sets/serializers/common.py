from rest_framework import serializers
from ..models import Set

class WorkoutSetsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Set
        fields = '__all__'