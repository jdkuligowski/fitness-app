from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import IntegrityError, transaction 
from rest_framework import status
from django.core.exceptions import ValidationError
import logging  # ✅ Import logging
from datetime import date
from .models import Workout
from workout_sections.models import Section
from movements.models import Movement
from workout_section_movement.models import SectionMovement
from .serializers.populated import PopulatedWorkoutSerializer
from .serializers.common import WorkoutSerializer
from workout_section_sets.models import Set
from score_logging.models import ScoreLog
from leaderboard.models import Leaderboard
from django.db.models import OuterRef, Subquery, Prefetch, F, Q
from django.db.models.functions import Coalesce
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils.timezone import now

User = get_user_model()
logger = logging.getLogger(__name__)

class SaveWorkoutView(APIView):
    def post(self, request):
        data = request.data

        # Validate and retrieve the user
        user_id = data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Invalid user ID'}, status=400)

        try:
            with transaction.atomic():
                # Determine the workout type
                workout_type = data.get('activity_type')

                # Delegate processing based on workout type
                if workout_type == 'Gym':
                    return self._save_gym_workout(data, user)
                elif workout_type == 'Running':
                    return self._save_running_workout(data, user)
                else:
                    return Response({'error': f'Unsupported workout type: {workout_type}'}, status=400)

        except Exception as e:
            print(e)
            return Response({'error': 'An error occurred while saving the workout'}, status=400)

    def _save_gym_workout(self, data, user):
        # Process and save gym workout
        workout = Workout.objects.create(
            name=data['name'],
            workout_number=self._get_workout_number(user),
            description=data['description'],
            duration=data['duration'],
            complexity=data['complexity'],
            status=data.get('status', 'Saved'),
            scheduled_date=data.get('scheduled_date'),
            owner=user,
            activity_type="Gym",
        )

        # Save sections and movements
        for section_data in data['sections']:
            section = Section.objects.create(
                workout=workout,
                section_type=section_data['section_type'],
                section_name=section_data['section_name'],
                section_order=section_data['section_order'],
            )
            for movement_data in section_data['movements']:
                movement = Movement.objects.get(exercise=movement_data['movement_name'])
                SectionMovement.objects.create(
                    section=section,
                    movements=movement,
                    movement_order=movement_data['movement_order'],
                )
        return Response({'message': 'Gym workout saved successfully', 'workout_id': workout.id}, status=201)

    def _save_running_workout(self, data, user):
        # Process and save running workout
        workout = Workout.objects.create(
            name=data['name'],
            workout_number=self._get_workout_number(user),
            description=data['description'],
            duration=data['duration'],
            complexity=0,  # Running-specific logic
            status=data.get('status', 'Saved'),
            scheduled_date=data.get('scheduled_date'),
            owner=user,
            activity_type="Running",
        )
        # Add specific logic for running workouts if needed (e.g., intervals, distances)
        return Response({'message': 'Running workout saved successfully', 'workout_id': workout.id}, status=201)

    def _get_workout_number(self, user):
        last_workout = Workout.objects.filter(owner=user).order_by('-workout_number').first()
        return (last_workout.workout_number + 1) if last_workout else 1



# Show all workouts of all types
class GetAllWorkoutsView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get('user_id')  # Fetch the user_id from query params
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all workouts for the user
        workouts = Workout.objects.filter(owner_id=user_id).order_by('-created_at')
        serializer = WorkoutSerializer(workouts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# Show all upcoming workouts of different types
class GetUpcomingWorkouts(APIView):
    """
    View to get all workouts for a user.
    """

    def get(self, request):
        user_id = request.query_params.get('user_id')  # Get user_id from query params
        upcoming = request.query_params.get('upcoming', 'false').lower() == 'true'
        limit = int(request.query_params.get('limit', 0))  # Limit for the number of workouts

        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Query for all workouts by the user
        workouts = Workout.objects.filter(owner_id=user_id)

        if upcoming:
            # Filter for only upcoming workouts (scheduled for a future date)
            workouts = workouts.filter(scheduled_date__gte=now().date()).order_by('scheduled_date')

        if limit > 0:
            # Limit the number of workouts returned
            workouts = workouts[:limit]

        serializer = WorkoutSerializer(workouts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



# Get single gym workouts
class GetSingleWorkoutView(APIView):
    """
    Get a single workout and return all related workout details along with 
    the last 4 movement histories for each movement within the workout.
    """

    def get(self, request, workout_id):
        user_id = request.query_params.get('user_id')

        try:
            # 1️⃣ --- Get Workout and Related Data ---
            try:
                workout = Workout.objects.prefetch_related(
                    Prefetch(
                        'workout_sections__section_movement_details',
                        queryset=SectionMovement.objects.prefetch_related('workout_sets')
                    )
                ).select_related('owner').get(id=workout_id, owner=user_id)
            except Workout.DoesNotExist:
                logger.error(f"Workout with id {workout_id} does not exist for user {user_id}")
                return Response({'error': 'Workout not found'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                logger.error(f"Error querying workout: {str(e)}")
                return Response({'error': f'Error querying workout: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 2️⃣ --- Serialize Workout Data (already optimized with prefetch/select_related) ---
            try:
                serializer = PopulatedWorkoutSerializer(workout)
                workout_data = serializer.data
            except Exception as e:
                logger.error(f"Error serializing workout data: {str(e)}")
                return Response({'error': f'Error serializing workout data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 3️⃣ --- Extract Movement IDs for History Query ---
            try:
                movement_ids = [
                    movement['movements']['id']
                    for section in workout_data['workout_sections']
                    for movement in section['section_movement_details']
                    if movement.get('movements')
                ]
            except Exception as e:
                logger.error(f"Error extracting movement IDs: {str(e)}")
                return Response({'error': f'Error extracting movement IDs: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 4️⃣ --- Get Movement History for the Last 4 Completed Dates ---
            try:
                movement_history = {}
                if movement_ids:
                    # ✅ Get the last 4 completed workout dates (batch for all movements)
                    last_4_dates = (
                        Workout.objects.filter(
                            owner=user_id,
                            status="Completed"
                        )
                        .values('completed_date')
                        .distinct()
                        .order_by('-completed_date')[:4]  # ✅ Last 4 completed dates for this user
                    )

                    last_4_dates_list = [item['completed_date'] for item in last_4_dates]

                    # ✅ Query all relevant sets in ONE query for these last 4 dates
                    history_records = Set.objects.filter(
                        section_movement__movements__id__in=movement_ids,
                        section_movement__section__workout__completed_date__in=last_4_dates_list
                    ).select_related(
                        'section_movement__movements',
                        'section_movement__section__workout'
                    ).order_by(
                        'section_movement__movements__id',
                        '-section_movement__section__workout__completed_date'
                    ).values(
                        'section_movement__movements__id',
                        'section_movement__movement_difficulty',
                        'section_movement__section__workout__completed_date',
                        'set_number',
                        'reps',
                        'weight',
                    )

                    # Group sets by movement ID and workout date
                    for record in history_records:
                        movement_id = record['section_movement__movements__id']
                        workout_date = record['section_movement__section__workout__completed_date']

                        if movement_id not in movement_history:
                            movement_history[movement_id] = {}

                        if workout_date not in movement_history[movement_id]:
                            movement_history[movement_id][workout_date] = {
                                "workout_date": workout_date,
                                "movement_difficulty": record['section_movement__movement_difficulty'],
                                "sets": []
                            }

                        movement_history[movement_id][workout_date]["sets"].append({
                            "set_number": record['set_number'],
                            "reps": record['reps'],
                            "weight": record['weight'],
                        })

                    # Flatten the dictionary into a list for easier usage
                    movement_history = {
                        movement_id: list(workout_data.values())
                        for movement_id, workout_data in movement_history.items()
                    }

            except Exception as e:
                logger.error(f"Error querying movement history: {str(e)}")
                return Response({'error': f'Error querying movement history: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 5️⃣ --- Return Response (Workout Data + Movement History) ---
            return Response({
                "workout": workout_data,
                "movement_history": movement_history
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Unexpected error in GetSingleWorkoutView: {str(e)}")
            return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
    
# Updating the status of a workout
class UpdateWorkoutStatusView(APIView):
    def patch(self, request, workout_id):
        """
        Update the status of a workout.
        """
        try:
            workout = Workout.objects.get(id=workout_id)
        except Workout.DoesNotExist:
            return Response({'error': 'Workout not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['Started', 'Completed', 'Scheduled']:
            return Response({'error': 'Invalid status. Allowed values are: "Started", "Completed", "Scheduled".'}, status=status.HTTP_400_BAD_REQUEST)

        workout.status = new_status
        workout.save()

        return Response({'message': f'Workout status updated to {new_status}'}, status=status.HTTP_200_OK)


# Deleting workout from saved
class DeleteWorkoutView(APIView):
    """
    Delete a specific workout.
    """
    def delete(self, request, workout_id):
        try:
            # Find the workout by ID
            workout = Workout.objects.get(id=workout_id)
        except Workout.DoesNotExist:
            return Response({'error': 'Workout not found'}, status=status.HTTP_404_NOT_FOUND)

        # Delete the workout
        workout.delete()

        return Response({'message': 'Workout deleted successfully'}, status=status.HTTP_200_OK)


# Updating workout date
class UpdateWorkoutDateView(APIView):
    """
    Update the scheduled date of a workout.
    """
    def patch(self, request, workout_id):
        try:
            # Find the workout by ID
            workout = Workout.objects.get(id=workout_id)
        except Workout.DoesNotExist:
            return Response({'error': 'Workout not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if the workout is already completed
        if workout.status == 'Completed':
            return Response({'error': 'Cannot edit the date of a completed workout'}, status=status.HTTP_400_BAD_REQUEST)

        # Get the new date from the request
        new_scheduled_date = request.data.get('scheduled_date')
        if not new_scheduled_date:
            return Response({'error': 'Scheduled date is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Update the scheduled date
            workout.scheduled_date = new_scheduled_date
            workout.save()
            return Response({'message': 'Scheduled date updated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error updating workout date: {e}")
            return Response({'error': 'An error occurred while updating the date'}, status=status.HTTP_400_BAD_REQUEST)



# View for completing gym workouts
class CompleteWorkoutAPIView(APIView):

    def put(self, request, workout_id):
        user_id = request.query_params.get('user_id')

        try:
            logger.info(f"Starting completion process for workout_id: {workout_id}, user_id: {user_id}")

            # 1️⃣ --- Get User Object ---
            user = User.objects.get(id=user_id)

            # 2️⃣ --- Update Workout Status ---
            workout = Workout.objects.get(id=workout_id, owner=user)
            workout.status = 'Completed'
            workout.completed_date = now().date()
            workout.save()

            # 3️⃣ --- Award Points for Workout Completion ---
            leaderboard, _ = Leaderboard.objects.get_or_create(user=user)
            if not ScoreLog.objects.filter(user=user, workout_id=workout.id, score_type='Workout Completion').exists():
                leaderboard.total_score += 50
                leaderboard.weekly_score += 50
                leaderboard.monthly_score += 50
                leaderboard.save()

                ScoreLog.objects.create(
                    user=user,
                    score_type='Workout Completion',
                    score_value=50,
                    workout_id=workout.id
                )

            # 4️⃣ --- Process Sections and Movements ---
            sections_data = request.data.get('sections', [])
            section_ids = [section['section_id'] for section in sections_data]
            
            sections = Section.objects.filter(id__in=section_ids, workout=workout).select_related('workout')
            movements = SectionMovement.objects.filter(section__in=sections).select_related('section')
            sets = Set.objects.filter(section_movement__in=movements).select_related('section_movement')

            new_sets = []
            valid_movement_ids = set()  # Only add movements with at least one set with valid reps/weight

            for section_data in sections_data:
                for movement_data in section_data.get('movements', []):
                    movement_id = movement_data.get('movement_id')
                    movement = next((m for m in movements if m.id == movement_id), None)
                    
                    movement_has_valid_set = False  # Flag to check if at least one set is valid

                    if movement:
                        for set_data in movement_data.get('sets', []):
                            reps = set_data.get('reps') or 0
                            weight = set_data.get('weight') or 0
                            
                            new_sets.append(
                                Set(
                                    section_movement=movement,
                                    set_number=set_data.get('set_number'),
                                    reps=reps,
                                    weight=weight
                                )
                            )

                            # Check if this set has valid reps and weight
                            if reps > 0 and weight > 0:
                                movement_has_valid_set = True

                        if movement_has_valid_set:  # Add movement to unique list if at least one set is valid
                            valid_movement_ids.add(movement_id)

            if new_sets:
                Set.objects.bulk_create(new_sets)

            # 6️⃣ --- Award Points for Movement Tracking ---
            for movement_id in valid_movement_ids:
                if not ScoreLog.objects.filter(user=user, section_movement_id=movement_id, score_type='Movement Score').exists():
                    leaderboard.total_score += 5
                    leaderboard.weekly_score += 5
                    leaderboard.save()

                    ScoreLog.objects.create(
                        user=user,
                        score_type='Movement Score',
                        score_value=5,
                        section_movement_id=movement_id
                    )

                    logger.info(f"✅ 5 points awarded for movement tracking (movement_id: {movement_id}, user_id: {user_id})")

            logger.info(f"Workout with id {workout_id} completed successfully for user {user_id}")
            return Response({'message': 'Workout completed successfully!'}, status=200)
        
        except Exception as e:
            logger.exception(f"Unexpected error in CompleteWorkoutAPIView for workout_id {workout_id}: {e}")
            return Response({'error': str(e)}, status=500)
