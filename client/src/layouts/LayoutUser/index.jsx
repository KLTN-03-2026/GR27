import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './LayoutUser.scss';
import Chatbot from '../../components/Chatbot';

const { Content } = Layout;

const LayoutUser = () => {
  return (
    <Layout className="Layout-User">
      <Header />
      <Content className="Layout-User__content">
        <Outlet />
      </Content>
      <Footer />
      <Chatbot />
    </Layout>
  );
};

export default LayoutUser;