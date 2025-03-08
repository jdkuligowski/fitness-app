import csv
from django.core.management.base import BaseCommand
from movements.models import Movement

# Replace with the correct path to your CSV:
CSV_FILE = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - v1 database on app (8).csv"

class Command(BaseCommand):
    help = "Update Movement table with advanced_movements from a CSV file."

    def handle(self, *args, **options):
        # Open the CSV file
        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                try:
                    # Look up the Movement by ID (must match the 'id' column in CSV)
                    movement = Movement.objects.get(id=row["id"])

                    # Extract the advanced movement value from CSV,
                    # e.g. row.get("advanced_movements") – adjust the key to match your column name
                    advanced_value = row.get("advanced_movements", "")

                    # Assign to your Django model field (e.g. movement.advanced_movements)
                    movement.advanced_movements = advanced_value

                    movement.save()

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Updated Movement ID {movement.id} with advanced_movements='{advanced_value}'."
                        )
                    )
                except Movement.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Movement with ID {row['id']} does not exist. Skipping."
                        )
                    )

        self.stdout.write(self.style.SUCCESS("Update process completed."))
