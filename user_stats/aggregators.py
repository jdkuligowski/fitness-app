from collections import defaultdict
from saved_workouts.models import Workout
from workout_sections.models import Section
from workout_section_movement.models import SectionMovement
from movements.models import Movement
from django.db.models import Sum
from datetime import date, timedelta


def compute_body_part_count_for_workout(workout):
    """
    For a given workout, ignore sections named Warm Up A, Warm Up B, or Conditioning.
    Then, for each remaining section, gather its Movements and increment a count
    for each Movement's `primary_body_part`.
    
    Returns a dict, e.g. { 'Shoulders': 2, 'Back': 1 }.
    """
    # 1) Exclude Warm Up / Conditioning sections
    # (Case-sensitive: if your DB has exact naming, or you might use .iexact)
    excluded_sections = ["Warm Up A", "Warm Up B", "Conditioning"]
    sections = workout.workout_sections.exclude(section_name__in=excluded_sections)

    # 2) Gather all SectionMovement for these sections
    section_movements = SectionMovement.objects.filter(section__in=sections)
    movement_ids = section_movements.values_list('movements_id', flat=True)

    # 3) Retrieve Movement records
    movements_qs = Movement.objects.filter(id__in=movement_ids)

    # 4) Build a count dict
    usage = defaultdict(int)
    for bp in movements_qs.values_list('primary_body_part', flat=True):
        if bp:  # skip empty/None
            usage[bp] += 1

    return dict(usage)


def aggregate_body_parts_over_range(user, start_date, end_date):
    """
    For all 'Completed' workouts within [start_date, end_date],
    sum up the body-part counts from `compute_body_part_count_for_workout()`.
    
    Example return: {"Shoulders": 5, "Back": 3, "Legs": 2, ...}
    """
    workouts = Workout.objects.filter(
        owner=user,
        status='Completed',
        completed_date__gte=start_date,
        completed_date__lte=end_date
    )

    from collections import defaultdict
    body_part_usage = defaultdict(int)

    for w in workouts:
        usage_dict = compute_body_part_count_for_workout(w)
        for bp, count in usage_dict.items():
            body_part_usage[bp] += count

    return dict(body_part_usage)


def aggregate_activity_type_over_range(user, start_date, end_date):
    """
    For all 'Completed' workouts in [start_date, end_date],
    sum durations by activity_type.
    Returns e.g.: {"Strength": 120, "Running": 60, "HIIT": 30}
    """
    qs = Workout.objects.filter(
        owner=user,
        status='Completed',
        completed_date__gte=start_date,
        completed_date__lte=end_date
    )

    from collections import defaultdict
    usage_dict = defaultdict(float)

    for w in qs:
        atype = w.activity_type or "Unknown"
        usage_dict[atype] += (w.duration or 0)

    return dict(usage_dict)
