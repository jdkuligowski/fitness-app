from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from workout_section_movement.models import SectionMovement
from .models import Section
from workout_section_sets.models import Set
from strength_records.models import StrengthSet
from saved_conditioning.models import ConditioningWorkout
from .serializers.populated import PopulatedSectionSerializer
import logging

from movement_summary_stats.tasks import recalc_movement_summaries


logger = logging.getLogger(__name__)



class SaveWorkoutAPIView(APIView):
    """
    Save or update the workout with sections, movements, sets, and conditioning details.
    """

    def put(self, request):
        logger.info('Received data for saving workout')
        user_id = request.query_params.get('user_id')

        try:
            sections_data = request.data.get('sections', [])
            scheduled_date = request.data.get('scheduled_date')

            # 1️⃣ --- Pre-Fetch All Required Sections, Movements, and Conditionings ---
            section_ids = [section_data['section_id'] for section_data in sections_data]
            sections = Section.objects.filter(id__in=section_ids).select_related('workout')

            # Pre-fetch movements, sets, and conditioning workouts
            movements = SectionMovement.objects.filter(section__in=sections).select_related('section')
            sets = Set.objects.filter(section_movement__in=movements).select_related('section_movement')
            conditionings = ConditioningWorkout.objects.filter(section__in=sections).select_related('section')

            # Create a map of existing sections, movements, and conditionings for fast lookup
            section_map = {section.id: section for section in sections}
            movement_map = {movement.id: movement for movement in movements}
            conditioning_map = {conditioning.id: conditioning for conditioning in conditionings}

            # 2️⃣ --- Prepare Bulk Insert Data for Movements, Sets, and Conditionings ---
            movements_to_update = []
            new_sets = []
            sets_to_update = []
            conditionings_to_update = []

            # NEW: We'll handle StrengthSet objects similarly.
            from datetime import date
            today = date.today()
            performed_date = scheduled_date if scheduled_date else now().date()

            # We'll assume there's only one user in these sections' workouts (typical scenario).
            owner = sections.first().workout.owner if sections else None

            # We'll pre-fetch any existing StrengthSet entries for this user & these movements, for today's date,
            # so we can update instead of duplicating.
            # Filter by the Movement objects in `movements` to keep it tight.
            existing_strength_sets = StrengthSet.objects.filter(
                owner=owner,
                movement__in=[m.movements for m in movements if m.movements],
                performed_date=performed_date
            )

            # Make a dictionary for quick lookup: {(movement_id, set_number): strength_set}
            existing_strength_map = {
                (ss.movement_id, ss.set_number): ss
                for ss in existing_strength_sets
            }

            new_strength_sets = []
            strength_sets_to_update = []

            # We'll define some simple "strength" keywords:
            strength_keywords = ["strong", "build", "pump"]  # case-insensitive

            for section_data in sections_data:
                section_id = section_data.get('section_id')
                section = section_map.get(section_id)

                if not section:
                    logger.warning(f"Section with id {section_id} not found")
                    continue

                # Process movements for the section
                for movement_data in section_data.get('movements', []):
                    movement_id = movement_data.get('movement_id')
                    movement = movement_map.get(movement_id)
                    
                    if movement:
                        movement.movement_difficulty = movement_data.get('movement_difficulty', movement.movement_difficulty)
                        movement.movement_comment = movement_data.get('movement_comments', movement.movement_comment)
                        movements_to_update.append(movement)
                    
                    # Determine if this is a "strength" section based on section name
                    section_name_lower = section.section_name.lower() if section.section_name else ""
                    is_strength_section = any(kw in section_name_lower for kw in strength_keywords)

                    # Process sets
                    for set_data in movement_data.get('sets', []):
                        set_number = set_data.get('set_number')
                        reps = set_data.get('reps', 0)
                        weight = set_data.get('weight', 0)

                        # 2a) Handle the regular "Set" model as before
                        set_instance = next(
                            (s for s in sets if s.section_movement.id == movement_id and s.set_number == set_number),
                            None
                        )
                        if set_instance:
                            set_instance.reps = reps
                            set_instance.weight = weight
                            sets_to_update.append(set_instance)
                        else:
                            new_sets.append(
                                Set(
                                    section_movement=movement,
                                    set_number=set_number,
                                    reps=reps,
                                    weight=weight
                                )
                            )

                        # NEW: If it's a strength section, also update/create StrengthSet
                        if is_strength_section and owner and movement and movement.movements:
                            strength_movement_id = movement.movements.id
                            existing_strength_set = existing_strength_map.get((strength_movement_id, set_number))

                            # We'll derive RPE from "movement_difficulty"
                            derived_rpe = movement_data.get('movement_difficulty', movement.movement_difficulty)
                            load_value = (weight or 0) * (reps or 0)  # manually compute load

                            if existing_strength_set:
                                # Update existing
                                existing_strength_set.reps = reps
                                existing_strength_set.weight = weight
                                existing_strength_set.rpe = derived_rpe
                                existing_strength_set.load = load_value
                                strength_sets_to_update.append(existing_strength_set)
                            else:
                                # Create new
                                new_sset = StrengthSet(
                                    owner=owner,
                                    movement=movement.movements,
                                    workout=section.workout,  # the current section's workout
                                    performed_date=performed_date,
                                    set_number=set_number,
                                    reps=reps,
                                    weight=weight,
                                    rpe=derived_rpe,
                                    load=load_value
                                )
                                new_strength_sets.append(new_sset)

                # Process conditioning workouts for the section
                for conditioning_data in section_data.get('conditioning_workouts', []):
                    conditioning_id = conditioning_data.get('conditioning_id')
                    conditioning = conditioning_map.get(conditioning_id)

                    if conditioning:
                        conditioning.comments = conditioning_data.get('comments', conditioning.comments)
                        conditioning.rpe = conditioning_data.get('rpe', conditioning.rpe)
                        conditionings_to_update.append(conditioning)

            # 3️⃣ --- Bulk Update and Bulk Create ---
            # Movements
            if movements_to_update:
                SectionMovement.objects.bulk_update(movements_to_update, ['movement_difficulty', 'movement_comment'])
            
            # Sets
            if new_sets:
                Set.objects.bulk_create(new_sets)
            if sets_to_update:
                Set.objects.bulk_update(sets_to_update, ['reps', 'weight'])

            # Conditionings
            if conditionings_to_update:
                ConditioningWorkout.objects.bulk_update(conditionings_to_update, ['comments', 'rpe'])

            # StrengthSets
            if new_strength_sets:
                StrengthSet.objects.bulk_create(new_strength_sets)
            if strength_sets_to_update:
                StrengthSet.objects.bulk_update(strength_sets_to_update, ['reps', 'weight', 'rpe', 'load'])
                
            recalc_movement_summaries.delay(user_id)


            logger.info("Workout saved successfully")
            return Response({'message': 'Workout saved successfully!'}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"Error occurred while saving workout: {e}") 
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
