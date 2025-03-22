# notifications/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import ScheduledNotification
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




class NotificationsListView(APIView):
    """
    GET -> Return a list of notifications for a given user.
    By default, let's return only those that are not cleared_by_user.
    If you want all, you can skip the filter or add a query param.
    """
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "Missing 'user_id' query param."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Get the user
        user = get_object_or_404(User, pk=user_id)

        notifications = ScheduledNotification.objects.filter(
            owner=user, 
            cleared_by_user=False  # maybe also only `sent=True` if you prefer
        ).order_by('-scheduled_datetime')  # maybe newest first

        data = []
        for notif in notifications:
            data.append({
                "id": notif.id,
                "title": notif.title,
                "subtitle": notif.subtitle,
                "body": notif.body,
                "scheduled_datetime": notif.scheduled_datetime,
                "sent": notif.sent,
                "cleared_by_user": notif.cleared_by_user,
                "created_at": notif.created_at,
            })

        return Response({"notifications": data}, status=status.HTTP_200_OK)


class NotificationsClearView(APIView):
    """
    POST -> Mark notifications as cleared for a given user.
    - If you want to clear all, just pass user_id.
    - If you want to only clear specific IDs, pass a list of IDs
    """
    def post(self, request):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "Missing 'user_id' in request body."}, 
                            status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, pk=user_id)

        # Option A: Clear ALL notifications for this user
        # If you want only some, see Option B below
        notifications = ScheduledNotification.objects.filter(owner=user, cleared_by_user=False)
        notifications.update(cleared_by_user=True)

        return Response({"message": "All notifications cleared."}, 
                        status=status.HTTP_200_OK)
