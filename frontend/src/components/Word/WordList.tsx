import React, { useState } from 'react';
import { List, Card, Button, Popconfirm, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Word, deleteWord } from '../../services/wordService';

interface WordListProps {
  courseId: number;
  words: Word[];
  onWordChange: () => void;
}

const WordList: React.FC<WordListProps> = ({ courseId, words, onWordChange }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await deleteWord(id);
      message.success('删除成功');
      onWordChange();
    } catch (error) {
      console.error('删除单词失败:', error);
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <List
      loading={loading}
      grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
      dataSource={words}
      renderItem={(word) => (
        <List.Item>
          <Card
            title={word.word}
            actions={[
              <Button
                key="edit"
                type="link"
                icon={<EditOutlined />}
                onClick={() => {/* 编辑功能将在后续实现 */}}
              >
                编辑
              </Button>,
              <Popconfirm
                key="delete"
                title="确定要删除这个单词吗？"
                onConfirm={() => handleDelete(word.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            ]}
          >
            <p><strong>释义：</strong></p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {word.meanings.map((meaning, index) => (
                <li key={index}>{meaning}</li>
              ))}
            </ul>
            {word.pronunciation && (
              <p><strong>发音：</strong>{word.pronunciation}</p>
            )}
            {word.example && (
              <p><strong>例句：</strong>{word.example}</p>
            )}
            <div style={{ marginTop: '8px', color: '#999' }}>
              创建于: {new Date(word.created_at).toLocaleDateString()}
            </div>
          </Card>
        </List.Item>
      )}
    />
  );
};

export default WordList; 