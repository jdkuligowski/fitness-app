from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from chat_message.models import ChatMessage
from chat_room.models import ChatRoom
from chat_message.serializers.common import ChatMessageSerializer
from chat_room.serializers.common import ChatRoomSerializer
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
User = get_user_model()

class ChatRoomListView(APIView):
    """
    List all chat rooms.
    """
    # permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Chat room not found"}, status=status.HTTP_404_NOT_FOUND)

        # Basic offset-limit pagination
        offset = int(request.query_params.get('offset', 0))  # e.g. ?offset=0
        limit = int(request.query_params.get('limit', 20))   # e.g. ?limit=20

        # Retrieve messages in descending order (newest first)
        all_messages = room.messages.all().order_by('-timestamp')

        # Slice the messages based on offset and limit
        paginated_messages = all_messages[offset:offset + limit]

        # Serialize and return
        serializer = ChatMessageSerializer(paginated_messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)




class ChatRoomMessagesView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Chat room not found"}, status=status.HTTP_404_NOT_FOUND)

        # Use the correct related_name to access messages
        messages = room.messages.all().order_by('-timestamp')  # Use related_name 'messages'
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, room_id):
        user_id = request.query_params.get('user_id')  # Fetch the user_id from query params
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)  # Fetch the user from the database
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Chat room not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()  # Ensure mutable data
        data['room'] = room.id  # Add room ID to the request payload

        serializer = ChatMessageSerializer(data=data)
        if serializer.is_valid():
            serializer.save(owner=user, room=room)  # Use the fetched user as the owner
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
