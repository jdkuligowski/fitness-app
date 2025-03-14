from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
User = get_user_model()
# or from django.contrib.auth import get_user_model

@api_view(['POST'])
def set_expo_token(request):
    user_id = request.data.get('user_id')
    token = request.data.get('token')
    user = get_object_or_404(User, pk=user_id)
    user.expo_push_token = token
    user.save()
    return Response({"status": "token saved successfully!"})
