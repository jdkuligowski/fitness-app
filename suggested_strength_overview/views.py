from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SuggestedStrength
from .serializers.common import SuggestedStrengthSerializer

class SuggestedStrengthView(APIView):
    """
    API endpoint to fetch all running workouts.
    """
    def get(self, request, *args, **kwargs):
        try:
            # Fetch all running workouts
            suggested_sessions = SuggestedStrength.objects.all()
            
            # Serialize the data
            serializer = SuggestedStrengthSerializer(suggested_sessions, many=True)
            
            # Return the serialized data
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            # Handle any unexpected errors
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
