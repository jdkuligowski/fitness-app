# Generated by Django 5.1.3 on 2024-12-06 13:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("saved_workouts", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="workout",
            name="status",
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
    ]