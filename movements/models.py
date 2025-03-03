from django.db import models

# Create your models here.
class Movement(models.Model):
    body_area = models.CharField(max_length=15, null=True, blank=True)
    movement = models.CharField(max_length=50, null=True, blank=True)
    exercise = models.CharField(max_length=100, null=True, blank=True)
    complexity = models.SmallIntegerField(default=None, null=True, blank=True)
    movement_type = models.CharField(max_length=50, null=True, blank=True)
    primary_body_part = models.CharField(max_length=100, null=True, blank=True)
    high_level_equipment = models.CharField(max_length=30, null=True, blank=True)
    detail_equipment = models.CharField(max_length=30, null=True, blank=True)
    hiit_flag = models.SmallIntegerField(default=None, null=True, blank=True)
    pump_flag = models.SmallIntegerField(default=None, null=True, blank=True)
    landscape_video_url = models.CharField(max_length=250, null=True, blank=True)
    portrait_video_url = models.CharField(max_length=250, null=True, blank=True)
    landscape_thumbnail = models.CharField(max_length=250, null=True, blank=True)
    

