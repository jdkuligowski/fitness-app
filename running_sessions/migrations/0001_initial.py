# Generated by Django 5.1.3 on 2025-01-05 13:32

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="RunningSession",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("session_type", models.CharField(max_length=15)),
                (
                    "session_name",
                    models.CharField(blank=True, max_length=100, null=True),
                ),
                ("duration", models.CharField(blank=True, max_length=10)),
                ("warmup_distance", models.FloatField(blank=True, null=True)),
                ("cool_down_distance", models.FloatField(blank=True, null=True)),
                ("total_distance", models.FloatField(blank=True, null=True)),
                ("notes", models.CharField(blank=True, max_length=200, null=True)),
            ],
        ),
    ]