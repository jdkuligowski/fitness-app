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

from saved_runs.models import SavedRunningSession
from running_sessions.models import RunningSession
from saved_run_intervals.models import SavedRunningInterval
from saved_run_interval_times.models import SavedRunningSplitTime
from saved_runs.serializers.populated import PopulatedSavedRunningSessionSerializer
from saved_conditioning.models import ConditioningWorkout
from conditioning_summary.models import ConditioningOverview
from mobility_overview.models import MobilityWorkout
from mobility_details.models import MobilityWorkoutDetails
from saved_mobility.models import SavedMobilitySession
from saved_mobility_details.models import SavedMobilityDetails

User = get_user_model()
logger = logging.getLogger(__name__)

class SaveWorkoutView(APIView):
    def post(self, request):
        data = request.data
        print('data received ->', data)

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
                elif workout_type == 'Mobility':
                    return self._save_mobility_workout(data, user)
                else:
                    return Response({'error': f'Unsupported workout type: {workout_type}'}, status=400)

        except Exception as e:
            print(e)
            return Response({'error': 'An error occurred while saving the workout'}, status=400)

    def _save_gym_workout(self, data, user):
        # Determine workout number
        if data.get('workout_number'):
            workout_number = data['workout_number']  # Use provided workout_number for duplication
        else:
            workout_number = self._get_workout_number(user)  # Generate a new workout_number

        # Process and save gym workout
        workout = Workout.objects.create(
            name=data['name'],
            workout_number=workout_number,
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

            # Check if the section is "Conditioning"
            if section_data['section_name'] == "Conditioning" and 'conditioning_workout' in section_data:
                conditioning_workout = section_data['conditioning_workout']
                conditioning_overview_id = conditioning_workout.get('conditioning_overview_id')

                if conditioning_overview_id is None:  # Use None to check for missing values
                    return Response({"error": "conditioning_overview_id is required for Conditioning sections"}, status=400)

                try:
                    conditioning_overview = ConditioningOverview.objects.get(id=conditioning_overview_id)
                except ConditioningOverview.DoesNotExist:
                    return Response(
                        {'error': f"ConditioningOverview with ID {conditioning_overview_id} does not exist"},
                        status=400
                    )

                # Create ConditioningWorkout
                ConditioningWorkout.objects.create(
                    section=section,
                    conditioning_overview=conditioning_overview,
                    comments=conditioning_workout.get('comments'),
                    rpe=conditioning_workout.get('rpe'),
                )

                # Save Conditioning movements
                for movement_data in conditioning_workout['movements']:
                    try:
                        movement = Movement.objects.get(exercise=movement_data['movement_name'])
                    except Movement.DoesNotExist:
                        return Response(
                            {'error': f"Movement '{movement_data['movement_name']}' does not exist"},
                            status=400
                        )
                    SectionMovement.objects.create(
                        section=section,
                        movements=movement,
                        movement_order=movement_data['movement_order'],
                    )
            else:
                # Save standard movements for non-conditioning sections
                for movement_data in section_data['movements']:
                    try:
                        movement = Movement.objects.get(exercise=movement_data['movement_name'])
                    except Movement.DoesNotExist:
                        return Response(
                            {'error': f"Movement '{movement_data['movement_name']}' does not exist"},
                            status=400
                        )
                    SectionMovement.objects.create(
                        section=section,
                        movements=movement,
                        movement_order=movement_data['movement_order'],
                    )

        serialized_workout = PopulatedWorkoutSerializer(workout).data
        return Response({'message': 'Gym workout saved successfully', 'workout': serialized_workout}, status=201)




    def _save_running_workout(self, data, user):
        print("Received data:", data)  # Debugging the incoming payload
        # Determine workout number
        if data.get('workout_number'):
            workout_number = data['workout_number']  # Use provided workout_number for duplication
        else:
            workout_number = self._get_workout_number(user)  # Generate a new workout_number


        # Create the base Workout instance
        workout = Workout.objects.create(
            name=data['name'],
            workout_number=workout_number,
            description=data['description'],
            duration=data['duration'],
            complexity=0,  # Fixed complexity for running workouts
            status=data.get('status', 'Saved'),
            scheduled_date=data.get('scheduled_date'),
            owner=user,
            activity_type="Running",
        )

        # Create SavedRunningSession
        running_session_data = data['running_sessions']
        running_session = RunningSession.objects.get(id=running_session_data['running_session_id'])

        saved_running_session = SavedRunningSession.objects.create(
            workout=workout,
            running_session=running_session,
            warmup_distance=running_session_data.get('warmup_distance'),
            cooldown_distance=running_session_data.get('cooldown_distance'),
            total_distance=running_session_data.get('total_distance'),
            rpe=running_session_data.get('rpe'),
            comments=running_session_data.get('comments'),
            workout_notes=running_session_data.get('comments'),
            suggested_warmup_pace=running_session_data.get('suggested_warmup_pace'),
            suggested_cooldown_pace=running_session_data.get('suggested_cooldown_pace'),
        )

        # Save intervals
        for interval_data in running_session_data.get('saved_intervals', []):
            saved_interval = SavedRunningInterval.objects.create(
                saved_session=saved_running_session,
                repeat_variation=interval_data.get('repeat_variation'),
                repeats=interval_data.get('repeats'),
                repeat_distance=interval_data.get('repeat_distance'),
                target_pace=interval_data.get('target_interval'),
                comments=interval_data.get('comments'),
                rest_time=interval_data.get('rest_time'),
            )

            # Save split times
            for split_time in interval_data.get('split_times', []):
                SavedRunningSplitTime.objects.create(
                    saved_interval=saved_interval,
                    repeat_number=split_time['repeat_number'],
                    target_time=split_time.get('time_in_seconds'),
                    actual_time=split_time.get('actual_time'),
                    comments=split_time.get('comments', None),
                )

        return Response({'message': 'Running workout saved successfully', 'workout_id': workout.id}, status=201)

    def _save_mobility_workout(self, data, user):
        # Determine workout number
        if data.get('workout_number'):
            workout_number = data['workout_number']
        else:
            workout_number = self._get_workout_number(user)

        # Create the base Workout instance
        workout = Workout.objects.create(
            name=data['name'],
            workout_number=workout_number,
            description=data['description'],
            duration=data['duration'],
            complexity=0,  # Fixed complexity for mobility
            status=data.get('status', 'Saved'),
            scheduled_date=data.get('scheduled_date'),
            owner=user,
            activity_type="Mobility",
        )

        # Create SavedMobilitySession
        mobility_session_data = data.get('mobility_sessions')
        if not mobility_session_data:
            return Response({'error': 'Mobility session data is required'}, status=400)

        saved_mobility_session = SavedMobilitySession.objects.create(
            workout=workout,
            number_of_movements=mobility_session_data.get('number_of_movements'),
            session_video=mobility_session_data.get('session_video'),
            rpe=mobility_session_data.get('rpe'),
            comments=mobility_session_data.get('comments'),
        )

        # Save mobility details
        for detail_data in mobility_session_data.get('saved_details', []):
            movement_name = detail_data.get('movement_name')
            try:
                movement = Movement.objects.get(exercise=movement_name)
            except Movement.DoesNotExist:
                return Response(
                    {'error': f"Movement '{movement_name}' does not exist"},
                    status=400
                )
            SavedMobilityDetails.objects.create(
                details=saved_mobility_session,
                order=detail_data.get('order'),
                duration=detail_data.get('duration'),
                movements=movement,
            )

        return Response({'message': 'Mobility workout saved successfully', 'workout_id': workout.id}, status=201)


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




class GetSingleRunningWorkoutView(APIView):
    """
    Get a single running workout and return all related running session details,
    including intervals and split times.
    """

    def get(self, request, workout_id):
        user_id = request.query_params.get('user_id')

        try:
            # Fetch the Workout object with related running sessions and intervals
            try:
                workout = Workout.objects.prefetch_related(
                    Prefetch(
                        'running_sessions',
                        queryset=SavedRunningSession.objects.prefetch_related(
                            Prefetch(
                                'saved_intervals',
                                queryset=SavedRunningInterval.objects.prefetch_related(
                                    'split_times'
                                )
                            )
                        )
                    )
                ).get(id=workout_id, owner=user_id)
            except Workout.DoesNotExist:
                return Response({'error': 'Workout not found'}, status=status.HTTP_404_NOT_FOUND)

            # Ensure it's a running workout
            if workout.activity_type != "Running":
                return Response({'error': 'This endpoint only handles running workouts.'}, status=status.HTTP_400_BAD_REQUEST)

            # Serialize the workout and running session data
            try:
                serializer = PopulatedWorkoutSerializer(workout)
                serialized_workout = serializer.data
            except Exception as e:
                return Response({'error': f'Error serializing workout data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response(serialized_workout, status=status.HTTP_200_OK)

        except Exception as e:
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
            existing_sets = Set.objects.filter(section_movement__in=movements).select_related('section_movement')

            # Create mappings for fast lookup
            existing_sets_map = {
                (set_instance.section_movement_id, set_instance.set_number): set_instance
                for set_instance in existing_sets
            }

            new_sets = []
            sets_to_update = []
            valid_movement_ids = set()  # Only add movements with at least one set with valid reps/weight
            conditioning_updates = []  # For bulk updating ConditioningWorkout entries

            for section_data in sections_data:
                if 'conditioning_workouts' in section_data:
                    # Handle ConditioningWorkout details
                    for conditioning_data in section_data['conditioning_workouts']:
                        conditioning_id = conditioning_data.get('conditioning_id')
                        conditioning_instance = ConditioningWorkout.objects.filter(id=conditioning_id).first()

                        if conditioning_instance:
                            conditioning_instance.comments = conditioning_data.get('comments', conditioning_instance.comments)
                            conditioning_instance.rpe = conditioning_data.get('rpe', conditioning_instance.rpe)
                            conditioning_updates.append(conditioning_instance)

                # Handle standard movements
                for movement_data in section_data.get('movements', []):
                    movement_id = movement_data.get('movement_id')
                    movement = next((m for m in movements if m.id == movement_id), None)
                    
                    movement_has_valid_set = False  # Flag to check if at least one set is valid

                    if movement:
                        for set_data in movement_data.get('sets', []):
                            reps = set_data.get('reps') or 0
                            weight = set_data.get('weight') or 0
                            set_number = set_data.get('set_number')

                            existing_set = existing_sets_map.get((movement_id, set_number))

                            if existing_set:
                                # Update existing set
                                existing_set.reps = reps
                                existing_set.weight = weight
                                sets_to_update.append(existing_set)
                            else:
                                # Create new set
                                new_sets.append(
                                    Set(
                                        section_movement=movement,
                                        set_number=set_number,
                                        reps=reps,
                                        weight=weight
                                    )
                                )

                            # Check if this set has valid reps and weight
                            if reps > 0 and weight > 0:
                                movement_has_valid_set = True

                        if movement_has_valid_set:  # Add movement to unique list if at least one set is valid
                            valid_movement_ids.add(movement_id)

            # Save sets and conditioning updates
            if new_sets:
                Set.objects.bulk_create(new_sets)
            
            if sets_to_update:
                Set.objects.bulk_update(sets_to_update, ['reps', 'weight'])
            
            if conditioning_updates:
                ConditioningWorkout.objects.bulk_update(conditioning_updates, ['comments', 'rpe'])

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
