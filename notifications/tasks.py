import datetime
from django.utils import timezone
from celery import shared_task
from .models import ScheduledNotification
from .utils import send_expo_push 

@shared_task
def send_due_notifications():
    """
    This task checks for any notifications that are due,
    and sends them via Expo.
    """
    now = timezone.now()

    # Example: pick anything scheduled up to now, and not sent/canceled
    due = ScheduledNotification.objects.filter(
        scheduled_datetime__lte=now,
        sent=False,
        canceled=False
    )

    for notif in due:
        token = notif.owner.expo_push_token
        if token:
            send_expo_push(token, notif.title, notif.body)
            notif.sent = True
            notif.save()
