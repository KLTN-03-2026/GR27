// src/components/Form/CommentForm.jsx
import { useEffect } from "react";
import { Modal, Form, Rate, Input, Button, Typography } from "antd";

const { Text } = Typography;
const { TextArea } = Input;

/**
 * CommentForm - Modal cho phép user chỉnh sửa bình luận của mình.
 *
 * Props:
 *  - open       : boolean  — hiển thị modal hay không
 *  - onCancel   : fn       — đóng modal mà không lưu
 *  - onFinish   : fn(values: { rate, content }) — gọi khi submit
 *  - initialValues: { rate, content } — giá trị ban đầu khi mở modal
 *  - loading    : boolean  — trạng thái đang gửi request
 */
function CommentForm({ open, onCancel, onFinish, initialValues, loading = false }) {
  const [form] = Form.useForm();

  // Khi modal mở hoặc initialValues thay đổi thì set lại giá trị form
  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue({
        rate: initialValues.rate,
        content: initialValues.content,
      });
    }
  }, [open, initialValues, form]);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleFinish = async (values) => {
    await onFinish(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Chỉnh sửa đánh giá"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="rate"
          label={<Text>Số sao đánh giá</Text>}
          rules={[
            { required: true, message: "Vui lòng chọn số sao" },
            {
              validator: (_, value) =>
                value > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error("Vui lòng chọn ít nhất 1 sao")),
            },
          ]}
        >
          <Rate          
            style={{ fontSize: "28px" }}
          />
        </Form.Item>

        <Form.Item
          name="content"
          label={<Text>Nội dung bình luận</Text>}
          rules={[
            { required: true, message: "Vui lòng nhập nội dung bình luận" },
            { min: 10, message: "Nội dung phải có ít nhất 10 ký tự" },
            { max: 1000, message: "Nội dung không được vượt quá 1000 ký tự" },
          ]}
        >
          <TextArea
            rows={5}
            placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Button onClick={handleCancel} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CommentForm;