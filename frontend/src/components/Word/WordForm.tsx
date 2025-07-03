import React, { useState } from 'react';
import { Modal, Form, Input, message, Button, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { CreateWordData, Word, createWord, updateWord } from '../../services/wordService';

interface WordFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  courseId: number;
  initialValues?: Word | null;
}

const WordForm: React.FC<WordFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  courseId,
  initialValues
}) => {
  const [form] = Form.useForm();
  const isEditing = !!initialValues;

  React.useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue({
        word: initialValues.word,
        meanings: initialValues.meanings || [''],
        pronunciation: initialValues.pronunciation,
        example: initialValues.example
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        meanings: ['']
      });
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const wordData: CreateWordData = {
        word: values.word,
        meanings: values.meanings.filter((m: string) => m.trim() !== ''), // 过滤空释义
        pronunciation: values.pronunciation,
        example: values.example,
        course_id: courseId
      };

      if (isEditing && initialValues) {
        await updateWord(initialValues.id, wordData);
        message.success('更新成功');
      } else {
        await createWord(wordData);
        message.success('添加成功');
      }
      onSuccess();
      form.resetFields();
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  return (
    <Modal
      title={isEditing ? '编辑单词' : '添加单词'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText={isEditing ? '更新' : '添加'}
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="word"
          label="单词"
          rules={[{ required: true, message: '请输入单词' }]}
        >
          <Input placeholder="请输入单词" />
        </Form.Item>

        <Form.List name="meanings">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} align="baseline">
                  <Form.Item
                    {...restField}
                    name={name}
                    label={name === 0 ? '释义' : `释义${name + 1}`}
                    rules={[{ required: true, message: '请输入释义' }]}
                  >
                    <Input placeholder="请输入释义" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加新的释义
                </Button>
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
  );
};

export default WordForm; 