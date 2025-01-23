from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ConditioningOverview
from .serializers.common import ConditioningOverviewSerializer


class ConditioningWorkoutsList(APIView):
    """
    API View to fetch all Conditioning Workouts along with their details.
    """
    def get(self, request):
        try:
            # Fetch all conditioning workouts
            conditioning_workouts = ConditioningOverview.objects.all()
            print('conditioning: ', conditioning_workouts)
            # Serialize the data
            serializer = ConditioningOverviewSerializer(conditioning_workouts, many=True)
            print('serialized conditioning: ', serializer.data)

            # Return serialized data
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            # Handle errors
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
