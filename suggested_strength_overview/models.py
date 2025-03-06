from django.db import models

# Create your models here.
class SuggestedStrength(models.Model):
    workout_name = models.CharField(max_length=50)
    body_area = models.CharField(max_length=15, blank=True, null=True)
    duration = models.FloatField(null=True, blank=True)
    description = models.CharField(max_length=200, blank=True, null=True)
    number_of_sections = models.FloatField(null=True, blank=True)
    
