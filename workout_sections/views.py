from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from workout_section_movement.models import SectionMovement
from .models import Section
from workout_section_sets.models import Set
from .serializers.populated import PopulatedSectionSerializer
import logging
logger = logging.getLogger(__name__)


class SaveWorkoutAPIView(APIView):
    """
    Save or update the workout with sections, movements, and sets.
    """

    def put(self, request):
        logger.info('Received data for saving workout')
        
        try:
            sections_data = request.data.get('sections', [])
            
            # 1️⃣ --- Pre-Fetch All Required Sections and Movements ---
            section_ids = [section_data['section_id'] for section_data in sections_data]
            sections = Section.objects.filter(id__in=section_ids).select_related('workout')

            # Pre-fetch movements and sets for all relevant sections
            movements = SectionMovement.objects.filter(section__in=sections).select_related('section')
            sets = Set.objects.filter(section_movement__in=movements).select_related('section_movement')

            # Create a map of existing sections and movements for fast lookup
            section_map = {section.id: section for section in sections}
            movement_map = {movement.id: movement for movement in movements}

            # 2️⃣ --- Prepare Bulk Insert Data for Movements and Sets ---
            movements_to_update = []
            new_sets = []
            sets_to_update = []

            for section_data in sections_data:
                section_id = section_data.get('section_id')
                section = section_map.get(section_id)

                if not section:
                    logger.warning(f"Section with id {section_id} not found")
                    continue

                for movement_data in section_data.get('movements', []):
                    movement_id = movement_data.get('movement_id')
                    movement = movement_map.get(movement_id)
                    
                    if movement:
                        movement.movement_difficulty = movement_data.get('movement_difficulty', movement.movement_difficulty)
                        movement.movement_comment = movement_data.get('movement_comments', movement.movement_comment)
                        movements_to_update.append(movement)
                    
                    for set_data in movement_data.get('sets', []):
                        set_number = set_data.get('set_number')
                        set_instance = next(
                            (s for s in sets if s.section_movement.id == movement_id and s.set_number == set_number),
                            None
                        )
                        if set_instance:
                            set_instance.reps = set_data.get('reps', 0)
                            set_instance.weight = set_data.get('weight', 0)
                            sets_to_update.append(set_instance)
                        else:
                            new_sets.append(
                                Set(
                                    section_movement=movement,
                                    set_number=set_number,
                                    reps=set_data.get('reps', 0),
                                    weight=set_data.get('weight', 0)
                                )
                            )

            # 3️⃣ --- Bulk Update and Bulk Create ---
            if movements_to_update:
                SectionMovement.objects.bulk_update(movements_to_update, ['movement_difficulty', 'movement_comment'])
            
            if new_sets:
                Set.objects.bulk_create(new_sets)
            
            if sets_to_update:
                Set.objects.bulk_update(sets_to_update, ['reps', 'weight'])

            logger.info("Workout saved successfully")
            return Response({'message': 'Workout saved successfully!'}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"Error occurred while saving workout: {e}") 
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)