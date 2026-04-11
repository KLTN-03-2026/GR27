import React from 'react';
import { Form, Input, Button } from 'antd';

const ChangePasswordForm = ({ onFinish, onCancel, loading }) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      name="change_password_form"
    >
      <Form.Item
        name="oldPassword"
        label="Mật khẩu cũ"
        rules={[
          { required: true, message: 'Vui lòng nhập mật khẩu cũ!' },
        ]}
      >
        <Input.Password placeholder="Nhập mật khẩu hiện tại" />
      </Form.Item>
      <Form.Item
        name="newPassword"
        label="Mật khẩu mới"
        rules={[
          { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
          { min: 8, message: 'Mật khẩu mới phải có ít nhất 8 ký tự!' },
        ]}
        hasFeedback
      >
        <Input.Password placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Xác nhận mật khẩu mới"
        dependencies={['newPassword']}
        hasFeedback
        rules={[
          { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
            },
          }),
        ]}
      >
        <Input.Password placeholder="Nhập lại mật khẩu mới" />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Hủy
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Xác nhận
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ChangePasswordForm;