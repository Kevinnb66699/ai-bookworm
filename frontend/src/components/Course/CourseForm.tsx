import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createCourse, CourseFormData } from '../../services/courseService';

const { TextArea } = Input;

interface CourseFormProps {
  onSubmit?: (course: CourseFormData) => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values: CourseFormData) => {
    try {
      const course = await createCourse(values);
      message.success('课程创建成功！');
      if (onSubmit) {
        onSubmit(course);
      }
      navigate(`/courses/${course.id}`);
    } catch (error) {
      message.error('创建课程失败，请重试');
    }
  };

  return (
    <Card title="创建新课程" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ description: '' }}
      >
        <Form.Item
          name="name"
          label="课程名称"
          rules={[{ required: true, message: '请输入课程名称' }]}
        >
          <Input placeholder="请输入课程名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="课程描述"
        >
          <TextArea
            placeholder="请输入课程描述"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            创建课程
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CourseForm; 