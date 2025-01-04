from rest_framework import serializers
from ..models import ChatMessage
from jwt_auth.serializers.common import UserSerializer 


class ChatMessageSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'content', 'timestamp', 'owner', 'room']
