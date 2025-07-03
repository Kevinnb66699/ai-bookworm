import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getTexts, createText, updateText, deleteText, Text } from '../../services/textService';

const { TextArea } = Input;

interface TextListProps {
  courseId: number;
}

const TextList: React.FC<TextListProps> = ({ courseId }) => {
  const [texts, setTexts] = useState<Text[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingText, setEditingText] = useState<Text | null>(null);
  const [form] = Form.useForm();

  const fetchTexts = async () => {
    try {
      setLoading(true);
      const data = await getTexts(courseId);
      setTexts(data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取文本列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTexts();
  }, [courseId]);

  const handleAdd = () => {
    setEditingText(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Text) => {
    setEditingText(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteText(id);
      message.success('删除成功');
      fetchTexts();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingText) {
        await updateText(editingText.id, values);
        message.success('更新成功');
      } else {
        await createText(courseId, values);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchTexts();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '原文',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '翻译',
      dataIndex: 'translation',
      key: 'translation',
      ellipsis: true,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty: number) => {
        const levels = ['简单', '中等', '困难'];
        return levels[difficulty - 1] || '未知';
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Text) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加文本
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={texts}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingText ? '编辑文本' : '添加文本'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label="原文"
            rules={[{ required: true, message: '请输入原文' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="translation"
            label="翻译"
            rules={[{ required: true, message: '请输入翻译' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="difficulty"
            label="难度"
            rules={[{ required: true, message: '请选择难度' }]}
          >
            <Input type="number" min={1} max={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TextList; 