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
env = environ.Env()
environ.Env.read_env()

# create timestamps in different formats
from datetime import datetime, timedelta
from django.conf import settings
import jwt
from rest_framework.exceptions import ValidationError
from django.core.validators import validate_email

import uuid

# Serializer
from .serializers.common import UserSerializer, UserRegistrationSerializer

from django.views.decorators.csrf import csrf_exempt
import json
from django.http import JsonResponse, HttpResponseRedirect
from django.db.models import Count, Max, Sum, Q, Window, F
from django.db.models.functions import DenseRank

from google.auth.transport import requests
from google.oauth2 import id_token

# Model
from django.contrib.auth import get_user_model
User = get_user_model()
from saved_workouts.models import Workout
from leaderboard.models import Leaderboard
env = environ.Env()
import re


from django.utils.timezone import now
from .serializers.populated import PopulatedUserSerializer

from django.utils.crypto import get_random_string

from rest_framework.parsers import MultiPartParser, FormParser
from azure.storage.blob import BlobServiceClient, ContentSettings

AZURE_STORAGE_ACCOUNT_NAME = env('AZURE_STORAGE_ACCOUNT_NAME')
AZURE_STORAGE_CONNECTION_STRING = env('AZURE_STORAGE_CONNECTION_STRING')
GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID")
print("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID)

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"


class RegisterView(APIView):
    def post(self, request):
        data = request.data
        email = data.get("email", "").strip().lower()
        password = data.get("password")
        password_confirmation = data.get("password_confirmation")

        # Ensure required fields are provided
        if not all([data.get("first_name"), data.get("last_name"), email, password, password_confirmation]):
            return Response({"detail": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check email format (Stricter validation)
        if not re.match(EMAIL_REGEX, email):
            return Response({"detail": "Invalid email format."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the email already exists
        if User.objects.filter(email=email).exists():
            return Response({"detail": "An account with this email already exists."}, status=status.HTTP_409_CONFLICT)

        # Ensure passwords match
        if password != password_confirmation:
            return Response({"detail": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        username = get_random_string(15)

        # Save user in a transaction
        with transaction.atomic():
            user = User.objects.create_user(
                first_name=data.get("first_name"),
                last_name=data.get("last_name"),
                email=email,
                password=password,
                username=username,  # Pass an empty string for `username`
            )

        # Generate JWT token
        dt = datetime.now() + timedelta(hours=12)
        token = jwt.encode(
            {
                "sub": user.id,
                "exp": int(dt.timestamp())
            },
            settings.SECRET_KEY,
            algorithm="HS256"
        )

        return Response({
            "message": f"User {user.email} registered successfully.",
            "token": token,
            "user_id": user.id
        }, status=status.HTTP_201_CREATED)



# Login View
class LoginView(APIView):
    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get('password')

        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'No account found with that email'}, status=status.HTTP_404_NOT_FOUND)

        if not user.check_password(password):
            return Response({'detail': 'Incorrect password'}, status=status.HTTP_401_UNAUTHORIZED)

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



class OnboardingView(APIView):
    # permission_classes = [IsAuthenticated]  

    def put(self, request, user_id):
        print(f"🔍 DEBUG: user_id received -> {user_id} (type: {type(user_id)})")

        try:
            user = User.objects.get(id=int(user_id))  # Ensure it's an integer
            print(f"✅ DEBUG: Retrieved user -> {user.id} (Username: {user.username})")
        except (User.DoesNotExist, ValueError):
            return Response({"detail": "User not found or invalid ID."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        print(f"📩 Received data: {data}")

        # ✅ Extract & Validate required fields
        fitness_goals = data.get("fitnessGoal")
        exercise_regularity = data.get("exerciseFrequency")
        non_negotiable_dislikes = data.get("exerciseExclusions", [])

        # ✅ Ensure exerciseExclusions is a list
        if isinstance(non_negotiable_dislikes, str):
            non_negotiable_dislikes = non_negotiable_dislikes.split(",") if non_negotiable_dislikes else []

        # ✅ Convert 5K Time
        five_k_mins = int(data.get("five_k_mins", 0)) if str(data.get("five_k_mins", "")).isdigit() else None
        five_k_secs = int(data.get("five_k_secs", 0)) if str(data.get("five_k_secs", "")).isdigit() else None

        # ✅ Required fields validation
        if not fitness_goals:
            return Response({"detail": "Fitness goals are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not exercise_regularity:
            return Response({"detail": "Exercise regularity is required."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Validate list format
        if not isinstance(non_negotiable_dislikes, list):
            return Response({"detail": "Non-negotiable dislikes must be a list."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Validate 5k run time
        if five_k_mins is not None and five_k_mins < 0:
            return Response({"detail": "5k minutes must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)
        if five_k_secs is not None and not (0 <= five_k_secs < 60):
            return Response({"detail": "5k seconds must be between 0 and 59."}, status=status.HTTP_400_BAD_REQUEST)

        print(f"✅ Processed Data: {fitness_goals}, {exercise_regularity}, {non_negotiable_dislikes}, {five_k_mins}:{five_k_secs}")

        # ✅ Update user fields
        user.fitness_goals = fitness_goals
        user.exercise_regularity = exercise_regularity
        user.non_negotiable_dislikes = ",".join(non_negotiable_dislikes)
        user.five_k_mins = five_k_mins
        user.five_k_secs = five_k_secs
        user.is_onboarding_complete = True
        user.save()

        print(f"✅ Onboarding updated for user {user.id}")

        return Response({"message": "Onboarding data updated successfully."}, status=status.HTTP_200_OK)




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


class UpdateUserView(APIView):
    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        user.save()

        return Response({"message": "User updated successfully"}, status=200)



class FullUserView(APIView):
    def get(self, request, user_id):
        user = User.objects.select_related('leaderboard').get(id=user_id)

        # Batch workout queries
        today = now().date()
        start_of_month = today.replace(day=1)
        workouts = Workout.objects.filter(owner=user, status='Completed')
        workout_stats = workouts.aggregate(
            workouts_this_month=Count('id', filter=Q(completed_date__gte=start_of_month)),
            workouts_all_time=Count('id'),
            most_recent_completed=Max('completed_date')
        )
        recent_workouts = workouts.order_by('-completed_date')[:2].values('id', 'name', 'completed_date', 'duration')

        # Leaderboard rank (Window Function)
        # rank_data = Leaderboard.objects.annotate(
        #     rank=Window(
        #         expression=DenseRank(),
        #         order_by=F('total_score').desc()
        #     )
        # ).filter(user=user).values('rank')
        # rank = rank_data[0]['rank'] if rank_data else 1

        # leaderboard = user.leaderboard
        # leaderboard_scores = {
        #     'total_score': leaderboard.total_score,
        #     'weekly_score': leaderboard.weekly_score,
        #     'monthly_score': leaderboard.monthly_score
        # }

        serialized_user = PopulatedUserSerializer(user).data
        stats = {
            'workouts_this_month': workout_stats['workouts_this_month'],
            'workouts_all_time': workout_stats['workouts_all_time'],
            'recent_workouts': list(recent_workouts),
            # 'leaderboard': leaderboard_scores,
            # 'leaderboard_rank': rank
        }

        return Response({'user': serialized_user, 'stats': stats}, status=status.HTTP_200_OK)





class ProfileImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        file = request.FILES.get('file')

        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        print(f"File size before read: {file.size} bytes")
        
        file_content = file.read()
        if len(file_content) == 0:
            return Response({"error": "File is empty"}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        try:
            blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
            container_name = 'profile-images'
            
            file_extension = file.name.split('.')[-1]
            file_name = f"{uuid.uuid4()}.{file_extension}"
            
            blob_client = blob_service_client.get_blob_client(container=container_name, blob=file_name)
            blob_client.upload_blob(
                file_content, 
                overwrite=True, 
                content_settings=ContentSettings(content_type=file.content_type)
            )

            image_url = f"https://{AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/{container_name}/{file_name}"

            user.profile_image = image_url
            user.save()

            print(f"Uploaded image URL: {image_url}")
            return Response({"message": "Image uploaded successfully", "image_url": image_url}, status=200)

        except Exception as e:
            print('Error uploading image:', e)
            return Response({"error": f"Internal Server Error: {str(e)}"}, status=500)
        
        


class GoogleRegisterView(APIView):
    def post(self, request):
        print("📩 Received request at /register/google")
        print("🔎 Request Data:", request.data)

        google_token = request.data.get("token")

        if not google_token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            print("🔍 Verifying Google Token...")

            # ✅ Properly verify the token using Google's API
            google_info = id_token.verify_oauth2_token(google_token, requests.Request(), GOOGLE_CLIENT_ID)

            print("✅ Google Info:", google_info)

            if "email" not in google_info:
                return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

            email = google_info["email"]
            first_name = google_info.get("given_name", "")
            last_name = google_info.get("family_name", "")
            profile_image = google_info.get("picture", "")

            user, created = User.objects.get_or_create(email=email, defaults={
                "first_name": first_name,
                "last_name": last_name,
                "username": email.split("@")[0],
                "profile_image": profile_image
            })

            dt = datetime.now() + timedelta(hours=12)
            token = jwt.encode(
                {"sub": user.id, "exp": int(dt.timestamp())},
                settings.SECRET_KEY,
                algorithm="HS256"
            )

            return Response({
                "message": f"Welcome, {user.first_name}",
                "token": token,
                "user": {
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "profile_image": user.profile_image
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            print("❌ Google Auth Error:", traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)