# Create your models here.
from django.db import models

class SavedMobilityDetails(models.Model):
    details = models.ForeignKey(
        'saved_mobility.SavedMobilitySession',
        related_name='mobility_details',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_index=True,
    )
    order = models.FloatField(null=True, blank=True)  
    duration = models.CharField(max_length=10, blank=True, null=True)
    movements = models.ForeignKey(
        'movements.Movement',
        related_name='mobility_movement_details',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )
    
