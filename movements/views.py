from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Movement
from .serializers.common import MovementSerializer

class MovementList(APIView):
    permission_classes = [AllowAny]  # Make this view publicly accessible

    def get(self, request):
        movements = Movement.objects.all()  # Fetch all Movement records
        if not movements:
            return Response({'message': 'No movements found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MovementSerializer(movements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
