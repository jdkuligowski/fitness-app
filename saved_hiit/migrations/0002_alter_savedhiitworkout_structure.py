# Generated by Django 5.1.3 on 2025-02-07 14:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("saved_hiit", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="savedhiitworkout",
            name="structure",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
