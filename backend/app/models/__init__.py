from datetime import datetime
from .. import db
from .word import Word
from .review import Review
from .practice import Practice
from .course import Course
from .text import Text
from .user import User
from .progress import Progress
from .word_practice import WordPractice
from .practice_progress import PracticeProgress
from .review_plan import ReviewPlan
from .reminder import Reminder
from .text_recitation import TextRecitation
from .parent_voice import ParentVoice
from .recitation_evaluation import RecitationEvaluation

# 确保导出所有模型
__all__ = ['User', 'Course', 'Progress', 'Word', 'Review', 'Practice', 'Text', 'WordPractice', 'PracticeProgress', 'ReviewPlan', 'Reminder', 'TextRecitation', 'ParentVoice', 'RecitationEvaluation'] 