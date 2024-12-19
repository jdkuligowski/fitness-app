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

    first_login = models.DateTimeField(null=True, blank=True)  # Add the first_login field

    def save(self, *args, **kwargs):
        if not self.last_login:
            self.last_login = timezone.now()
        if not self.username:
            # Ensure the generated username is unique
            while True:
                random_username = get_random_string(15)
                if not User.objects.filter(username=random_username).exists():
                    self.username = random_username
                    break
        super().save(*args, **kwargs)
