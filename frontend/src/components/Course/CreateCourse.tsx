import React, { useEffect } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { createCourse, updateCourse, getCourse } from '../../services/courseService';

const { TextArea } = Input;

interface CourseFormData {
  name: string;
  description: string;
}

const CreateCourse: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const course = await getCourse(Number(id));
      form.setFieldsValue({
        name: course.name,
        description: course.description
      });
    } catch (error) {
      message.error('Failed to get course information');
      navigate('/courses');
    }
  };

  const handleSubmit = async (values: CourseFormData) => {
    try {
      if (isEdit) {
        await updateCourse(Number(id), values);
        message.success('Course updated successfully!');
      } else {
        await createCourse(values);
        message.success('Course created successfully!');
      }
      navigate('/courses');
    } catch (error) {
      message.error(isEdit ? 'Update failed, please try again!' : 'Creation failed, please try again!');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title={isEdit ? 'Edit Course' : 'Create New Course'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Course Name"
            rules={[{ required: true, message: 'Please enter course name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Course Description"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button 
              style={{ marginLeft: 8 }} 
              onClick={() => navigate('/courses')}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateCourse; 