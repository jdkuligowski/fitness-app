# Generated by Django 5.1.3 on 2025-01-06 19:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("saved_workouts", "0005_alter_workout_completed_date_alter_workout_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="workout",
            name="activity_type",
            field=models.CharField(blank=True, db_index=True, max_length=20, null=True),
        ),
    ]
