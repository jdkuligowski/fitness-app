from django.db import models

# Create your models here.
class Section(models.Model):
    section_name = models.CharField(max_length=30, null=True, blank=True)
    section_type = models.CharField(max_length=20, null=True, blank=True)
    section_order = models.SmallIntegerField(default=None, null=True, blank=True)
    workout = models.ForeignKey(
        'saved_workouts.Workout',
        related_name='workout_sections',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 

    )
