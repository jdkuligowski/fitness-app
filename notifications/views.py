# notifications/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

User = get_user_model()

class SetExpoToken(APIView):
    """
    Stores the Expo push token for a given user.
    Expects a JSON body like:
        {
          "user_id": 123,
          "token": "ExponentPushToken[xxxxxxxx]"
        }
    """
    def post(self, request, *args, **kwargs):
        user_id = request.data.get("user_id")
        expo_token = request.data.get("token")

        if not user_id or not expo_token:
            return Response(
                {"error": "Missing 'user_id' or 'token' in request body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Look up the user
        user = get_object_or_404(User, pk=user_id)

        # Save token
        user.expo_push_token = expo_token
        user.save()

        return Response(
            {"status": "Token saved successfully!"},
            status=status.HTTP_200_OK
        )
