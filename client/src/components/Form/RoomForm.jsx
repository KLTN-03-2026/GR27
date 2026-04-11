import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
  TreeSelect,
} from "antd";
import { useEffect, useState, useRef, useCallback } from "react";
import { getAllCity } from "../../services/cityServices";
import { getAllCinema } from "../../services/cinemaServices";
import SeatLayoutBuilder from "../SeatLayoutBuilder";

function RoomForm({
  onFinish,
  onCancel,
  initialValues,
  submitButtonText = "Cập nhật",
}) {
  const [form] = Form.useForm();
  const [cities, setCities] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [filteredCinemas, setFilteredCinemas] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [seatLayout, setSeatLayout] = useState([]);
  const initialValuesSetRef = useRef(false);

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

  // Filter cinemas based on selected city
  useEffect(() => {
    if (!selectedCityId) {
      setFilteredCinemas([]);
      return;
    }

    const filtered = cinemas.filter((cinema) => {
      // Kiểm tra nếu cinema có cityIds và có giao điểm với selectedCityId
      return cinema.cityIds && cinema.cityIds.some(cityId => {
        const cityIdValue = typeof cityId === 'object' ? cityId._id : cityId;
        return cityIdValue === selectedCityId;
      });
    });

    // Tạo tree data cho TreeSelect
    const treeData = buildCinemaTree(filtered);
    setFilteredCinemas(treeData);
  }, [selectedCityId, cinemas]);

  // Build tree structure for cinemas
  const buildCinemaTree = (cinemasList) => {
    const parentCinemas = cinemasList.filter(cinema => !cinema.parentId);
    const childCinemas = cinemasList.filter(cinema => cinema.parentId);

    const treeData = parentCinemas.map(parent => ({
      title: parent.name,
      value: parent._id,
      key: parent._id,
      children: childCinemas
        .filter(child => {
          const parentIdValue = typeof child.parentId === 'object' ? child.parentId._id : child.parentId;
          return parentIdValue === parent._id;
        })
        .map(child => ({
          title: `└─ ${child.name}`,
          value: child._id,
          key: child._id,
        }))
    }));

    return treeData;
  };

  // Helper function: Tìm cinema object từ ID
  const findCinemaById = useCallback((cinemaId) => {
    return cinemas.find(cinema => cinema._id === cinemaId);
  }, [cinemas]);

  // Helper function: Lấy cityId từ cinemaId
  const getCityIdFromCinema = useCallback((cinemaId) => {
    const cinema = findCinemaById(cinemaId);
    if (!cinema || !cinema.cityIds || cinema.cityIds.length === 0) {
      return null;
    }
    
    // Lấy cityId đầu tiên
    const firstCityId = cinema.cityIds[0];
    return typeof firstCityId === 'object' ? firstCityId._id : firstCityId;
  }, [findCinemaById]);

  // Handle city selection change
  const handleCityChange = (value) => {
    setSelectedCityId(value);
    // Reset cinemaId khi thay đổi city
    form.setFieldValue('cinemaId', undefined);
  };

  // Handle seat layout change
  const handleSeatLayoutChange = (newSeatLayout) => {
    setSeatLayout(newSeatLayout);
  };

  // Set initial values chỉ một lần khi có dữ liệu từ props
  useEffect(() => {
    if (initialValues && !initialValuesSetRef.current && cinemas.length > 0) {
      // Process cinemaId - extract _id if it's populated
      let processedCinemaId = null;
      if (initialValues.cinemaId) {
        processedCinemaId = typeof initialValues.cinemaId === 'object' 
          ? initialValues.cinemaId._id 
          : initialValues.cinemaId;
      }

      // Tìm cityId từ cinemaId để set selectedCityId
      if (processedCinemaId) {
        const cityId = getCityIdFromCinema(processedCinemaId);
        if (cityId) {
          setSelectedCityId(cityId);
        }
      }

      // Set form values
      form.setFieldsValue({
        ...initialValues,
        cinemaId: processedCinemaId,
      });

      // Set seat layout nếu có
      if (initialValues.seatLayout) {
        setSeatLayout(initialValues.seatLayout);
      }

      initialValuesSetRef.current = true;
    }
  }, [initialValues, form, cinemas, getCityIdFromCinema]);

  // Reset flag khi initialValues thay đổi
  useEffect(() => {
    initialValuesSetRef.current = false;
  }, [initialValues]);

  const handleFinish = async (values) => {
    console.log("Form values before processing:", values);
    try {
      // Thêm seatLayout vào values
      values.seatLayout = seatLayout;

      // Fix: Xử lý status đúng cách
      if (typeof values.status === 'boolean') {
        values.status = values.status ? "active" : "inactive";
      }

      console.log("Values after processing:", values);
      const result = await onFinish(values);

      // Chỉ reset form khi onFinish return true (thành công)
      if (result === true) {
        form.resetFields();
        setSeatLayout([]);
        setSelectedCityId(null);
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
      supportedFormats: [],
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
        <Col span={12}>
          <Form.Item
            name="name"
            label="Tên phòng chiếu"
            rules={[{ required: true, message: "Vui lòng nhập tên phòng chiếu" }]}
          >
            <Input type="text" placeholder="Nhập tên phòng chiếu" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Thành phố (để lọc rạp)"
            tooltip="Chọn thành phố để lọc danh sách rạp chiếu"
          >
            <Select
              allowClear
              placeholder="Chọn thành phố"
              options={cities}
              showSearch
              optionFilterProp="label" 
              onChange={handleCityChange}
              value={selectedCityId}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="cinemaId"
            label="Rạp chiếu"
            rules={[{ required: true, message: "Vui lòng chọn rạp chiếu" }]}
          >
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="Chọn rạp chiếu"
              allowClear
              treeDefaultExpandAll
              treeData={filteredCinemas}
              disabled={!selectedCityId}
              notFoundContent={
                !selectedCityId
                  ? "Vui lòng chọn thành phố trước"
                  : "Không có rạp nào trong thành phố này"
              }
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="supportedFormats"
            label="Định dạng chiếu hỗ trợ"
            rules={[
              { required: true, message: "Vui lòng chọn ít nhất một định dạng chiếu" },
            ]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn định dạng chiếu hỗ trợ"
              options={[
                { value: "2D", label: "2D" },
                { value: "3D", label: "3D" },
                { value: "IMAX", label: "IMAX" },
                { value: "4DX", label: "4DX" },
              ]}
            />
          </Form.Item>
        </Col>

        {/* Seat Layout Builder */}
        <Col span={24}>
          <Form.Item
            label="Sơ đồ ghế"
            required
            tooltip="Tạo sơ đồ ghế cho phòng chiếu"
          >
            <SeatLayoutBuilder
              onChange={handleSeatLayoutChange}
              value={seatLayout}
            />
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
            <Button className="mr-10" type="primary" htmlType="submit">
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

export default RoomForm;