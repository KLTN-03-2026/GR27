// src/components/BookingModal/ComboSelection.jsx
import React, { useState, useEffect } from 'react';
import { Button, List, message } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import Loading from '../Loading';
import { getAllCombos } from '../../services/comboFoodServices';

const ComboSelection = ({ selectedCombos, onSelect }) => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const result = await getAllCombos();
        // Lọc ra các combo đang active
        setCombos(result.filter(c => c.status === 'active') || []);
      } catch (err) {
        message.error('Không thể tải danh sách combo.');
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const handleQuantityChange = (combo, newQuantity) => {
    const newSelectedCombos = [...selectedCombos];
    const existingComboIndex = newSelectedCombos.findIndex(c => c.comboFoodId === combo._id);

    if (newQuantity > 0) {
      if (existingComboIndex > -1) {
        newSelectedCombos[existingComboIndex].quantity = newQuantity;
      } else {
        newSelectedCombos.push({
          comboFoodId: combo._id,
          name: combo.name,
          price: combo.price,
          quantity: newQuantity,
          description: combo.description, // Thêm description để hiển thị
        });
      }
    } else {
      if (existingComboIndex > -1) {
        newSelectedCombos.splice(existingComboIndex, 1);
      }
    }
    onSelect(newSelectedCombos);
  };

  if (loading) return <Loading tip="Đang tải combo..." />;

  return (
    <List
      itemLayout="horizontal"
      dataSource={combos}
      renderItem={item => {
        const selected = selectedCombos.find(c => c.comboFoodId === item._id);
        const quantity = selected?.quantity || 0;

        return (
          <List.Item className="combo-item-new">
            {/* Phần tên và mô tả combo */}
            <div className="combo-details-new">
              <div className="combo-name-new">{item.name}</div>
              <div className="combo-description-new">{item.description}</div>
            </div>

            {/* Phần giá và nút tăng/giảm */}
            <div className="combo-actions-new">
              <div className="combo-price-new">
                {item.price.toLocaleString('vi-VN')} đ
              </div>
              <div className="combo-quantity-control">
                <Button
                  className="quantity-btn"
                  icon={<MinusOutlined />}
                  onClick={() => handleQuantityChange(item, quantity - 1)}
                  disabled={quantity === 0}
                />
                <span className="quantity-display">{quantity}</span>
                <Button
                  className="quantity-btn"
                  icon={<PlusOutlined />}
                  onClick={() => handleQuantityChange(item, quantity + 1)}
                  disabled={quantity >= 10} // Giới hạn tối đa 10 combo mỗi loại
                />
              </div>
            </div>
          </List.Item>
        );
      }}
    />
  );
};

export default ComboSelection;