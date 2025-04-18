from django.db import models

# Create your models here.
class Movement(models.Model):
    body_area = models.CharField(max_length=15, null=True, blank=True)
    movement = models.CharField(max_length=50, null=True, blank=True)
    exercise = models.CharField(max_length=100, null=True, blank=True)
    inter_movements = models.CharField(max_length=70, null=True, blank=True)
    advanced_movements = models.CharField(max_length=50, null=True, blank=True)
    primary_body_part = models.CharField(max_length=100, null=True, blank=True)
    movement_hold_cue = models.CharField(max_length=15, null=True, blank=True)
    equipment_check = models.CharField(max_length=20, null=True, blank=True)
    coaching_cue1 = models.CharField(max_length=500, null=True, blank=True)
    coaching_cue2 = models.CharField(max_length=500, null=True, blank=True)
    hiit_flag = models.SmallIntegerField(default=None, null=True, blank=True)
    landscape_video_url = models.CharField(max_length=250, null=True, blank=True)
    portrait_video_url = models.CharField(max_length=250, null=True, blank=True)
    landscape_thumbnail = models.CharField(max_length=250, null=True, blank=True)
