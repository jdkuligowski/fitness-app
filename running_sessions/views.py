from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import RunningSession
from .serializers.populated import PopulatedRunningSessionSerializer
from .serializers.common import RunningSessionSerializer

class RunningWorkoutsView(APIView):
    """
    API endpoint to fetch all running workouts.
    """
    def get(self, request, *args, **kwargs):
        try:
            # Fetch all running workouts
            running_sessions = RunningSession.objects.all()
            
            # Serialize the data
            serializer = RunningSessionSerializer(running_sessions, many=True)
            
            # Return the serialized data
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            # Handle any unexpected errors
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
