from datetime import datetime
from app import db

class TextRecitation(db.Model):
    __tablename__ = 'text_recitations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)
    update_time = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 预计算并缓存的分段结果
    segments_cache = db.Column(db.JSON)  # [{ index, content, sentences }]
    segment_count = db.Column(db.Integer)
    segments_cached_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'createTime': self.create_time.strftime('%Y-%m-%d %H:%M:%S')
        } 