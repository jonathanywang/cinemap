from django.urls import path
from . import views

urlpatterns = [
    path('conversation/start/', views.StartConversationView.as_view(), name='start_conversation'),
    path('conversation/process-audio/', views.ProcessAudioView.as_view(), name='process_audio'),
    path('conversation/audio/<int:message_id>/', views.GetAudioView.as_view(), name='get_audio'),
    path('conversation/<int:conversation_id>/history/', views.ConversationHistoryView.as_view(), name='conversation_history'),
]