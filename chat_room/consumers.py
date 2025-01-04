import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import ChatMessage, ChatRoom

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data['content']
        user = self.scope['user']
        room = await sync_to_async(ChatRoom.objects.get)(name=self.room_name)

        # Save the message
        message = await sync_to_async(ChatMessage.objects.create)(
            content=content,
            owner=user,
            room=room
        )

        # Broadcast the message to the room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'content': content,
                    'owner': {
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'profile_image': user.profile_image.url if user.profile_image else None,
                    },
                    'timestamp': str(message.timestamp),
                }
            }
        )

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))
