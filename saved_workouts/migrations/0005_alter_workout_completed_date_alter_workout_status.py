# Generated by Django 5.1.3 on 2024-12-17 17:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("saved_workouts", "0004_alter_workout_completed_date"),
    ]

    operations = [
        migrations.AlterField(
            model_name="workout",
            name="completed_date",
            field=models.DateField(blank=True, db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="workout",
            name="status",
            field=models.CharField(blank=True, db_index=True, max_length=15, null=True),
        ),
    ]