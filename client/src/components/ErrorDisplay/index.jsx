import { Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const ErrorDisplay = ({ 
  message = "Có lỗi xảy ra", 
  onRetry = null,
  showRetry = true 
}) => {
  return (
    <div style={{ padding: '20px' }}>
      <Alert
        message="Lỗi"
        description={message}
        type="error"
        showIcon
        action={
          showRetry && onRetry && (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
              Thử lại
            </Button>
          )
        }
      />
    </div>
  );
};

export default ErrorDisplay;