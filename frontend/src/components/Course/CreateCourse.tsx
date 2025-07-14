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
      message.error('获取课程信息失败');
      navigate('/courses');
    }
  };

  const handleSubmit = async (values: CourseFormData) => {
    try {
      if (isEdit) {
        await updateCourse(Number(id), values);
        message.success('课程更新成功！');
      } else {
        await createCourse(values);
        message.success('课程创建成功！');
      }
      navigate('/courses');
    } catch (error) {
      message.error(isEdit ? '更新失败，请重试！' : '创建失败，请重试！');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title={isEdit ? '编辑课程' : '创建新课程'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="课程名称"
            rules={[{ required: true, message: '请输入课程名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="课程描述"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button 
              style={{ marginLeft: 8 }} 
              onClick={() => navigate('/courses')}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateCourse; 