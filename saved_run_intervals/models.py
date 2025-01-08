from django.db import models

class SavedRunningInterval(models.Model):
    saved_session = models.ForeignKey(
        'saved_runs.SavedRunningSession',
        related_name='saved_intervals',
        on_delete=models.CASCADE
    )
    repeat_variation = models.SmallIntegerField(null=True, blank=True)  
    repeats = models.PositiveIntegerField(null=True, blank=True)  
    repeat_distance = models.FloatField(null=True, blank=True)  # E.g., 1.0 km
    target_pace = models.PositiveIntegerField(null=True, blank=True)  # Expected pace (seconds per km)
    average_actual_pace = models.PositiveIntegerField(null=True, blank=True)  # Actual pace (seconds per km)
    comments = models.TextField(null=True, blank=True)
