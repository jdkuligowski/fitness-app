from django.db import models

# Create your models here.
class RunningInterval(models.Model):
    session = models.ForeignKey(
        'running_sessions.RunningSession',
        related_name='intervals',
        on_delete=models.CASCADE
    )
    repeat_variation = models.SmallIntegerField()
    repeats = models.PositiveIntegerField()
    repeat_distance = models.FloatField(null=True, blank=True)
    target_pace = models.CharField(max_length=20)
    rest_time = models.PositiveIntegerField(null=True, blank=True)
