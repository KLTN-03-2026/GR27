import React, { useState, useRef } from 'react'; // ADDED: useRef
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, message, Modal } from 'antd';
import { EditOutlined, CloseOutlined } from '@ant-design/icons'; // MODIFIED: Import CloseOutlined

import { updateProfile, changePassword } from '../../../services/userServices';
import { fetchUser } from '../../../redux/actions/auth.action';
import './ProfilePage.scss';
import ProfileForm from '../../../components/Form/ProfileForm';
import ChangePasswordForm from '../../../components/Form/ChangePasswordForm';

const Profile = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const formRef = useRef(null); // Ref để có thể gọi hàm của component con

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      await updateProfile(values);
      messageApi.success('Cập nhật thông tin thành công!');
      dispatch(fetchUser());
      setIsEditing(false);
      return true; // Báo cho form con là đã thành công
    } catch (err) {
      messageApi.error(err.response?.data?.message || 'Cập nhật thất bại, vui lòng thử lại.');
      return false; // Báo cho form con là đã thất bại
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      await changePassword(values);
      messageApi.success('Đổi mật khẩu thành công!');
      setIsModalOpen(false);
    } catch (err) {
      messageApi.error(err.response?.data?.message || 'Đổi mật khẩu thất bại!');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Gọi hàm reset của component con qua ref
    if (formRef.current) {
      formRef.current.reset();
    }
  }

  // Nút Chỉnh sửa/Hủy bỏ
  const editActions = isEditing ? (
    <Button onClick={handleCancel} icon={<CloseOutlined />}>
      Hủy
    </Button>
  ) : (
    <Button color='primary' variant="outlined" onClick={() => setIsEditing(true)} icon={<EditOutlined />}>
      Chỉnh sửa thông tin
    </Button>
  );

  return (
    <>
      {contextHolder}
      <div className="profile-page-container">
        <Card title="Thông tin tài khoản" extra={editActions}>
          <ProfileForm 
            ref={formRef} // Gán ref
            initialValues={user}
            isEditing={isEditing}
            onFinish={handleProfileUpdate}
            loading={loading}
            onOpenChangePassword={() => setIsModalOpen(true)}
          />
        </Card>
      </div>

      <Modal
        title="Đổi mật khẩu"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose={true}
      >
        <ChangePasswordForm 
          onFinish={handleChangePassword} 
          onCancel={() => setIsModalOpen(false)}
          loading={passwordLoading}
        />
      </Modal>
    </>
  );
};

export default Profile;