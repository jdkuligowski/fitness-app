# tasks.py
from celery import shared_task
from django.db.models import Max
from strength_records.models import StrengthSet
from .models import MovementSummary 

@shared_task
def recalc_movement_summaries(user_id, movement_id=None):

    # 1) Build a queryset of StrengthSet objects for this user.
    qs = StrengthSet.objects.filter(owner_id=user_id)

    if movement_id:
        qs = qs.filter(movement_id=movement_id)

    # 2) Gather all distinct Movement IDs for which this user has sets
    movement_ids = qs.values_list('movement_id', flat=True).distinct()

    # 3) For each movement, find the set with the highest weight
    for m_id in movement_ids:
        # Sub-query for that movement
        set_qs = qs.filter(movement_id=m_id)

        if not set_qs.exists():
            # If no sets remain for that movement, remove the summary if desired
            MovementSummary.objects.filter(owner_id=user_id, movement_id=m_id).delete()
            continue

        # The single set with the highest "weight"
        best_set = set_qs.order_by('-weight').first()  # highest weight at top

        best_weight = best_set.weight or 0.0
        best_reps = best_set.reps or 0
        # Epley formula for 1RM: weight * (1 + reps/30)
        estimated_1rm = best_weight * (1 + (best_reps / 30.0))

        # Upsert into MovementSummary
        summary, _ = MovementSummary.objects.get_or_create(
            owner_id=user_id,
            movement_id=m_id,
            defaults={
                'best_weight': best_weight,
                'best_reps': best_reps,
                'estimated_1rm': estimated_1rm
            }
        )
        # If already existed, update fields
        summary.best_weight = best_weight
        summary.best_reps = best_reps
        summary.estimated_1rm = estimated_1rm
        summary.save()
