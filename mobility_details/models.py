from django.db import models

# Create your models here.
class MobilityWorkoutDetails(models.Model):
    session = models.ForeignKey(
        'mobility_overview.MobilityWorkout',
        related_name='details',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True
    )
    exercise = models.CharField(max_length=200, blank=True, null=True)
    order = models.PositiveIntegerField()
    duration = models.CharField(max_length=10, blank=True, null=True)
