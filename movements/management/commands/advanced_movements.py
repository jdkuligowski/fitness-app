import csv
from django.core.management.base import BaseCommand
from movements.models import Movement

CSV_FILE = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - v1 database on app (13).csv"

class Command(BaseCommand):
    help = "Update Movement table with advanced_movements and inter_movements from a CSV file."

    def handle(self, *args, **options):
        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                try:
                    # Get the Movement record by ID (must match 'id' in CSV)
                    movement = Movement.objects.get(id=row["id"])

                    # Pull the CSV fields for advanced and intermediate
                    advanced_value = row.get("advanced_movements", "")
                    inter_value = row.get("inter_movements", "")
                    primary_body_value = row.get("primary_body_part", "")

                    # Assign them to your model fields
                    movement.advanced_movements = advanced_value
                    movement.inter_movements = inter_value
                    movement.primary_body_part = primary_body_value

                    # Save the record
                    movement.save()

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Updated Movement ID {movement.id} with "
                            f"advanced_movements='{advanced_value}', "
                            f"inter_movements='{inter_value}'."
                            f"primary_body_part='{primary_body_value}'."
                        )
                    )
                except Movement.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Movement with ID {row['id']} does not exist. Skipping."
                        )
                    )

        self.stdout.write(self.style.SUCCESS("Update process completed."))
