# models.py in conditioning_overview app
from django.db import models

class ConditioningOverview(models.Model):
    name = models.CharField(max_length=255)  # Name of the workout, e.g., '8\' AMRAP'
    movements = models.PositiveIntegerField()  # Number of movements in the workout
    rest = models.PositiveIntegerField()  # Rest time in seconds
    notes = models.TextField(blank=True, null=True)  # Additional details or instructions

    def __str__(self):
        return self.name