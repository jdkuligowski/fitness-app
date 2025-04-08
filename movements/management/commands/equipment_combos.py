from django.core.management.base import BaseCommand
from movements.models import Movement
from equipment.models import Equipment
from equipment_movements.models import EquipmentMovement

import csv

class Command(BaseCommand):
    help = "Import M2M combos from CSV. Make sure Movement & Equipment already exist."

    def handle(self, *args, **options):
        # 1) Specify or fetch the path to your CSV file
        csv_path = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - Equipment list final (1).csv"
        
        # 2) Open the CSV & read rows
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # -- Here’s the same logic you had in your script:

                # a) Lookup the Movement by ID
                movement_id = int(row["movement_id"])
                try:
                    movement_obj = Movement.objects.get(id=movement_id)
                except Movement.DoesNotExist:
                    self.stdout.write(f"WARNING: Movement with id={movement_id} not found. Skipping.")
                    continue

                # b) Create the EquipmentMovement row
                combo_label = row.get("equipment_text", "")
                eq_move = EquipmentMovement.objects.create(
                    movement=movement_obj,
                    combo_label=combo_label if combo_label else None
                )

                # c) Parse equipment_ids (comma-separated)
                eq_ids_str = row.get("equipment_ids", "")
                eq_ids_list = [x.strip() for x in eq_ids_str.split(",") if x.strip()]
                
                for eq_id_str in eq_ids_list:
                    try:
                        eq_id = int(eq_id_str)
                        equipment_obj = Equipment.objects.get(id=eq_id)
                        eq_move.equipment.add(equipment_obj)
                    except (Equipment.DoesNotExist, ValueError):
                        self.stdout.write(f"WARNING: Equipment with id={eq_id_str} not found. Skipping.")
                        continue
                
                eq_move.save()

        self.stdout.write(self.style.SUCCESS("Combos import done!"))
