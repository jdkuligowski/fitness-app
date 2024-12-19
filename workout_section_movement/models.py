from django.db import models

# Create your models here.
class SectionMovement(models.Model):
    movement_order = models.SmallIntegerField(default=None, null=True, blank=True)
    movement_difficulty = models.SmallIntegerField(default=None, null=True, blank=True)
    movement_comment = models.CharField(max_length=150, null=True, blank=True)
    section = models.ForeignKey(
        'workout_sections.Section',
        related_name='section_movement_details',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 

    )
    movements = models.ForeignKey(
        'movements.Movement',
        related_name='movement_details',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 

    )
