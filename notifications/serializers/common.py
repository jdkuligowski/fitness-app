from rest_framework import serializers
from ..models import ScheduledNotification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledNotification
        fields = '__all__'