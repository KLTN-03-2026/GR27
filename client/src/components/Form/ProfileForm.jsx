import React, { useEffect, useImperativeHandle, forwardRef, useRef } from 'react'; // ADDED: useRef
import { Form, Input, Row, Col, Upload, Button, Space, Image } from 'antd';
import { PlusOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, SaveOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import useImageUpload from '../../hooks/useImageUpload';
import { DEFAULT_IMAGES } from '../../constants';

const ProfileForm = forwardRef(({ initialValues, isEditing, onFinish, loading, onOpenChangePassword }, ref) => {
  const [form] = Form.useForm();
  
  
  const initialImageSet = useRef(false); 

  const {
    fileList,
    previewOpen,
    previewImage,
    uploading,
    setPreviewOpen,
    setInitialImage,
    getFinalImageUrl,
    resetAll,
    uploadProps,
  } = useImageUpload({
    defaultImage: DEFAULT_IMAGES.USER_AVATAR,
    maxCount: 1,
  });

  
  useEffect(() => {
    
    if (initialValues) {
      form.setFieldsValue(initialValues);
      
    
      if (initialValues.avatar && !initialImageSet.current) {
        setInitialImage(initialValues.avatar);
        initialImageSet.current = true; 
      }
    }

  }, [initialValues, form, setInitialImage]); 

  useImperativeHandle(ref, () => ({
    reset() {
      form.setFieldsValue(initialValues);
      resetAll(); 
      setInitialImage(initialValues.avatar); 
    }
  }));

  const handleFinish = async (values) => {
    try {
      const avatarUrl = await getFinalImageUrl(initialValues?.avatar);
      const finalValues = { ...values, avatar: avatarUrl };
      await onFinish(finalValues);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form 
      form={form} 
      layout="vertical" 
      onFinish={handleFinish}
      initialValues={initialValues}
    >
      <Row gutter={24}>
        <Col xs={24} md={8} className="profile-avatar-section">
          <Form.Item
            name="avatar"
            valuePropName="fileList"
          >
            <ImgCrop 
              rotationSlider 
              cropShape="round"
              modalTitle="Chỉnh sửa ảnh đại diện"
              modalOk="Xác nhận"
              modalCancel="Hủy"
            >
              <Upload
                {...uploadProps}
                listType="picture-circle"
                disabled={!isEditing || uploading}
              >
                {fileList.length >= 1 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>
        </Col>
        <Col xs={24} md={16}>
          <Form.Item name="username" label="Tên tài khoản">
            <Input prefix={<UserOutlined />} disabled />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input prefix={<MailOutlined />} disabled />
          </Form.Item>
          <Form.Item name="fullname" label="Họ và tên">
            <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên của bạn" disabled={!isEditing} />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" disabled={!isEditing} />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input prefix={<HomeOutlined />} placeholder="Nhập địa chỉ" disabled={!isEditing} />
          </Form.Item>
        </Col>
      </Row>

      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewOpen(false),
          }}
          src={previewImage}
        />
      )}

      {isEditing && (
        <div className="profile-actions">
            <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading || uploading}>
                    Lưu thay đổi
                </Button>
                <Button variant="outlined" color='pink' onClick={onOpenChangePassword}>
                    Đổi mật khẩu
                </Button>
            </Space>
        </div>
      )}
    </Form>
  );
});

export default ProfileForm;