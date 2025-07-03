import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, message, DatePicker, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getReminders, createReminder, updateReminder, deleteReminder } from '../../services/reminderService';
import type { Reminder } from '../../services/reminderService';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface ReminderProps {
  courseId: number;
}

const ReminderComponent: React.FC<ReminderProps> = ({ courseId }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchReminders();
  }, [courseId]);

  const fetchReminders = async () => {
    try {
      const data = await getReminders(courseId);
      setReminders(data);
    } catch (error) {
      message.error('获取复习提醒失败！');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingReminder(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Reminder) => {
    setEditingReminder(record);
    form.setFieldsValue({
      ...record,
      next_review_date: dayjs(record.next_review_date),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteReminder(id);
      message.success('删除成功！');
      fetchReminders();
    } catch (error) {
      message.error('删除失败，请重试！');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingReminder) {
        await updateReminder(editingReminder.id, {
          next_review_date: values.next_review_date.format('YYYY-MM-DD'),
          review_count: values.review_count,
        });
        message.success('更新成功！');
      } else {
        await createReminder({
          course_id: courseId,
          type: values.type,
          item_id: values.item_id,
          next_review_date: values.next_review_date.format('YYYY-MM-DD'),
        });
        message.success('创建成功！');
      }
      setModalVisible(false);
      fetchReminders();
    } catch (error) {
      message.error('操作失败，请重试！');
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => type === 'word' ? '单词' : '课文',
    },
    {
      title: '项目ID',
      dataIndex: 'item_id',
      key: 'item_id',
    },
    {
      title: '下次复习日期',
      dataIndex: 'next_review_date',
      key: 'next_review_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '复习次数',
      dataIndex: 'review_count',
      key: 'review_count',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Reminder) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
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
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>复习提醒</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加提醒
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={reminders}
          rowKey="id"
          loading={loading}
        />

        <Modal
          title={editingReminder ? '编辑提醒' : '添加提醒'}
          open={modalVisible}
          onOk={handleModalOk}
          onCancel={() => setModalVisible(false)}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="type"
              label="类型"
              rules={[{ required: true, message: '请选择类型！' }]}
            >
              <Input placeholder="word 或 text" />
            </Form.Item>
            <Form.Item
              name="item_id"
              label="项目ID"
              rules={[{ required: true, message: '请输入项目ID！' }]}
            >
              <Input type="number" />
            </Form.Item>
            <Form.Item
              name="next_review_date"
              label="下次复习日期"
              rules={[{ required: true, message: '请选择下次复习日期！' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            {editingReminder && (
              <Form.Item
                name="review_count"
                label="复习次数"
                rules={[{ required: true, message: '请输入复习次数！' }]}
              >
                <Input type="number" />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </Space>
    </Card>
  );
};

export default ReminderComponent; 