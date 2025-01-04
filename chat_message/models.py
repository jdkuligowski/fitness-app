from django.db import models

class ChatMessage(models.Model):
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(
        'jwt_auth.User',  # Link to your user schema
        on_delete=models.CASCADE,
        related_name="messages"
    )
    room = models.ForeignKey(
        'chat_room.ChatRoom',  # Link to ChatRoom
        on_delete=models.CASCADE,
        related_name="messages"
    )

    def __str__(self):
        return f"{self.owner.username}: {self.content[:30]}"
