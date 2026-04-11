import React from 'react';
import { Layout, Row, Col, Space } from 'antd';
import { 
  FacebookOutlined, 
  TwitterOutlined, 
  InstagramOutlined, 
  YoutubeOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom'; // MODIFIED: Import Link
import './LayoutUser.scss';

const { Footer: AntFooter } = Layout;

const Footer = () => {
  return (
    <AntFooter className="Layout-User__footer">
      <div className="Layout-User__footer-container">
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <div className="Layout-User__footer-section">
              <h3 className="Layout-User__footer-title">MOVIX</h3>
              <p className="Layout-User__footer-description">
                Nền tảng xem phim trực tuyến hàng đầu với hàng ngàn bộ phim chất lượng cao.
              </p>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="Layout-User__footer-section">
              <h4 className="Layout-User__footer-heading">Danh mục</h4>
              <ul className="Layout-User__footer-links">
                <li className="Layout-User__footer-link-item">
                  <Link to="/phim-dang-chieu" className="Layout-User__footer-link">Phim đang chiếu</Link>
                </li>
                <li className="Layout-User__footer-link-item">
                  <Link to="/phim-sap-chieu" className="Layout-User__footer-link">Phim sắp chiếu</Link>
                </li>
                <li className="Layout-User__footer-link-item">
                  <Link to="/phim-hot" className="Layout-User__footer-link">Phim hot</Link>
                </li>
                <li className="Layout-User__footer-link-item">
                  <Link to="/show-times" className="Layout-User__footer-link">Rạp chiếu phim</Link>
                </li>
              </ul>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="Layout-User__footer-section">
              <h4 className="Layout-User__footer-heading">Hỗ trợ</h4>
              <ul className="Layout-User__footer-links">
                <li className="Layout-User__footer-link-item">
                  <Link to="/faq" className="Layout-User__footer-link">Câu hỏi thường gặp</Link>
                </li>
                <li className="Layout-User__footer-link-item">
                  <Link to="/contact" className="Layout-User__footer-link">Liên hệ</Link>
                </li>
                <li className="Layout-User__footer-link-item">
                  <Link to="/terms-of-service" className="Layout-User__footer-link">Điều khoản sử dụng</Link>
                </li>
                <li className="Layout-User__footer-link-item">
                  <Link to="/privacy-policy" className="Layout-User__footer-link">Chính sách bảo mật</Link>
                </li>
              </ul>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="Layout-User__footer-section">
              <h4 className="Layout-User__footer-heading">Kết nối với chúng tôi</h4>
              <Space size="large" className="Layout-User__social-links">
                {/* External links should still use 'a' tag */}
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="Layout-User__social-icon">
                  <FacebookOutlined />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="Layout-User__social-icon">
                  <TwitterOutlined />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="Layout-User__social-icon">
                  <InstagramOutlined />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="Layout-User__social-icon">
                  <YoutubeOutlined />
                </a>
              </Space>
            </div>
          </Col>
        </Row>

        <div className="Layout-User__footer-bottom">
          <p className="Layout-User__footer-copyright">
            © {new Date().getFullYear()} MOVIX. All rights reserved.
          </p>
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer;