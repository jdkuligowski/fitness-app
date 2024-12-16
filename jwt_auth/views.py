from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
#  NotFound is going to provide us with an exception that sends a 404 response to the end user
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.contrib.sites.shortcuts import get_current_site
from django.shortcuts import redirect

from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.utils.html import format_html
import environ

# create timestamps in different formats
from datetime import datetime, timedelta
from django.conf import settings
import jwt
from rest_framework.exceptions import ValidationError
import uuid

# Serializer
from .serializers.common import UserSerializer, UserRegistrationSerializer

from django.views.decorators.csrf import csrf_exempt
import json
from django.http import JsonResponse, HttpResponseRedirect


# Model
from django.contrib.auth import get_user_model
User = get_user_model()

env = environ.Env()




class RegisterView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                # Save the user
                user = serializer.save()
                user.set_password(serializer.validated_data['password'])
                user.save()

                # Create JWT token
                dt = datetime.now() + timedelta(hours=12)
                token = jwt.encode(
                    {
                        'sub': user.id,
                        'exp': int(dt.timestamp())
                    },
                    settings.SECRET_KEY,
                    algorithm='HS256'
                )

                return Response({
                    'message': f"User {user.email} registered successfully.",
                    'token': token
                }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




# Login View
class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise PermissionDenied('Invalid credentials')

        if not user.check_password(password):
            raise PermissionDenied('Invalid credentials')

        # Generate JWT token
        dt = datetime.now() + timedelta(hours=12)
        token = jwt.encode(
            {
                'sub': user.id,
                'exp': int(dt.timestamp())
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )

        return Response({
            'message': f"Welcome back, {user.email}",
            'token': token,
            'user_id': user.id,  # Top-level user_id for frontend compatibility
            'user': {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_202_ACCEPTED)




class SimpleUserView(APIView):

    # GET - Return 1 user item by user_id
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist as e:
            print('Error:', e)
            raise NotFound({'detail': 'User not found'})  # Better error message for not found

        print('User --->', user)
        serialized_user = UserSerializer(user)
        return Response(serialized_user.data, status=status.HTTP_200_OK)