from django.db import models

# Create your models here.
class SuggestedStrengthDetails(models.Model):
    section_name = models.CharField(max_length=15, blank=True, null=True)
    section_number = models.PositiveIntegerField()
    section_movement = models.PositiveIntegerField()
    exercise = models.CharField(max_length=200, blank=True, null=True)
    session = models.ForeignKey(
        'suggested_strength_overview.SuggestedStrength',
        related_name='details',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True
    )

