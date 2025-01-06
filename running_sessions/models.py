from django.db import models

# Create your models here.
class RunningSession(models.Model):
    session_type = models.CharField(max_length=15)
    session_name = models.CharField(max_length=100, blank=True, null=True)
    duration = models.CharField(max_length=10, blank=True)
    warmup_distance = models.FloatField(null=True, blank=True)
    cool_down_distance = models.FloatField(null=True, blank=True)
    total_distance = models.FloatField(null=True, blank=True)
    notes = models.CharField(max_length=200, blank=True, null=True)
