import csv
from django.core.management.base import BaseCommand
from running_sessions.models import RunningSession
from running_session_details.models import RunningInterval

# CSV columns are:
# id, repeat_variation, repeats, repeat_distance, target_pace, rest_time, session_id

CSV_FILE = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - Running Intervals (2).csv"

class Command(BaseCommand):
    help = "Import or update RunningInterval rows from a CSV."

    def handle(self, *args, **options):
        with open(CSV_FILE, mode="r", newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                try:
                    interval_id = int(row["id"])
                    session_id = int(row["session_id"])

                    # Try to find the parent session
                    try:
                        session_obj = RunningSession.objects.get(id=session_id)
                    except RunningSession.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(f"RunningSession ID {session_id} not found. Skipping row={row}")
                        )
                        continue

                    # Convert numeric fields
                    repeat_var = int(row["repeat_variation"]) if row["repeat_variation"] else None
                    repeats_val = int(row["repeats"]) if row["repeats"] else 1
                    repeat_dist = float(row["repeat_distance"]) if row["repeat_distance"] else 0.0
                    rest_val = int(row["rest_time"]) if row["rest_time"] else None

                    # We'll do get_or_create by the "id" primary key
                    obj, created = RunningInterval.objects.get_or_create(
                        id=interval_id,
                        defaults={
                            "session": session_obj,
                            "repeat_variation": repeat_var,
                            "repeats": repeats_val,
                            "repeat_distance": repeat_dist,
                            "target_pace": row["target_pace"] or "",
                            "rest_time": rest_val,
                        }
                    )

                    if not created:
                        # Update fields
                        obj.session = session_obj
                        obj.repeat_variation = repeat_var
                        obj.repeats = repeats_val
                        obj.repeat_distance = repeat_dist
                        obj.target_pace = row["target_pace"] or ""
                        obj.rest_time = rest_val
                        obj.save()

                    action = "Created" if created else "Updated"
                    self.stdout.write(
                        self.style.SUCCESS(f"{action} RunningInterval ID={interval_id} (session={session_id}).")
                    )

                except ValueError as ve:
                    self.stdout.write(self.style.WARNING(f"Error parsing numeric fields in row: {row} => {ve}"))
                except KeyError as ke:
                    self.stdout.write(self.style.WARNING(f"Missing column {ke} in CSV row: {row}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Unexpected error for row {row}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Import/Update of RunningInterval completed."))
