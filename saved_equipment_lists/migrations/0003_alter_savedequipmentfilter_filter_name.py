# Generated by Django 5.1.3 on 2025-04-04 09:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("saved_equipment_lists", "0002_alter_savedequipmentfilter_unique_together"),
    ]

    operations = [
        migrations.AlterField(
            model_name="savedequipmentfilter",
            name="filter_name",
            field=models.CharField(max_length=100),
        ),
    ]
