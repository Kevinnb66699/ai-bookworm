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

# 可选模型：在某些部署环境未包含对应文件时，避免应用初始化失败
try:
    from .parent_voice import ParentVoice  # noqa: F401
except Exception:
    ParentVoice = None  # type: ignore

try:
    from .recitation_evaluation import RecitationEvaluation  # noqa: F401
except Exception:
    RecitationEvaluation = None  # type: ignore

# 确保导出所有模型
__all__ = ['User', 'Course', 'Progress', 'Word', 'Review', 'Practice', 'Text', 'WordPractice', 'PracticeProgress', 'ReviewPlan', 'Reminder', 'TextRecitation']
if ParentVoice is not None:
    __all__.append('ParentVoice')
if RecitationEvaluation is not None:
    __all__.append('RecitationEvaluation')