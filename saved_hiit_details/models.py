from django.db import models

# Create your models here.
class SavedHIITDetails(models.Model):
    hiit_workout = models.ForeignKey(
        'saved_hiit.SavedHIITWorkout',
        related_name='hiit_details',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    block_name = models.CharField(max_length=50, null=True, blank=True)  # "Block 1", "Minute 2", etc.
    rep_scheme = models.CharField(max_length=50, null=True, blank=True)  # "15-12-10" (optional)
    order = models.PositiveIntegerField()  # Ordering of blocks
