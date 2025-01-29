# models.py in conditioning_detail app
from django.db import models

class ConditioningDetail(models.Model):
    conditioning_overview = models.ForeignKey(
        'conditioning_summary.ConditioningOverview',
        related_name="conditioning_details",  # Allows easy access to details from the overview
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )
    movement_order = models.PositiveIntegerField(default=None, null=True, blank=True)  # Order of movements in the workout
    exercise = models.CharField(max_length=255, blank=True, null=True)  # Name of the exercise
    detail = models.CharField(max_length=255, blank=True, null=True)  # Details like '60s', '10 reps', etc.
    
    def __str__(self):
        return f"{self.conditioning_overview.name} - {self.exercise}"