import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { Link } from 'react-router-dom';
import FilmAdminList from '../../../components/FIlmAdminList';
const FilmListPage = () => {
  return (
    <>
      <Link  to="/admin/films/create">
        <Button className='mb-20' variant="outlined" color='primary' icon={<PlusOutlined />}>Tạo phim mới</Button>
      </Link>
      <FilmAdminList />
    </>
  );
};

export default FilmListPage;