from rest_framework import serializers 

from ..models import RunningSession
from running_session_details.serializers.common import RunningDetailsSerializer


# define our own serializer class - this is generic and will return all fields from the Review model
class PopulatedRunningSessionSerializer(serializers.ModelSerializer):
    intervals = RunningDetailsSerializer(many=True)
    
    class Meta:
        model = RunningSession
        fields = '__all__'