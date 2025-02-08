from django.db import models

# Create your models here.
class SavedHIITMovement(models.Model):
    block = models.ForeignKey(
        'saved_hiit_details.SavedHIITDetails',
        related_name='hiit_movements',
        on_delete=models.CASCADE,
        null=True,
        blank=True
        
    )
    movements = models.ForeignKey(
        'movements.Movement',
        related_name='hiit_movement_details',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )
    exercise_name = models.CharField(max_length=150) 
    order = models.PositiveIntegerField()  
    rest_period = models.BooleanField(default=False) 

    def __str__(self):
        return f"{self.exercise_name} (Block {self.block.block_name})"