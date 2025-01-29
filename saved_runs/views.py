from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.timezone import now
from django.db import transaction
from django.db.models import F
from .models import SavedRunningSession
from saved_workouts.models import Workout
from saved_run_intervals.models import SavedRunningInterval
from saved_run_interval_times.models import SavedRunningSplitTime
from leaderboard.models import Leaderboard
from score_logging.models import ScoreLog
from django.contrib.auth import get_user_model

User = get_user_model()

import logging

logger = logging.getLogger(__name__)

# class CompleteRunningWorkoutAPIView(APIView):
#     """
#     API view to complete a running workout. Saves intervals, split times, updates the workout status,
#     and stores overall RPE and comments for the session.
#     """

#     def put(self, request, workout_id):
#         user_id = request.query_params.get('user_id')

#         try:
#             logger.info(f"Starting completion process for running workout_id: {workout_id}, user_id: {user_id}")

#             # 1️⃣ --- Get User Object ---
#             user = User.objects.get(id=user_id)

#             # 2️⃣ --- Update Workout Status ---
#             workout = Workout.objects.get(id=workout_id, owner=user, activity_type="Running")
#             workout.status = 'Completed'
#             workout.completed_date = now().date()
#             workout.save()

#             # 3️⃣ --- Award Points for Workout Completion ---
#             leaderboard, _ = Leaderboard.objects.get_or_create(user=user)
#             if not ScoreLog.objects.filter(user=user, workout_id=workout.id, score_type='Workout Completion').exists():
#                 leaderboard.total_score += 50
#                 leaderboard.weekly_score += 50
#                 leaderboard.monthly_score += 50
#                 leaderboard.save()

#                 ScoreLog.objects.create(
#                     user=user,
#                     score_type='Workout Completion',
#                     score_value=50,
#                     workout_id=workout.id
#                 )

#             # 4️⃣ --- Process Running Sessions ---
#             running_session = SavedRunningSession.objects.get(workout=workout)

#             # Update RPE and comments for the session
#             running_session.rpe = request.data.get('rpe', running_session.rpe)
#             running_session.comments = request.data.get('comments', running_session.comments)
#             running_session.save()

#             # 5️⃣ --- Process Intervals and Split Times ---
#             intervals_data = request.data.get('intervals', [])
#             new_intervals = []
#             new_split_times = []

#             for interval_data in intervals_data:
#                 interval = SavedRunningInterval.objects.create(
#                     saved_session=running_session,
#                     repeat_variation=interval_data.get('repeat_variation'),
#                     repeats=interval_data.get('repeats'),
#                     repeat_distance=interval_data.get('repeat_distance'),
#                     target_pace=interval_data.get('target_pace'),
#                     comments=interval_data.get('comments'),
#                     rest_time=interval_data.get('rest_time')
#                 )
#                 new_intervals.append(interval)

#                 for split_data in interval_data.get('split_times', []):
#                     split_time = SavedRunningSplitTime(
#                         saved_interval=interval,
#                         repeat_number=split_data['repeat_number'],
#                         target_time=split_data.get('target_time'),
#                         actual_time=split_data.get('actual_time'),
#                         comments=split_data.get('comments', None)
#                     )
#                     new_split_times.append(split_time)

#             if new_split_times:
#                 SavedRunningSplitTime.objects.bulk_create(new_split_times)

#             # 6️⃣ --- Award Points for Interval Completion ---
#             for interval in new_intervals:
#                 if not ScoreLog.objects.filter(user=user, workout_id=workout.id, score_type='Interval Completion').exists():
#                     leaderboard.total_score += 5
#                     leaderboard.weekly_score += 5
#                     leaderboard.save()

#                     ScoreLog.objects.create(
#                         user=user,
#                         score_type='Interval Completion',
#                         score_value=5,
#                         workout_id=workout.id  # Use workout_id for association
#                     )

#                     logger.info(f"✅ 5 points awarded for interval completion (interval_id: {interval.id}, user_id: {user_id})")

#             logger.info(f"Running workout with id {workout_id} completed successfully for user {user_id}")
#             return Response({'message': 'Running workout completed successfully!'}, status=200)

#         except Exception as e:
#             logger.exception(f"Unexpected error in CompleteRunningWorkoutAPIView for workout_id {workout_id}: {e}")
#             return Response({'error': str(e)}, status=500)


class CompleteRunningWorkoutAPIView(APIView):
    """
    API view to complete a running workout. Saves split times, updates the workout status,
    and stores overall RPE and comments for the session.
    """

    def put(self, request, workout_id):
        user_id = request.query_params.get('user_id')

        try:
            logger.info(f"Starting completion process for running workout_id: {workout_id}, user_id: {user_id}")

            # 1️⃣ --- Get User Object ---
            user = User.objects.get(id=user_id)

            # 2️⃣ --- Update Workout Status ---
            workout = Workout.objects.get(id=workout_id, owner=user, activity_type="Running")
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

            # 4️⃣ --- Process Running Sessions ---
            running_session = SavedRunningSession.objects.get(workout=workout)

            # Update RPE and comments for the session
            running_session.rpe = request.data.get('rpe', running_session.rpe)
            running_session.comments = request.data.get('comments', running_session.comments)
            running_session.save()

            # 5️⃣ --- Update Split Times Only ---
            intervals_data = request.data.get('intervals', [])
            for interval_data in intervals_data:
                try:
                    interval = SavedRunningInterval.objects.get(id=interval_data['id'])
                except SavedRunningInterval.DoesNotExist:
                    logger.warning(f"Interval with ID {interval_data['id']} does not exist. Skipping.")
                    continue

                for split_data in interval_data.get('split_times', []):
                    try:
                        split_time = SavedRunningSplitTime.objects.get(id=split_data['id'])
                        # Update only actual time and comments
                        split_time.actual_time = split_data.get('actual_time', split_time.actual_time)
                        split_time.comments = split_data.get('comments', split_time.comments)
                        split_time.save()
                    except SavedRunningSplitTime.DoesNotExist:
                        logger.warning(f"Split time with ID {split_data['id']} does not exist. Skipping.")

            # 6️⃣ --- Log Completion ---
            logger.info(f"Running workout with id {workout_id} completed successfully for user {user_id}")
            return Response({'message': 'Running workout completed successfully!'}, status=200)

        except Exception as e:
            logger.exception(f"Unexpected error in CompleteRunningWorkoutAPIView for workout_id {workout_id}: {e}")
            return Response({'error': str(e)}, status=500)
