# Generated by Django 5.1.3 on 2024-12-06 09:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("workout_sections", "0002_alter_section_section_order"),
    ]

    operations = [
        migrations.AddField(
            model_name="section",
            name="section_type",
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]