from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.crypto import get_random_string

class User(AbstractUser):
    email = models.EmailField(unique=True)  # Better validation for email
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, blank=True)
    username = models.CharField(max_length=50, unique=True, null=True, blank=True)
    profile_image = models.CharField(max_length=500, null=True, blank=True)
    is_onboarding_complete = models.BooleanField(default=False)
    fitness_goals = models.CharField(max_length=100, null=True, blank=True)
    exercise_regularity = models.IntegerField(default=0, null=True, blank=True)
    non_negotiable_dislikes = models.CharField(max_length=100, null=True, blank=True)
    expo_push_token = models.CharField(max_length=300, null=True, blank=True)
    five_k_mins = models.IntegerField(null=True, blank=True)
    five_k_secs = models.IntegerField(null=True, blank=True)
    first_login = models.DateTimeField(null=True, blank=True)  # Add the first_login field



    def save(self, *args, **kwargs):
            if not self.username:
                while True:
                    random_username = get_random_string(15)
                    if not User.objects.filter(username=random_username).exists():
                        self.username = random_username
                        break
            super().save(*args, **kwargs)