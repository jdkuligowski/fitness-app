from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from django.contrib.auth import get_user_model
User = get_user_model()

from user_stats.models import UserStats
from user_stats.serializers.common import UserStatsSerializer

class UserStatsView(APIView):
    def get(self, request, user_id):
        # for example, you can do permission checks here
        user = get_object_or_404(User, id=user_id)
        stats, _ = UserStats.objects.get_or_create(user=user)
        serializer = UserStatsSerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)
