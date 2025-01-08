from django.db import models

# Create your models here.
class SavedRunningSplitTime(models.Model):
    saved_interval = models.ForeignKey(
        'saved_run_intervals.SavedRunningInterval',
        related_name='split_times',
        on_delete=models.CASCADE
    )
    repeat_number = models.PositiveSmallIntegerField() 
    target_time = models.PositiveIntegerField(null=True, blank=True)
    actual_time = models.PositiveIntegerField(null=True, blank=True)  
    comments = models.TextField(null=True, blank=True)  

