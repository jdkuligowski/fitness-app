from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from movement_summary_stats.models import MovementSummary
from django.contrib.auth import get_user_model
User = get_user_model()
from movements.models import Movement

from .serializers.common import MovementSummarySerializer
from strength_records.models import StrengthSet
from strength_records.serializers.common import StrengthSetSerializer

class MovementStatsAPIView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # fetch summaries + sets
        summaries_qs = MovementSummary.objects.filter(owner=user).select_related('movement')
        sets_qs = StrengthSet.objects.filter(owner=user).select_related('movement', 'workout')

        # serialize
        summaries_data = MovementSummarySerializer(summaries_qs, many=True).data
        sets_data = StrengthSetSerializer(sets_qs, many=True).data

        return Response({
            "summaries": summaries_data,
            "strength_sets": sets_data
        }, status=200)
