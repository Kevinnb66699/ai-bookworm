import React, { useState, useCallback, memo } from 'react';
import { List, Card, Button, Popconfirm, message, Modal, Form, Input, Space } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Word, CreateWordData, createWord, updateWord, deleteWord } from '../../services/wordService';
import { useParams } from 'react-router-dom';

interface WordListProps {
  courseId: number;
  words: Word[];
  onWordChange: () => void;
}

const WordList: React.FC<WordListProps> = memo(({ courseId, words, onWordChange }) => {
  const [loading, setLoading] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = useCallback(() => {
    setEditingWord(null);
    form.resetFields();
    setIsModalVisible(true);
  }, [form]);

  const handleDelete = useCallback(async (id: number) => {
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
  }, [onWordChange]);

  const handleEdit = useCallback((word: Word) => {
    setEditingWord(word);
    form.setFieldsValue({
      word: word.word,
      meanings: word.meanings,
      pronunciation: word.pronunciation,
      example: word.example
    });
    setIsModalVisible(true);
  }, [form]);

  const handleModalCancel = useCallback(() => {
    setIsModalVisible(false);
    setEditingWord(null);
    form.resetFields();
  }, [form]);

  const handleModalOk = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 过滤掉空的释义
      const validMeanings = values.meanings
        .map((m: string) => m.trim())
        .filter((m: string) => m !== '');

      // 如果过滤后没有有效的释义，则报错
      if (validMeanings.length === 0) {
        message.error('至少需要一个有效的释义');
        return;
      }

      const wordData: CreateWordData = {
        word: values.word.trim(),
        meanings: validMeanings,
        pronunciation: values.pronunciation?.trim(),
        example: values.example?.trim(),
        course_id: courseId
      };

      if (editingWord) {
        await updateWord(editingWord.id, wordData);
        message.success('更新成功');
      } else {
        await createWord(wordData);
        message.success('添加成功');
      }
      
      setIsModalVisible(false);
      setEditingWord(null);
      form.resetFields();
      onWordChange();
    } catch (error: any) {
      console.error('操作失败:', error);
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else if (error.message) {
        message.error(error.message);
      } else {
        message.error('操作失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  }, [form, courseId, editingWord, onWordChange]);

  return (
    <div>
      <Modal
        title={editingWord ? "编辑单词" : "添加单词"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form
          form={form}
          onFinish={handleModalOk}
          layout="vertical"
          initialValues={{
            word: '',
            meanings: [''],
            pronunciation: '',
            example: ''
          }}
        >
          <Form.Item
            name="word"
            label="单词"
            rules={[{ required: true, message: '请输入单词' }]}
          >
            <Input placeholder="请输入单词" />
          </Form.Item>

          <Form.List
            name="meanings"
            rules={[
              {
                validator: async (_, meanings) => {
                  if (!meanings || meanings.length < 1) {
                    return Promise.reject(new Error('至少需要一个释义'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item
                    required={false}
                    key={field.key}
                    label={index === 0 ? <span><span style={{ color: '#ff4d4f' }}>*</span>释义</span> : ""}
                  >
                    <Space>
                      <Form.Item
                        {...field}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[]}
                        noStyle
                      >
                        <Input placeholder="请输入释义" style={{ width: '300px' }} />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      )}
                    </Space>
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    style={{ width: '300px' }}
                  >
                    添加释义
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            name="pronunciation"
            label="发音"
          >
            <Input placeholder="请输入发音" />
          </Form.Item>

          <Form.Item
            name="example"
            label="例句"
          >
            <Input.TextArea placeholder="请输入例句" />
          </Form.Item>
        </Form>
      </Modal>

      <Button type="primary" onClick={handleAdd}>
        添加单词
      </Button>

      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
        dataSource={words}
        locale={{
          emptyText: '暂无单词，点击上方按钮添加'
        }}
        renderItem={(word) => (
          <List.Item
            actions={[
              <Space key="actions">
                <Button type="link" onClick={() => handleEdit(word)}>编辑</Button>
                <Button type="link" danger onClick={() => handleDelete(word.id)}>删除</Button>
              </Space>
            ]}
          >
            <div>
              <h4>{word.word}</h4>
              <p><strong>翻译：</strong></p>
              <ul>
                {word.meanings.map((meaning: string, index: number) => (
                  <li key={index}>{meaning}</li>
                ))}
              </ul>
              {word.pronunciation && (
                <p><strong>发音：</strong>{word.pronunciation}</p>
              )}
              {word.example && (
                <p><strong>例句：</strong>{word.example}</p>
              )}
              <p><strong>创建时间：</strong>{new Date(word.created_at).toLocaleString()}</p>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
});

WordList.displayName = 'WordList';

export default WordList; 