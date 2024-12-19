from django.db import models

# Create your models here.
class Set(models.Model):
    set_number = models.SmallIntegerField(default=None, null=True, blank=True)
    reps = models.SmallIntegerField(default=None, null=True, blank=True)
    weight = models.FloatField(default=None, null=True, blank=True)
    section_movement = models.ForeignKey(
        'workout_section_movement.sectionmovement',
        related_name='workout_sets',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )

