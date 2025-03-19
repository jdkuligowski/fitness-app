from celery import shared_task
from datetime import date, timedelta

from django.contrib.auth import get_user_model
User = get_user_model()

from user_stats.models import UserStats
from user_stats.aggregators import (
    aggregate_body_parts_over_range,
    aggregate_activity_type_over_range
)

@shared_task
def update_all_user_stats():
    today = date.today()
    one_week_ago = today - timedelta(days=7)
    one_month_ago = today - timedelta(days=30)
    one_year_ago = today - timedelta(days=365)

    users = User.objects.all()
    for user in users:
        # 1) Body-part aggregator
        weekly_body = aggregate_body_parts_over_range(user, one_week_ago, today)
        monthly_body = aggregate_body_parts_over_range(user, one_month_ago, today)
        yearly_body = aggregate_body_parts_over_range(user, one_year_ago, today)

        # 2) Activity-type aggregator
        weekly_act = aggregate_activity_type_over_range(user, one_week_ago, today)
        monthly_act = aggregate_activity_type_over_range(user, one_month_ago, today)
        yearly_act = aggregate_activity_type_over_range(user, one_year_ago, today)

        # 3) Store or create the user stats record
        stats, created = UserStats.objects.get_or_create(owner=user)
        stats.weekly_body_part = weekly_body
        stats.monthly_body_part = monthly_body
        stats.yearly_body_part = yearly_body

        stats.weekly_activity_type = weekly_act
        stats.monthly_activity_type = monthly_act
        stats.yearly_activity_type = yearly_act

        stats.save()
