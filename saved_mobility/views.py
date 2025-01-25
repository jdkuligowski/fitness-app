from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.timezone import now
from django.db import transaction
from leaderboard.models import Leaderboard
from score_logging.models import ScoreLog
from saved_workouts.models import Workout
from saved_mobility.models import SavedMobilitySession
from django.contrib.auth import get_user_model

User = get_user_model()
import logging

logger = logging.getLogger(__name__)

class CompleteMobilityWorkoutAPIView(APIView):
    """
    API view to complete a mobility workout. Saves RPE, comments, updates the workout status,
    and stores the completion date.
    """

    def put(self, request, workout_id):
        user_id = request.query_params.get("user_id")

        try:
            logger.info(f"Starting completion process for mobility workout_id: {workout_id}, user_id: {user_id}")

            # Retrieve user
            user = User.objects.get(id=user_id)

            # Retrieve and update workout
            workout = Workout.objects.get(id=workout_id, owner=user, activity_type="Mobility")
            workout.status = "Completed"
            workout.completed_date = now().date()
            workout.save()

            # Award points for workout completion
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

            # Update RPE and comments for the session
            mobility_session = SavedMobilitySession.objects.get(workout=workout)
            mobility_session.rpe = request.data.get("rpe", mobility_session.rpe)
            mobility_session.comments = request.data.get("comments", mobility_session.comments)
            mobility_session.save()

            logger.info(f"Mobility workout with id {workout_id} completed successfully for user {user_id}")
            return Response({"message": "Mobility workout completed successfully!"}, status=200)

        except Exception as e:
            logger.exception(f"Error completing mobility workout {workout_id}: {e}")
            return Response({"error": str(e)}, status=500)
