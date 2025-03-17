from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.timezone import now
from django.db import transaction
from leaderboard.models import Leaderboard
from score_logging.models import ScoreLog
from saved_workouts.models import Workout
from saved_hiit.models import SavedHIITWorkout  # Import the HIIT session model
from django.contrib.auth import get_user_model

User = get_user_model()
import logging

logger = logging.getLogger(__name__)

class CompleteHIITWorkoutAPIView(APIView):
    """
    API view to complete a HIIT workout. Saves RPE, comments, updates the workout status,
    and stores the completion date. Awards 50 points for workout completion + 20 if
    'rpe' and 'comments' are both filled.
    """

    def put(self, request, workout_id):
        user_id = request.query_params.get("user_id")

        try:
            logger.info(f"Starting completion process for HIIT workout_id: {workout_id}, user_id: {user_id}")

            # 1) Retrieve user
            user = User.objects.get(id=user_id)

            # 2) Retrieve and update workout (activity_type='Hiit')
            workout = Workout.objects.get(id=workout_id, owner=user, activity_type="Hiit")
            workout.status = "Completed"
            workout.completed_date = now().date()
            workout.save()

            # 3) Award points for workout completion (50 points, only if not awarded before)
            leaderboard, _ = Leaderboard.objects.get_or_create(user=user)
            if not ScoreLog.objects.filter(user=user, workout_id=workout.id, score_type="Workout Completion").exists():
                leaderboard.total_score += 50
                leaderboard.weekly_score += 50
                leaderboard.monthly_score += 50
                leaderboard.save()

                ScoreLog.objects.create(
                    user=user,
                    score_type="Workout Completion",
                    score_value=50,
                    workout_id=workout.id,
                )
                logger.info(f"Awarded 50 points for HIIT workout completion (workout_id={workout_id}, user_id={user_id})")

            # 4) Update HIIT session fields
            hiit_session = SavedHIITWorkout.objects.get(workout=workout)
            new_rpe = request.data.get("rpe")
            new_comments = request.data.get("comments")

            hiit_session.rpe = new_rpe if new_rpe is not None else hiit_session.rpe
            hiit_session.comments = new_comments if new_comments is not None else hiit_session.comments
            hiit_session.save()

            # 5) Check if 'rpe' and 'comments' are both filled => award +20 if not already awarded
            # Define "fully logged" however you see fit (e.g., rpe > 0 and comments not empty)
            rpe_is_filled = hiit_session.rpe and hiit_session.rpe > 0
            comments_are_filled = hiit_session.comments and hiit_session.comments.strip() != ""

            if rpe_is_filled and comments_are_filled:
                # Avoid double awarding
                if not ScoreLog.objects.filter(
                    user=user,
                    workout_id=workout.id,
                    score_type="Full HIIT Logging"
                ).exists():
                    leaderboard.total_score += 20
                    leaderboard.weekly_score += 20
                    leaderboard.monthly_score += 20
                    leaderboard.save()

                    ScoreLog.objects.create(
                        user=user,
                        score_type="Full HIIT Logging",
                        score_value=20,
                        workout_id=workout.id
                    )
                    logger.info(f"Awarded 20 points for fully logging HIIT (workout_id={workout_id}, user_id={user_id})")

            logger.info(f"HIIT workout with id {workout_id} completed successfully for user {user_id}")
            return Response({"message": "HIIT workout completed successfully!"}, status=200)

        except Exception as e:
            logger.exception(f"Error completing HIIT workout {workout_id}: {e}")
            return Response({"error": str(e)}, status=500)
