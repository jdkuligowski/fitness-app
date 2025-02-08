from rest_framework import serializers
from ..models import SavedHIITDetails

class SavedHiitDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedHIITDetails
        fields = '__all__'