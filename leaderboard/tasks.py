# leaderboard/tasks.py
from celery import shared_task
from django.db.models import Sum
from django.utils.timezone import now
from datetime import timedelta
from leaderboard.models import Leaderboard
from score_logging.models import ScoreLog
from django.contrib.auth import get_user_model
User = get_user_model()


@shared_task
def update_leaderboards():
    """
    Nightly aggregator to update total_score, weekly_score, monthly_score,
    and ranks for all users.
    """
    today = now().date()
    one_week_ago = today - timedelta(days=7)
    start_of_month = today.replace(day=1)

    users = User.objects.all()

    # 1) Aggregate for each user
    for user in users:
        total_score = ScoreLog.objects.filter(user=user).aggregate(sum=Sum('score_value'))['sum'] or 0
        weekly_score = ScoreLog.objects.filter(
            user=user, timestamp__gte=one_week_ago
        ).aggregate(sum=Sum('score_value'))['sum'] or 0
        monthly_score = ScoreLog.objects.filter(
            user=user, timestamp__date__gte=start_of_month
        ).aggregate(sum=Sum('score_value'))['sum'] or 0

        lb, _ = Leaderboard.objects.get_or_create(user=user)
        lb.total_score = total_score
        lb.weekly_score = weekly_score
        lb.monthly_score = monthly_score
        lb.save()

    # 2) Compute ranks for each category
    _update_ranks()

def _update_ranks():
    """
    Sort by total_score, weekly_score, monthly_score and assign ranks.
    Could also do this with a window function, but here's a simple Python approach.
    """
    # RANK ALL-TIME
    all_time_lb = Leaderboard.objects.order_by('-total_score')
    rank = 1
    for lb in all_time_lb:
        lb.total_rank = rank
        lb.save()
        rank += 1
    
    # RANK WEEKLY
    weekly_lb = Leaderboard.objects.order_by('-weekly_score')
    rank = 1
    for lb in weekly_lb:
        lb.weekly_rank = rank
        lb.save()
        rank += 1

    # RANK MONTHLY
    monthly_lb = Leaderboard.objects.order_by('-monthly_score')
    rank = 1
    for lb in monthly_lb:
        lb.monthly_rank = rank
        lb.save()
        rank += 1
