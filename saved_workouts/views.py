from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import IntegrityError, transaction 
from rest_framework import status
from django.core.exceptions import ValidationError
import logging  # ✅ Import logging
from datetime import date, time, datetime
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
from django.utils import timezone

import traceback

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
from saved_hiit.models import SavedHIITWorkout
from saved_hiit_details.models import SavedHIITDetails
from saved_hiit_detail_movements.models import SavedHIITMovement
from notifications.models import ScheduledNotification

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
                elif workout_type == 'Hiit':  
                    return self._save_hiit_workout(data, user)
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

        template_code = self._build_template_code(data)

        # Process and save gym workout
        workout = Workout.objects.create(
            name=data['name'],
            workout_code=template_code,
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
        
        # schedule notification if required
        self._create_scheduled_notification_if_needed(workout, user, data)

        serialized_workout = PopulatedWorkoutSerializer(workout).data
        return Response({'message': 'Gym workout saved successfully', 'workout': serialized_workout}, status=201)




    def _save_running_workout(self, data, user):
        print("Received data:", data)  # Debugging the incoming payload
        # Determine workout number
        if data.get('workout_number'):
            workout_number = data['workout_number']  # Use provided workout_number for duplication
        else:
            workout_number = self._get_workout_number(user)  # Generate a new workout_number

        template_code = self._build_template_code(data)

        # Process and save running workout
        workout = Workout.objects.create(
            name=data['name'],
            workout_code=template_code,
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
                
        # schedule notification if required
        self._create_scheduled_notification_if_needed(workout, user, data)

        return Response({'message': 'Running workout saved successfully', 'workout_id': workout.id}, status=201)

    def _save_mobility_workout(self, data, user):
        # Determine workout number
        if data.get('workout_number'):
            workout_number = data['workout_number']
        else:
            workout_number = self._get_workout_number(user)

        template_code = self._build_template_code(data)

        # Process and save mobility workout
        workout = Workout.objects.create(
            name=data['name'],
            workout_code=template_code,
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
            session_type=mobility_session_data.get('session_type'),
        )

        skipped_movements = []  # Track movements that are missing

        # Save mobility details (but skip missing movements)
        for detail_data in mobility_session_data.get('saved_details', []):
            movement_name = detail_data.get('movement_name').strip()  # Trim whitespace

            try:
                movement = Movement.objects.get(exercise__iexact=movement_name)  # Case-insensitive lookup
            except Movement.DoesNotExist:
                skipped_movements.append(movement_name)
                continue  # Skip this movement and move to the next one

            SavedMobilityDetails.objects.create(
                details=saved_mobility_session,
                order=detail_data.get('order'),
                duration=detail_data.get('duration'),
                movements=movement,
            )

        response_data = {'message': 'Mobility workout saved successfully', 'workout_id': workout.id}

        # If any movements were skipped, include a warning in the response
        if skipped_movements:
            response_data['warning'] = f"Skipped movements: {', '.join(skipped_movements)} (not found in database)."

        # schedule notification if required
        self._create_scheduled_notification_if_needed(workout, user, data)

        return Response(response_data, status=201)



    def _save_hiit_workout(self, data, user):
        print("\n📥 Received HIIT Workout Data:")
        print(data)  # ✅ Log the full payload for debugging

        if data.get('workout_number'):
            workout_number = data['workout_number']
        else:
            workout_number = self._get_workout_number(user)

        template_code = self._build_template_code(data)

        try:
            with transaction.atomic():
                # print(f"🔄 Creating Workout Entry for {data['name']}...")

                # Create the Workout instance
                workout = Workout.objects.create(
                    name=data['name'],
                    workout_code=template_code,
                    workout_number=workout_number,
                    description=data.get('description', ''),
                    duration=data['duration'],
                    complexity=data.get('complexity', 1),
                    status=data.get('status', 'Saved'),
                    scheduled_date=data.get('scheduled_date'),
                    owner=user,
                    activity_type="Hiit",
                )

                # print(f"✅ Workout Created: {workout.id} - {workout.name}")

                # Create SavedHIITWorkout
                # print(f"🔄 Creating HIIT Workout Entry...")
                hiit_workout = SavedHIITWorkout.objects.create(
                    workout=workout,
                    workout_type=data['workout_type'], 
                    structure=data['structure'],
                    duration=data['duration'],
                    rpe=data.get('rpe', None),
                    comments=data.get('comments', None),
                )
                # print(f"✅ HIIT Workout Created: {hiit_workout.id} ({hiit_workout.workout_type})")

                # Save HIIT blocks
                for index, block_data in enumerate(data.get('sections', [])):
                    # print(f"🔄 Creating HIIT Block {index + 1}: {block_data.get('block_name', f'Block {index + 1}')}...")

                    hiit_block = SavedHIITDetails.objects.create(
                        hiit_workout=hiit_workout,
                        block_name=block_data.get('block_name', f"Block {index + 1}"),
                        rep_scheme=block_data.get('rep_scheme'),
                        order=index + 1
                    )
                    # print(f"✅ HIIT Block Created: {hiit_block.id} ({hiit_block.block_name})")

                    # Save movements within the block
                    for order, movement_data in enumerate(block_data['movements']):
                        # print(f"🔍 Fetching Movement ID {movement_data.get('id')}...")

                        movement = Movement.objects.filter(id=movement_data.get('id')).first()
                        if movement is None:
                            print(f"⚠️ WARNING: Movement ID {movement_data.get('id')} not found, setting to NULL.")

                        try:
                            hiit_movement = SavedHIITMovement.objects.create(
                                block=hiit_block,
                                movements=movement,
                                exercise_name=movement_data.get('exercise', 'Unknown Movement'),
                                order=order + 1,
                                rest_period=(movement_data.get('exercise') == 'Rest')  # Flagging rest periods
                            )
                            # print(f"✅ HIIT Movement Created: {hiit_movement.exercise_name} (Block {hiit_block.block_name})")
                        except Exception as e:
                            print(f"❌ ERROR: Failed to create HIIT Movement ({movement_data.get('exercise')})")
                            print(traceback.format_exc())  # ✅ Log the full stack trace

            # ✅ Successful Save
            serialized_workout = {
                "id": workout.id,
                "name": workout.name,
                "duration": workout.duration,
                "hiit_type": hiit_workout.workout_type,
                "structure": hiit_workout.structure,
            }
            
            # schedule notification if required
            self._create_scheduled_notification_if_needed(workout, user, data)
            
            print(f"🎉 HIIT Workout Saved Successfully: {serialized_workout}")
            return Response({'message': 'HIIT workout saved successfully', 'workout': serialized_workout}, status=201)

        except Exception as e:
            print(f"❌ ERROR: Exception during HIIT Workout Save!")
            print(traceback.format_exc())  # ✅ Log the entire traceback
            return Response({'error': f'An error occurred while saving the HIIT workout: {str(e)}'}, status=400)

    def _get_workout_number(self, user):
        last_workout = Workout.objects.filter(owner=user).order_by('-workout_number').first()
        return (last_workout.workout_number + 1) if last_workout else 1

    def _gather_gym_movement_ids(self, sections):
        """
        Go through the sections array and collect all Movement IDs
        in the order they appear, *excluding* Conditionings and Warm Ups.
        """
        movement_ids = []

        for section_data in sections:
            # Convert to lowercase for consistent checks
            section_name_lower = section_data['section_name'].lower()

            # Skip warm-up sections named "Warm Up A" or "Warm Up B"
            if "warm up" in section_name_lower:
                continue  # ignore this entire section

            # If it's "Conditioning," handle separately
            if section_name_lower == "conditioning" and 'conditioning_workout' in section_data:
                cond_movements = section_data['conditioning_workout']['movements']
                for mdata in cond_movements:
                    try:
                        mv = Movement.objects.get(exercise=mdata['movement_name'])
                        movement_ids.append(mv.id)
                    except Movement.DoesNotExist:
                        pass
            else:
                # Normal (non-warmup, non-conditioning) sections
                for mdata in section_data['movements']:
                    try:
                        mv = Movement.objects.get(exercise=mdata['movement_name'])
                        movement_ids.append(mv.id)
                    except Movement.DoesNotExist:
                        pass

        return movement_ids


    def _gather_mobility_pairs(self, data):
        """
        Suppose you want M-{movementId}-{duration} for each item.
        We'll gather from data['mobility_sessions']['saved_details'].
        """
        pairs = []
        mobility_session_data = data.get('mobility_sessions', {})
        saved_details = mobility_session_data.get('saved_details', [])
        for detail_data in saved_details:
            movement_name = detail_data.get('movement_name', '').strip()
            duration = detail_data.get('duration', 0)
            try:
                mv = Movement.objects.get(exercise__iexact=movement_name)
                pairs.append(mv.id)
                pairs.append(duration)
            except Movement.DoesNotExist:
                # If missing, skip or append placeholders
                # pairs.append(0)
                # pairs.append(duration)
                pass
        return pairs

    def _gather_hiit_movement_ids(self, sections):
        """
        If your HIIT data is in data['sections'], each block has movements:
        We'll gather each movement's ID in order.
        """
        movement_ids = []
        for block_data in sections:
            movements = block_data.get('movements', [])
            for mdata in movements:
                mv_id = mdata.get('id')  # Because you said you pass the movement ID
                if mv_id:
                    movement_ids.append(mv_id)
                else:
                    # If there's no ID, maybe skip or put 0
                    movement_ids.append(0)
        return movement_ids


    def _build_template_code(self, data):
        workout_type = data['activity_type']

        if workout_type == 'Running':
            session_data = data.get('running_sessions', {})
            code = f"R-{session_data.get('type', 'Intervals')}-{session_data.get('name','Unknown')}"
            return code

        elif workout_type == 'Gym':
            movement_ids = self._gather_gym_movement_ids(data['sections'])
            code = "G-" + "-".join(str(mid) for mid in movement_ids)
            return code

        elif workout_type == 'Mobility':
            pairs = self._gather_mobility_pairs(data)
            code = "M-" + "-".join(str(x) for x in pairs)
            return code

        elif workout_type == 'Hiit':
            hiit_type = data.get('workout_type','Unknown')
            movement_ids = self._gather_hiit_movement_ids(data['sections'])
            code = f"H-{hiit_type}-" + "-".join(str(mid) for mid in movement_ids)
            return code

        else:
            return "UNK-999"

    # def _create_scheduled_notification_if_needed(self, workout, user, data):
    #     """
    #     If the workout has a scheduled date, create a ScheduledNotification
    #     row for that date/time.
    #     """
    #     # 1) Check if scheduled_date is present
    #     scheduled_date = data.get('scheduled_date')
    #     if not scheduled_date:
    #         return  # No date => skip

    #     # 2) Parse scheduled_date (assuming it's a string like "2025-04-10")
    #     # If it's already a datetime or date object, skip the parsing part
    #     try:
    #         scheduled_date_obj = datetime.strptime(scheduled_date, "%Y-%m-%d").date()
    #     except ValueError:
    #         # If user gave an invalid date format, skip or handle error
    #         return

    #     # 3) Decide on a default reminder time (e.g. 8:00 AM), 
    #     #    or if your request has "reminder_time" you can parse that:
    #     reminder_hour = 16
    #     reminder_minute = 00
    #     # If you want to store or parse them from data, do that here:
    #     # reminder_hour = data.get('reminder_hour', 8)

    #     # 4) Combine date + time
    #     reminder_dt = datetime.combine(scheduled_date_obj, time(hour=reminder_hour, minute=reminder_minute))

    #     # 5) Create the notification row
    #     ScheduledNotification.objects.create(
    #         owner=user,
    #         workout=workout,
    #         scheduled_datetime=reminder_dt,
    #         title="Today's workout",
    #         body=f"Don't forget to complete your {workout.name} workout to get points",
    #     )


    # def _create_scheduled_notification_if_needed(self, workout, user, data):
    #     """
    #     Simplified logic with debug logs:
    #     - If scheduled_date > today => schedule at 20:00
    #     - If scheduled_date == today => parse scheduled_time
    #         if <17:00 => 20:00
    #         else => user_scheduled_time + 2h
    #     - If scheduled_date < today => skip
    #     """

    #     scheduled_date_str = data.get('scheduled_date')
    #     if not scheduled_date_str:
    #         logger.debug("No scheduled_date provided -> skipping notification.")
    #         return

    #     # Parse the scheduled_date
    #     try:
    #         scheduled_date_obj = datetime.strptime(scheduled_date_str, "%Y-%m-%d").date()
    #         logger.debug(f"Parsed scheduled_date_obj={scheduled_date_obj}")
    #     except ValueError:
    #         logger.warning(f"Invalid date format for scheduled_date: {scheduled_date_str} -> skipping.")
    #         return

    #     today_date = now().date()
    #     logger.debug(f"Today is {today_date}, scheduled_date is {scheduled_date_obj}")

    #     if scheduled_date_obj < today_date:
    #         logger.debug("scheduled_date < today -> skipping.")
    #         return

    #     # If future date -> always 20:00
    #     if scheduled_date_obj > today_date:
    #         reminder_dt = datetime.combine(scheduled_date_obj, time(hour=20, minute=0))
    #         logger.debug(f"scheduled_date > today -> reminder at {reminder_dt}")
    #     else:
    #         # scheduled_date == today
    #         # parse user_scheduled_time
    #         scheduled_time_str = data.get('scheduled_time')
    #         if not scheduled_time_str:
    #             logger.debug("No scheduled_time for same-day -> skipping.")
    #             return

    #         try:
    #             user_time = datetime.strptime(scheduled_time_str, "%H:%M").time()
    #             logger.debug(f"parsed user_time={user_time}")
    #         except ValueError:
    #             logger.warning(f"Invalid time format for scheduled_time: {scheduled_time_str} -> skipping.")
    #             return

    #         # Convert to datetime
    #         base_dt = datetime.combine(scheduled_date_obj, user_time)
    #         logger.debug(f"base_dt for user_time is {base_dt}")

    #         threshold_17 = datetime.combine(scheduled_date_obj, time(hour=17, minute=0))
    #         if base_dt < threshold_17:
    #             # <17:00 => set to 20:00
    #             reminder_dt = datetime.combine(scheduled_date_obj, time(hour=20, minute=0))
    #             logger.debug(f"user_time <17:00, so reminder_dt={reminder_dt}")
    #         else:
    #             # otherwise => user_time + 2h
    #             reminder_dt = base_dt + timedelta(hours=2)
    #             logger.debug(f"user_time >=17:00 => reminder_dt={reminder_dt}")

    #     # Finally, create the row if we have a reminder_dt
    #     if reminder_dt:
    #         ScheduledNotification.objects.create(
    #             owner=user,
    #             workout=workout,
    #             scheduled_datetime=reminder_dt,
    #             title="Workout Reminder",
    #             body=f"Don't forget to complete your {workout.name} workout to get points",
    #         )
    #         logger.info(f"Created reminder -> {reminder_dt} for user={user.id}, workout={workout.id}")


    def _create_scheduled_notification_if_needed(self, workout, user, data):
        """
        Timezone-aware approach using the server's timezone (UTC).
        - If scheduled_date < today => skip
        - If scheduled_date > today => schedule for 20:00 that day
        - If scheduled_date == today => compare now() with 17:00
            * if now < 17:00 => schedule 20:00
            * else => schedule now + 3 hours
        """
        scheduled_date_str = data.get('scheduled_date')
        if not scheduled_date_str:
            logger.debug("No scheduled_date provided -> skipping notification.")
            return

        # 1) Parse the user's date as a naive datetime at midnight
        try:
            # e.g. "2025-03-21" -> datetime(2025,3,21,0,0)
            scheduled_date_naive = datetime.strptime(scheduled_date_str, "%Y-%m-%d")
        except ValueError:
            logger.warning(f"Invalid date format for scheduled_date: {scheduled_date_str} -> skipping.")
            return

        # 2) Convert that naive datetime to an aware datetime in your server’s timezone (UTC)
        server_tz = timezone.get_default_timezone()  # Usually UTC if USE_TZ = True and TIME_ZONE='UTC'
        scheduled_date_aware = timezone.make_aware(scheduled_date_naive, server_tz)
        # That gives e.g. 2025-03-21 00:00 UTC

        # 3) Compare to current time (aware, in server_tz)
        current_dt = timezone.now()
        logger.debug(f"current_dt (UTC)={current_dt}, scheduled_date_aware={scheduled_date_aware}")

        # If scheduled_date < today => skip
        # We'll compare just the date() parts in the same timezone
        if scheduled_date_aware.date() < current_dt.date():
            logger.debug("scheduled_date < today -> skipping.")
            return

        # We'll eventually fill in reminder_dt (aware in server time)
        reminder_dt = None

        if scheduled_date_aware.date() > current_dt.date():
            # A future day => schedule 20:00 UTC that day
            naive_20 = datetime.combine(scheduled_date_aware.date(), time(hour=20, minute=0))
            reminder_dt = timezone.make_aware(naive_20, server_tz)
            logger.debug(f"scheduled_date > today -> reminder_dt={reminder_dt}")
        else:
            # scheduled_date == today
            # We'll compare now() to 17:00 UTC
            naive_17 = datetime.combine(current_dt.date(), time(hour=17, minute=0))
            threshold_17 = timezone.make_aware(naive_17, server_tz)

            if current_dt < threshold_17:
                # schedule 20:00 today in UTC
                naive_20 = datetime.combine(current_dt.date(), time(hour=20, minute=0))
                reminder_dt = timezone.make_aware(naive_20, server_tz)
                logger.debug(f"current_dt <17:00 => reminder_dt={reminder_dt}")
            else:
                # schedule now + 3 hours
                reminder_dt = current_dt + timedelta(hours=3)
                logger.debug(f"current_dt >=17:00 => reminder_dt={reminder_dt}")

        # 4) Save the aware reminder_dt to DB
        if reminder_dt:
            ScheduledNotification.objects.create(
                owner=user,
                workout=workout,
                scheduled_datetime=reminder_dt,  # fully aware, in UTC
                title="Workout Reminder",
                body=f"Don't forget to complete your {workout.name} workout to get points",
            )
            logger.info(f"Created reminder -> {reminder_dt.isoformat()} for user={user.id}, workout={workout.id}")
            
            
        
        
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


class GetSingleWorkoutView(APIView):
    """
    Get a single workout and return all related workout details along with 
    the last 3 movement histories for each movement within the workout.
    """

    def get(self, request, workout_id):
        user_id = request.query_params.get('user_id')

        try:
            # Fetch the workout and its related data
            try:
                workout = Workout.objects.prefetch_related(
                    Prefetch(
                        'workout_sections__section_movement_details',
                        queryset=SectionMovement.objects.prefetch_related('workout_sets')
                    )
                ).select_related('owner').get(id=workout_id, owner=user_id)
                print(f"Fetched workout {workout_id} for user {user_id}")
            except Workout.DoesNotExist:
                print(f"Workout {workout_id} does not exist for user {user_id}")
                return Response({'error': 'Workout not found'}, status=status.HTTP_404_NOT_FOUND)

            # Serialize workout data
            serializer = PopulatedWorkoutSerializer(workout)
            workout_data = serializer.data

            # Extract movement IDs for history query
            movement_ids = [
                movement['movements']['id']
                for section in workout_data['workout_sections']
                for movement in section['section_movement_details']
                if movement.get('movements')
            ]
            print(f"Movement IDs extracted: {movement_ids}")

            if not movement_ids:
                print("No movement IDs found for this workout.")
                return Response({"workout": workout_data, "movement_history": {}}, status=status.HTTP_200_OK)

            # Get the last 3 workouts for each movement
            movement_history = {}

            for movement_id in movement_ids:
                print(f"Fetching history for movement ID {movement_id}")

                # Fetch the last 3 completed workouts for this movement
                last_3_workouts = (
                    Workout.objects.filter(
                        workout_sections__section_movement_details__movements__id=movement_id,
                        owner=user_id,
                        status="Completed"
                    )
                    .distinct()
                    .order_by('-completed_date')[:3]
                )

                for workout in last_3_workouts:
                    workout_sets = Set.objects.filter(
                        section_movement__movements__id=movement_id,
                        section_movement__section__workout=workout
                    ).select_related(
                        'section_movement__movements',
                        'section_movement__section__workout'
                    ).order_by('set_number')

                    sets_data = [
                        {
                            "set_number": workout_set.set_number,
                            "reps": workout_set.reps,
                            "weight": workout_set.weight
                        }
                        for workout_set in workout_sets
                    ]

                    if movement_id not in movement_history:
                        movement_history[movement_id] = []

                    movement_history[movement_id].append({
                        "workout_id": workout.id,
                        "completed_date": workout.completed_date,
                        "movement_difficulty": workout_sets[0].section_movement.movement_difficulty if workout_sets else None,
                        "sets": sets_data
                    })

            # Sort each movement's workout history by date
            for movement_id in movement_history:
                movement_history[movement_id].sort(key=lambda x: x['completed_date'], reverse=True)

            print(f"Processed movement history: {movement_history}")

            return Response({
                "workout": workout_data,
                "movement_history": movement_history
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Unexpected error in GetSingleWorkoutView: {str(e)}")
            return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GetSingleRunningWorkoutView(APIView):
    """
    Get a single running workout and return:
    - All related running session details, including intervals and split times.
    - The last 3 completed workouts with the same description.
    - The last 3 completed running workouts generally.
    """

    def get(self, request, workout_id):
        user_id = request.query_params.get('user_id')

        try:
            # Fetch the main workout
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

            # Fetch last 3 workouts with the same description
            try:
                similar_workouts = Workout.objects.filter(
                    owner=user_id,
                    activity_type="Running",
                    description=workout.description,  # Match on description
                    status="Completed"
                ).exclude(id=workout.id).order_by('-completed_date')[:3]
                similar_workouts_data = PopulatedWorkoutSerializer(similar_workouts, many=True).data
            except Exception as e:
                return Response({'error': f'Error fetching similar workouts: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Fetch last 3 running workouts generally
            try:
                recent_running_workouts = Workout.objects.filter(
                    owner=user_id,
                    activity_type="Running",
                    status="Completed"
                ).exclude(id=workout.id).order_by('-completed_date')[:3]
                recent_running_workouts_data = PopulatedWorkoutSerializer(recent_running_workouts, many=True).data
            except Exception as e:
                return Response({'error': f'Error fetching recent running workouts: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Return the response with all the data
            return Response({
                "workout": serialized_workout,
                "similar_workouts": similar_workouts_data,
                "recent_running_workouts": recent_running_workouts_data,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetSingleMobilityWorkoutView(APIView):
    """
    Get a single mobility workout and return:
    - All related mobility session details, including movements.
    - The last 3 completed workouts with the same description.
    - The last 3 completed mobility workouts generally.
    """

    def get(self, request, workout_id):
        user_id = request.query_params.get('user_id')
        print('User id: ', user_id)
        try:
            # Fetch the main workout
            try:
                workout = Workout.objects.prefetch_related(
                    Prefetch(
                        'mobility_sessions',
                        queryset=SavedMobilitySession.objects.prefetch_related(
                            Prefetch(
                                'mobility_details',
                                queryset=SavedMobilityDetails.objects.select_related('movements')
                            )
                        )
                    )
                ).get(id=workout_id, owner=user_id)

                print(f"Fetched Workout: {workout}")
                print(f"Workout Activity Type: {workout.activity_type}")

                # Debug Mobility Sessions
                mobility_sessions = workout.mobility_sessions.all()
                print(f"Mobility Sessions Count: {mobility_sessions.count()}")

                for session in mobility_sessions:
                    print(f"Checking session: {session}")  # Ensure session exists

                    # Check if the session has an ID
                    if not hasattr(session, 'id'):
                        print("Error: session has no ID")
                        continue  # Skip this session if no ID

                    print(f"Session ID: {session.id}")  # Should print the session ID if valid

                    # Use the correct related name: `mobility_details` instead of `saved_details`
                    if not hasattr(session, 'mobility_details'):
                        print(f"Session ID {session.id} has no mobility_details attribute.")
                        continue

                    mobility_details = getattr(session, 'mobility_details', None)

                    if mobility_details is None:
                        print(f"Session ID {session.id} has no mobility details!")
                        continue  # Skip processing this session

                    print(f"Session ID: {session.id}, Mobility Details Count: {mobility_details.count()}")


            except Workout.DoesNotExist:
                return Response({'error': 'Workout not found'}, status=status.HTTP_404_NOT_FOUND)
            
            print('Made it to this point a')

            # Ensure it's a mobility workout
            if workout.activity_type != "Mobility":
                return Response({'error': 'This endpoint only handles mobility workouts.'}, status=status.HTTP_400_BAD_REQUEST)
            print('Made it to this point b')


            # Serialize the workout and mobility session data
            try:
                serializer = PopulatedWorkoutSerializer(workout)
                serialized_workout = serializer.data
                print('serialized mobility: ', serialized_workout)
            except Exception as e:
                return Response({'error': f'Error serializing workout data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Fetch last 3 workouts with the same description
            try:
                similar_workouts = Workout.objects.filter(
                    owner=user_id,
                    activity_type="Mobility",
                    description=workout.description,  # Match on description
                    status="Completed"
                ).exclude(id=workout.id).order_by('-completed_date')[:3]
                similar_workouts_data = PopulatedWorkoutSerializer(similar_workouts, many=True).data
            except Exception as e:
                return Response({'error': f'Error fetching similar workouts: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Fetch last 3 mobility workouts generally
            try:
                recent_mobility_workouts = Workout.objects.filter(
                    owner=user_id,
                    activity_type="Mobility",
                    status="Completed"
                ).exclude(id=workout.id).order_by('-completed_date')[:3]
                recent_mobility_workouts_data = PopulatedWorkoutSerializer(recent_mobility_workouts, many=True).data
            except Exception as e:
                return Response({'error': f'Error fetching recent mobility workouts: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Return the response with all the data
            return Response({
                "workout": serialized_workout,
                # "similar_workouts": similar_workouts_data,
                # "recent_mobility_workouts": recent_mobility_workouts_data,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GetSingleHiitWorkoutView(APIView):
    """
    Get a single HIIT workout and return:
    - All related HIIT session details, including movements.
    - The last 3 completed workouts with the same workout number.
    - The last 3 completed HIIT workouts generally.
    """

    def get(self, request, workout_id):
        user_id = request.query_params.get('user_id')
        print('User ID:', user_id)

        try:
            # Fetch the main HIIT workout
            try:
                workout = Workout.objects.prefetch_related(
                    Prefetch(
                        'hiit_sessions',
                        queryset=SavedHIITWorkout.objects.prefetch_related(
                            Prefetch(
                                'hiit_details',
                                queryset=SavedHIITDetails.objects.prefetch_related(
                                    Prefetch(
                                        'hiit_movements',
                                        queryset=SavedHIITMovement.objects.select_related('movements')
                                    )
                                )
                            )
                        )
                    )
                ).get(id=workout_id, owner=user_id)

                print(f"✅ Fetched HIIT Workout: {workout.name} (ID: {workout.id})")

            except Workout.DoesNotExist:
                return Response({'error': 'Workout not found'}, status=status.HTTP_404_NOT_FOUND)

            # Ensure it's a HIIT workout
            if workout.activity_type != "Hiit":
                return Response({'error': 'This endpoint only handles HIIT workouts.'}, status=status.HTTP_400_BAD_REQUEST)

            # Serialize the workout and HIIT session data
            try:
                serializer = PopulatedWorkoutSerializer(workout)
                serialized_workout = serializer.data
                print(f"✅ Serialized HIIT Workout Data: {serialized_workout['name']}")
            except Exception as e:
                return Response({'error': f'Error serializing workout data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Fetch last 3 workouts with the same workout number
            try:
                similar_workouts = Workout.objects.filter(
                    owner=user_id,
                    activity_type="Hiit",
                    workout_number=workout.workout_number,
                    status="Completed"
                ).exclude(id=workout.id).order_by('-completed_date')[:3]

                similar_workouts_data = PopulatedWorkoutSerializer(similar_workouts, many=True).data
                print(f"✅ Found {len(similar_workouts_data)} similar HIIT workouts")
            except Exception as e:
                return Response({'error': f'Error fetching similar HIIT workouts: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Fetch last 3 HIIT workouts generally
            try:
                recent_hiit_workouts = Workout.objects.filter(
                    owner=user_id,
                    activity_type="Hiit",
                    status="Completed"
                ).exclude(id=workout.id).order_by('-completed_date')[:3]

                recent_hiit_workouts_data = PopulatedWorkoutSerializer(recent_hiit_workouts, many=True).data
                print(f"✅ Found {len(recent_hiit_workouts_data)} recent HIIT workouts")
            except Exception as e:
                return Response({'error': f'Error fetching recent HIIT workouts: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Return the response with all the data
            return Response({
                "workout": serialized_workout,
                "similar_workouts": similar_workouts_data,
                "recent_hiit_workouts": recent_hiit_workouts_data,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    
# Updating the status of a workout
class UpdateWorkoutStatusView(APIView):
    def patch(self, request, workout_id):
        """
        Update the status of a workout, but do not overwrite "Completed" status.
        """
        try:
            workout = Workout.objects.get(id=workout_id)
        except Workout.DoesNotExist:
            return Response({'error': 'Workout not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['Started', 'Completed', 'Scheduled']:
            return Response({'error': 'Invalid status. Allowed values are: "Started", "Completed", "Scheduled".'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent overwriting if the workout is already completed
        if workout.status == 'Completed':
            return Response({'message': 'Workout is already completed and cannot be changed to another status.'}, status=status.HTTP_200_OK)

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

            # 3️⃣ --- Award Points for Workout Completion (50 points) ---
            leaderboard, _ = Leaderboard.objects.get_or_create(user=user)
            if not ScoreLog.objects.filter(user=user, workout_id=workout.id, score_type='Workout Completion').exists():
                # Real-time scoreboard update
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

            # 4️⃣ --- Process Sections and Movements (same as before) ---
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
            conditioning_updates = []  # For bulk updating ConditioningWorkout entries

            # We will track how many "strength" movements exist and how many are "fully logged"
            strength_keywords = ["strong", "build", "pump"]  # case-insensitive
            strength_movements_count = 0
            strength_fully_logged_count = 0

            for section_data in sections_data:
                # Update conditioning workouts
                if 'conditioning_workouts' in section_data:
                    for conditioning_data in section_data['conditioning_workouts']:
                        conditioning_id = conditioning_data.get('conditioning_id')
                        conditioning_instance = ConditioningWorkout.objects.filter(id=conditioning_id).first()
                        if conditioning_instance:
                            conditioning_instance.comments = conditioning_data.get('comments', conditioning_instance.comments)
                            conditioning_instance.rpe = conditioning_data.get('rpe', conditioning_instance.rpe)
                            conditioning_updates.append(conditioning_instance)

                # Update standard movements (sets)
                for movement_data in section_data.get('movements', []):
                    movement_id = movement_data.get('movement_id')
                    movement = next((m for m in movements if m.id == movement_id), None)
                    
                    if not movement:
                        continue

                    # Determine if this movement belongs to a "strength" section
                    section_obj = movement.section  # from .select_related('section')
                    section_name_lower = section_obj.section_name.lower() if section_obj.section_name else ""
                    is_strength_section = any(kw in section_name_lower for kw in strength_keywords)

                    # We'll track if this movement is "fully logged" if it has at least one set with reps>0, weight>0
                    movement_has_valid_set = False

                    # Process sets
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

                        # If any set has reps>0 and weight>0, we consider this movement "fully logged"
                        if reps > 0 and weight > 0:
                            movement_has_valid_set = True

                    # If this is a "strength" section's movement
                    if is_strength_section:
                        # Count total strength movements
                        strength_movements_count += 1
                        if movement_has_valid_set:
                            strength_fully_logged_count += 1

            # Save sets and conditioning updates
            if new_sets:
                Set.objects.bulk_create(new_sets)
            if sets_to_update:
                Set.objects.bulk_update(sets_to_update, ['reps', 'weight'])
            if conditioning_updates:
                ConditioningWorkout.objects.bulk_update(conditioning_updates, ['comments', 'rpe'])

            # 5️⃣ --- NEW: Award Single +20 If ALL "Strength" Movements Are Fully Logged ---
            if strength_movements_count > 0 and (strength_fully_logged_count == strength_movements_count):
                # Avoid double awarding if they've completed this before
                if not ScoreLog.objects.filter(user=user, workout_id=workout.id, score_type='Full Strength Logging').exists():
                    leaderboard.total_score += 20
                    leaderboard.weekly_score += 20
                    leaderboard.monthly_score += 20
                    leaderboard.save()

                    ScoreLog.objects.create(
                        user=user,
                        score_type='Full Strength Logging',
                        score_value=20,
                        workout_id=workout.id
                    )
                    logger.info(f"✅ Awarded 20 points for fully logging all 'strength' movements for workout {workout_id}, user {user_id}")

            logger.info(f"Workout with id {workout_id} completed successfully for user {user_id}")
            return Response({'message': 'Workout completed successfully!'}, status=200)
        
        except Exception as e:
            logger.exception(f"Unexpected error in CompleteWorkoutAPIView for workout_id {workout_id}: {e}")
            return Response({'error': str(e)}, status=500)
