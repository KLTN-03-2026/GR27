import { Spin } from "antd";

const Loading = ({ size = "large", tip = "Đang tải..." }) => {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '50px 0',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <Spin size={size} tip={tip} spinning={true}>
        <div style={{ minHeight: '200px', minWidth: '200px' }} />
      </Spin>
    </div>
  );
};

export default Loading;