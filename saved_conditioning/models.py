from django.db import models

class ConditioningWorkout(models.Model):
    section = models.ForeignKey(
        'workout_sections.Section',
        related_name='conditioning_elements',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True
    )
    conditioning_overview = models.ForeignKey(
        'conditioning_summary.ConditioningOverview',
        related_name='workout_conditionings',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True
    )
    comments = models.TextField(default=None, null=True, blank=True)
    rpe = models.SmallIntegerField(default=None, null=True, blank=True) 

    def __str__(self):
        return f"{self.workout.name} - Conditioning: {self.conditioning_overview.name}"
