from rest_framework import serializers
from ..models import SavedEquipmentFilter
from equipment.serializers.common import EquipmentSerializer


class SavedEquipmentFilterSerializer(serializers.ModelSerializer):
    equipment = EquipmentSerializer(many=True)  # Nested serializer to show equipment details

    class Meta:
        model = SavedEquipmentFilter
        fields = '__all__'