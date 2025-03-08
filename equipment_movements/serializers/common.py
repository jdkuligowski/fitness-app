from ..models import EquipmentMovement

class EquipmentMovementSerializer(serializers.ModelSerializer):
    equipment = EquipmentSerializer(many=True)  # Nested to show equipment details

    class Meta:
        model = EquipmentMovement
        fields = '__all__'