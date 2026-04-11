// src/components/Form/CinemaForm.jsx
import {
  Button,
  Col,
  Form,
  Image,
  Input,
  Row,
  Select,
  Switch,
  Upload,
  TreeSelect,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { useEffect, useState, useRef } from "react";
import { getAllCity } from "../../services/cityServices";
import { getAllCinema } from "../../services/cinemaServices";
import useImageUpload from "../../hooks/useImageUpload";
import { DEFAULT_IMAGES } from "../../constants";

const { TextArea } = Input;

function CinemaForm({
  onFinish,
  onCancel,
  initialValues,
  submitButtonText = "Cập nhật",
}) {
  const [form] = Form.useForm();
  const [cities, setCities] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [filteredCinemas, setFilteredCinemas] = useState([]);
  const [selectedCityIds, setSelectedCityIds] = useState([]);
  const initialValuesSetRef = useRef(false);

  // Sử dụng useImageUpload hook cho avatar
  const {
    fileList,
    previewOpen,
    previewImage,
    uploading,
    setPreviewOpen,
    setInitialImage,
    getFinalImageUrl,
    resetAll,
    forceSetImage,
    uploadProps,
  } = useImageUpload({
    defaultImage: DEFAULT_IMAGES.CINEMA_LOGO,
    maxCount: 1,
    onUploadSuccess: (url) => console.log("Upload thành công:", url),
    onUploadError: (error) => console.error("Upload lỗi:", error),
  });

  // Fetch cities và cinemas cùng lúc
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cityResult, cinemaResult] = await Promise.all([
          getAllCity(),
          getAllCinema(),
        ]);

        // Xử lý city
        const cityListSelect = cityResult.map((item) => ({
          label: item.name,
          value: item._id,
        }));
        setCities(cityListSelect);

        // Xử lý cinema
        setCinemas(cinemaResult);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // Filter cinemas based on selected cities
  useEffect(() => {
    if (selectedCityIds.length === 0) {
      setFilteredCinemas([]);
      return;
    }

    const filtered = cinemas.filter((cinema) => {
      // Kiểm tra nếu cinema có cityIds và có giao điểm với selectedCityIds
      return cinema.cityIds && cinema.cityIds.some(cityId => 
        selectedCityIds.includes(typeof cityId === 'object' ? cityId._id : cityId)
      );
    });

    // Tạo tree data cho TreeSelect
    const treeData = buildCinemaTree(filtered);
    setFilteredCinemas(treeData);
  }, [selectedCityIds, cinemas]);

  // Build tree structure for cinemas
  const buildCinemaTree = (cinemasList) => {
    const parentCinemas = cinemasList.filter(cinema => !cinema.parentId);
    const childCinemas = cinemasList.filter(cinema => cinema.parentId);

    const treeData = parentCinemas.map(parent => ({
      title: parent.name,
      value: parent._id,
      key: parent._id,
      avatar: parent.avatar, // Thêm avatar vào data
      children: childCinemas
        .filter(child => {
          const parentIdValue = typeof child.parentId === 'object' ? child.parentId._id : child.parentId;
          return parentIdValue === parent._id;
        })
        .map(child => ({
          title: `└─ ${child.name}`,
          value: child._id,
          key: child._id,
          avatar: child.avatar, // Thêm avatar vào data
        }))
    }));

    return treeData;
  };

  // Tìm cinema object từ ID
  const findCinemaById = (cinemaId) => {
    return cinemas.find(cinema => cinema._id === cinemaId);
  };

  // Handle city selection change
  const handleCityChange = (values) => {
    setSelectedCityIds(values);
    // Reset parentId khi thay đổi city
    form.setFieldValue('parentId', undefined);
  };

  // Handle parent cinema selection change
  const handleParentCinemaChange = (parentId) => {
    if (parentId) {
      const selectedParent = findCinemaById(parentId);
      
      if (selectedParent && selectedParent.avatar) {
        console.log("Auto-filling avatar from parent cinema:", selectedParent.avatar);
        
        // Tự động set avatar từ rạp cha
        forceSetImage(selectedParent.avatar);
        
        // Cũng cập nhật form field (nếu cần thiết cho validation)
        form.setFieldValue('avatar', [{
          uid: "-auto",
          name: "parent-avatar.jpg",
          status: "done",
          url: selectedParent.avatar,
          thumbUrl: selectedParent.avatar,
        }]);
      }
    }
  };

  // Set initial values chỉ một lần khi có dữ liệu từ props
  useEffect(() => {
    if (initialValues && !initialValuesSetRef.current) {
      // Set initial image using hook
      if (initialValues.avatar) {
        setInitialImage(initialValues.avatar);
      }

      // Process cityIds - extract _id if it's populated
      let processedCityIds = [];
      if (Array.isArray(initialValues.cityIds)) {
        processedCityIds = initialValues.cityIds.map(city => 
          typeof city === 'object' ? city._id : city
        );
      }

      // Process parentId - extract _id if it's populated  
      let processedParentId = null;
      if (initialValues.parentId) {
        processedParentId = typeof initialValues.parentId === 'object' 
          ? initialValues.parentId._id 
          : initialValues.parentId;
      }

      // Set form values
      form.setFieldsValue({
        ...initialValues,
        cityIds: processedCityIds,
        parentId: processedParentId,
      });

      // Set selected cities for filtering
      setSelectedCityIds(processedCityIds);

      initialValuesSetRef.current = true;
    }
  }, [initialValues, form, setInitialImage]);

  // Reset flag khi initialValues thay đổi
  useEffect(() => {
    initialValuesSetRef.current = false;
  }, [initialValues]);

  const handleFinish = async (values) => {
    console.log("Form values before processing:", values);
    try {
      // Xử lý avatar bằng hook
      const avatarUrl = await getFinalImageUrl(initialValues?.avatar);
      values.avatar = avatarUrl;

      // Fix: Xử lý status đúng cách
      if (typeof values.status === 'boolean') {
        values.status = values.status ? "active" : "inactive";
      }

      console.log("Values after processing:", values);
      const result = await onFinish(values);

      // Chỉ reset form khi onFinish return true (thành công)
      if (result === true) {
        form.resetFields();
        resetAll();
        setSelectedCityIds([]);
        setFilteredCinemas([]);
        initialValuesSetRef.current = false;
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Tạo initialValues đúng cách
  const getInitialFormValues = () => {
    const defaultValues = {
      status: "inactive", // Mặc định inactive cho form mới
      cityIds: [],
      parentId: null,
    };

    // Nếu có initialValues (đang edit), ưu tiên initialValues
    if (initialValues) {
      return {
        ...defaultValues,
        ...initialValues,
      };
    }

    return defaultValues;
  };

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      initialValues={getInitialFormValues()}
      layout="vertical"
    >
      <Row gutter={[20, 5]}>
        <Col span={24}>
          <Form.Item
            name="name"
            label="Tên rạp"
            rules={[{ required: true, message: "Vui lòng nhập tên rạp" }]}
          >
            <Input type="text" placeholder="Nhập tên rạp chiếu" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="cityIds"
            label="Thành phố"
            rules={[{ required: true, message: "Vui lòng chọn ít nhất một thành phố" }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn thành phố"
              options={cities}
              optionFilterProp="label" 
              onChange={handleCityChange}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="parentId"
            label="Thuộc rạp cha"
            tooltip="Chọn rạp cha (không bắt buộc). Chỉ hiển thị các rạp trong thành phố đã chọn. Avatar sẽ tự động được điền từ rạp cha."
          >
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="Chọn rạp cha (không bắt buộc)"
              allowClear
              treeDefaultExpandAll
              treeData={filteredCinemas}
              disabled={selectedCityIds.length === 0}
              onChange={handleParentCinemaChange}
              notFoundContent={
                selectedCityIds.length === 0 
                  ? "Vui lòng chọn thành phố trước"
                  : "Không có rạp nào trong thành phố này"
              }
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
          >
            <Input placeholder="Nhập địa chỉ chi tiết của rạp" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="description"
            label="Giới thiệu"
            rules={[{ required: true, message: "Vui lòng nhập giới thiệu về rạp" }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả chi tiết về rạp chiếu" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Logo rạp"
            name="avatar"
            valuePropName="fileList"
            extra="Tip: Chọn rạp cha để tự động điền logo"
          >
            <ImgCrop
              showGrid
              rotationSlider
              aspectSlider
              showReset
              aspect={1} // Logo vuông 1:1
            >
              <Upload
                {...uploadProps}
                loading={uploading}
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

        <Col span={12}>
          <Form.Item label={null}>
            {previewImage && (
              <Image
                wrapperStyle={{ display: "none" }}
                preview={{
                  visible: previewOpen,
                  onVisibleChange: (visible) => setPreviewOpen(visible),
                  afterOpenChange: (visible) => !visible && setPreviewOpen(false),
                }}
                src={previewImage}
              />
            )}
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="status"
            label="Trạng thái hoạt động"
            valuePropName="checked"
            getValueFromEvent={(checked) => (checked ? "active" : "inactive")}
            getValueProps={(value) => ({ checked: value === "active" })}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label={null}>
            <Button className="mr-10" type="primary" htmlType="submit" loading={uploading}>
              {submitButtonText}
            </Button>
            {onCancel && (
              <Button className="ml-10" onClick={onCancel}>
                Hủy
              </Button>
            )}
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}

export default CinemaForm;