import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, Radio, Button, Row, Col, Typography, Space, Tag, message } from "antd";
import { ClearOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const SeatLayoutBuilder = ({ onChange, value = [] }) => {
  const [selectedSeatType, setSelectedSeatType] = useState("standard");
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [seatMatrix, setSeatMatrix] = useState({});
  const [seatOrder, setSeatOrder] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null); // { row, col }
  const [dragEnd, setDragEnd] = useState(null);     // { row, col }
  const dragStartRef = useRef(null);
  const isDraggingRef = useRef(false);

  const rows = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], []);
  const maxColumns = 20;

  // ─── Init from value prop ───────────────────────────────────────────────────
  useEffect(() => {
    if (value && value.length > 0) {
      const matrix = {};
      const orderArray = [];

      value.forEach(seat => {
        const key = `${seat.row}-${seat.number}`;
        matrix[key] = {
          type: seat.type,
          partnerSeatKey: seat.partnerSeatKey || null,
          seatKey: seat.seatKey
        };
        orderArray.push({ key, seatKey: seat.seatKey, row: seat.row, type: seat.type });
      });

      orderArray.sort((a, b) => {
        const aNum = parseInt(a.seatKey.substring(1));
        const bNum = parseInt(b.seatKey.substring(1));
        return aNum - bNum;
      });

      setSeatMatrix(matrix);
      setSeatOrder(orderArray);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const updateSeatLayout = useCallback((newMatrix, newOrder) => {
    setSeatMatrix(newMatrix);
    setSeatOrder(newOrder);

    const seatLayout = newOrder.map(orderItem => {
      const seat = newMatrix[orderItem.key];
      if (!seat) return null;
      const [row, colStr] = orderItem.key.split('-');
      const col = parseInt(colStr);
      const data = { row, number: col, type: seat.type, seatKey: seat.seatKey };
      if (seat.type === 'couple' && seat.partnerSeatKey) {
        data.partnerSeatKey = seat.partnerSeatKey;
      }
      return data;
    }).filter(Boolean);

    onChange(seatLayout);
  }, [onChange]);

  // ─── Compute preview cells from drag region ─────────────────────────────────
  const getDragPreviewKeys = useCallback(() => {
    if (!dragStart || !dragEnd) return new Set();

    const rowStart = rows.indexOf(dragStart.row);
    const rowEnd = rows.indexOf(dragEnd.row);
    const colStart = dragStart.col;
    const colEnd = dragEnd.col;

    const minRow = Math.min(rowStart, rowEnd);
    const maxRow = Math.max(rowStart, rowEnd);
    const minCol = Math.min(colStart, colEnd);
    const maxCol = Math.max(colStart, colEnd);

    const keys = new Set();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        keys.add(`${rows[r]}-${c}`);
      }
    }
    return keys;
  }, [dragStart, dragEnd, rows]);

  // ─── Renumber toàn bộ 1 hàng theo thứ tự cột vật lý ──────────────────────────
  // dragLeftToRight = true  → cột nhỏ → lớn
  // dragLeftToRight = false → cột lớn → nhỏ
  const renumberRow = (row, matrix, order, dragLeftToRight = true) => {
    // Sắp xếp các seat của hàng theo cột vật lý
    const seatsInRow = order
      .filter(item => item.row === row)
      .sort((a, b) => {
        const colA = parseInt(a.key.split('-')[1]);
        const colB = parseInt(b.key.split('-')[1]);
        return dragLeftToRight ? colA - colB : colB - colA;
      });

    // Build map oldSeatKey -> orderItem để tìm partner
    const oldKeyToItem = {};
    seatsInRow.forEach(item => { oldKeyToItem[item.seatKey] = item; });

    let counter = 1;
    const visited = new Set();

    seatsInRow.forEach(item => {
      if (visited.has(item.key)) return;
      const seat = matrix[item.key];
      if (!seat) return;

      if (seat.type === 'couple') {
        // Tìm partner bằng partnerSeatKey cũ (placeholder hoặc key thật)
        const oldPartnerSeatKey = seat.partnerSeatKey;
        const partnerItem = oldKeyToItem[oldPartnerSeatKey];

        const newSeatKey1 = `${row}${counter++}`;
        const newSeatKey2 = `${row}${counter++}`;

        matrix[item.key].seatKey = newSeatKey1;
        matrix[item.key].partnerSeatKey = newSeatKey2;
        item.seatKey = newSeatKey1;
        visited.add(item.key);

        if (partnerItem && !visited.has(partnerItem.key)) {
          matrix[partnerItem.key].seatKey = newSeatKey2;
          matrix[partnerItem.key].partnerSeatKey = newSeatKey1;
          partnerItem.seatKey = newSeatKey2;
          visited.add(partnerItem.key);
        }
      } else {
        const newSeatKey = `${row}${counter++}`;
        matrix[item.key].seatKey = newSeatKey;
        item.seatKey = newSeatKey;
        visited.add(item.key);
      }
    });
  };

  // ─── Apply drag selection ───────────────────────────────────────────────────
  const applyDragSelection = useCallback((start, end, currentMatrix, currentOrder) => {
    if (!start || !end) return;

    const rowStart = rows.indexOf(start.row);
    const rowEnd = rows.indexOf(end.row);
    const colStart = start.col;
    const colEnd = end.col;

    const minRow = Math.min(rowStart, rowEnd);
    const maxRow = Math.max(rowStart, rowEnd);
    const minCol = Math.min(colStart, colEnd);
    const maxCol = Math.max(colStart, colEnd);

    // Hướng đánh số theo chiều kéo ngang
    const dragLeftToRight = colStart <= colEnd;

    const newMatrix = { ...currentMatrix };
    let newOrder = [...currentOrder];

    // Tập hợp các hàng bị ảnh hưởng để renumber sau
    const affectedRows = new Set();

    for (let r = minRow; r <= maxRow; r++) {
      const row = rows[r];

      // Danh sách cột trong hàng, theo hướng kéo
      const cols = [];
      if (dragLeftToRight) {
        for (let c = minCol; c <= maxCol; c++) cols.push(c);
      } else {
        for (let c = maxCol; c >= minCol; c--) cols.push(c);
      }

      if (selectedSeatType === 'couple') {
        const freeCols = cols.filter(c => !newMatrix[`${row}-${c}`]);
        const pairCount = Math.floor(freeCols.length / 2);
        const usedCols = freeCols.slice(0, pairCount * 2);

        for (let i = 0; i < usedCols.length; i += 2) {
          const col1 = usedCols[i];
          const col2 = usedCols[i + 1];
          const key1 = `${row}-${col1}`;
          const key2 = `${row}-${col2}`;

          // Placeholder seatKey — sẽ được renumber ngay sau
          const placeholder1 = `${row}_tmp_${col1}`;
          const placeholder2 = `${row}_tmp_${col2}`;

          newMatrix[key1] = { type: 'couple', seatKey: placeholder1, partnerSeatKey: placeholder2 };
          newMatrix[key2] = { type: 'couple', seatKey: placeholder2, partnerSeatKey: placeholder1 };
          newOrder.push({ key: key1, seatKey: placeholder1, row, type: 'couple' });
          newOrder.push({ key: key2, seatKey: placeholder2, row, type: 'couple' });
        }

        if (freeCols.length % 2 !== 0 && freeCols.length > 0) {
          messageApi.warning(`Hàng ${row}: bỏ 1 ghế lẻ khi tạo ghế đôi.`);
        }
      } else {
        for (const c of cols) {
          const key = `${row}-${c}`;
          if (newMatrix[key]) continue;

          const placeholder = `${row}_tmp_${c}`;
          newMatrix[key] = { type: selectedSeatType, seatKey: placeholder, partnerSeatKey: null };
          newOrder.push({ key, seatKey: placeholder, row, type: selectedSeatType });
        }
      }

      affectedRows.add(row);
    }

    // Renumber lại từng hàng bị ảnh hưởng theo cột vật lý
    // Nếu hàng đã có ghế từ trước → giữ chiều hiện tại, không bị override bởi hướng kéo
    affectedRows.forEach(row => {
      const existingSeats = currentOrder.filter(item => item.row === row);
      let rowDirection = dragLeftToRight; // mặc định theo hướng kéo (hàng mới)

      if (existingSeats.length >= 2) {
        // Detect chiều hiện tại của hàng: so cột vật lý vs số thứ tự ghế
        const sorted = [...existingSeats].sort((a, b) =>
          parseInt(a.key.split('-')[1]) - parseInt(b.key.split('-')[1])
        );
        const firstSeatKey = currentMatrix[sorted[0].key]?.seatKey || '';
        const lastSeatKey = currentMatrix[sorted[sorted.length - 1].key]?.seatKey || '';
        const firstNum = parseInt(firstSeatKey.replace(row, '')) || 1;
        const lastNum = parseInt(lastSeatKey.replace(row, '')) || 2;
        // Cột nhỏ có số ghế nhỏ hơn → đang trái→phải; ngược lại → phải→trái
        rowDirection = firstNum <= lastNum;
      }

      renumberRow(row, newMatrix, newOrder, rowDirection);
    });

    updateSeatLayout(newMatrix, newOrder);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, selectedSeatType, updateSeatLayout, messageApi]);

  // ─── Remove a single seat (click on existing seat) ──────────────────────────
  const removeSeat = useCallback((row, col, currentMatrix, currentOrder) => {
    const key = `${row}-${col}`;
    const seatToRemove = currentMatrix[key];
    if (!seatToRemove) return;

    const newMatrix = { ...currentMatrix };
    let newOrder = [...currentOrder];

    // Xóa partner nếu là couple
    // Tìm partner theo partnerSeatKey (seatKey của partner = partnerSeatKey của seat bị xóa)
    if (seatToRemove.type === 'couple' && seatToRemove.partnerSeatKey) {
      Object.keys(newMatrix).forEach(pk => {
        const s = newMatrix[pk];
        if (s && s.seatKey === seatToRemove.partnerSeatKey) {
          delete newMatrix[pk];
          newOrder = newOrder.filter(item => item.key !== pk);
        }
      });
    }

    delete newMatrix[key];
    newOrder = newOrder.filter(item => item.key !== key);

    // Detect chiều đánh số hiện tại của hàng trước khi renumber
    // So sánh index seatKey của 2 ghế đầu/cuối theo cột vật lý
    const detectDirection = () => {
      const seatsInRow = newOrder.filter(item => item.row === row);
      if (seatsInRow.length < 2) return true; // mặc định trái→phải
      const sorted = [...seatsInRow].sort((a, b) =>
        parseInt(a.key.split('-')[1]) - parseInt(b.key.split('-')[1])
      );
      const firstNum = parseInt(newMatrix[sorted[0].key]?.seatKey?.replace(row, '') || '1');
      const lastNum = parseInt(newMatrix[sorted[sorted.length - 1].key]?.seatKey?.replace(row, '') || '2');
      // Nếu cột nhỏ có số lớn hơn → chiều phải→trái
      return firstNum <= lastNum; // true = trái→phải
    };
    renumberRow(row, newMatrix, newOrder, detectDirection());

    updateSeatLayout(newMatrix, newOrder);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateSeatLayout]);

  // ─── Drag-delete: xóa tất cả ghế trong vùng kéo ───────────────────────────
  const applyDragDelete = useCallback((start, end, currentMatrix, currentOrder) => {
    if (!start || !end) return;

    const rowStart = rows.indexOf(start.row);
    const rowEnd = rows.indexOf(end.row);
    const minRow = Math.min(rowStart, rowEnd);
    const maxRow = Math.max(rowStart, rowEnd);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    const newMatrix = { ...currentMatrix };
    let newOrder = [...currentOrder];
    const affectedRows = new Set();

    for (let r = minRow; r <= maxRow; r++) {
      const row = rows[r];
      for (let c = minCol; c <= maxCol; c++) {
        const key = `${row}-${c}`;
        const seat = newMatrix[key];
        if (!seat) continue;

        // Xóa partner nếu là couple — capture partnerSeatKey trước để tránh no-loop-func
        if (seat.type === 'couple' && seat.partnerSeatKey) {
          const partnerSeatKey = seat.partnerSeatKey;
          const partnerKey = Object.keys(newMatrix).find(
            pk => newMatrix[pk]?.seatKey === partnerSeatKey
          );
          if (partnerKey) {
            delete newMatrix[partnerKey];
            newOrder = newOrder.filter(item => item.key !== partnerKey);
          }
        }

        delete newMatrix[key];
        newOrder = newOrder.filter(item => item.key !== key);
        affectedRows.add(row);
      }
    }

    // Renumber lại các hàng bị ảnh hưởng, giữ chiều hiện tại
    affectedRows.forEach(row => {
      const remaining = currentOrder.filter(
        item => item.row === row && newMatrix[item.key]
      );
      let rowDirection = true;
      if (remaining.length >= 2) {
        const sorted = [...remaining].sort((a, b) =>
          parseInt(a.key.split('-')[1]) - parseInt(b.key.split('-')[1])
        );
        const firstNum = parseInt(currentMatrix[sorted[0].key]?.seatKey?.replace(row, '')) || 1;
        const lastNum = parseInt(currentMatrix[sorted[sorted.length - 1].key]?.seatKey?.replace(row, '')) || 2;
        rowDirection = firstNum <= lastNum;
      }
      renumberRow(row, newMatrix, newOrder, rowDirection);
    });

    updateSeatLayout(newMatrix, newOrder);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, updateSeatLayout]);

  // ─── Mouse events on seat cells ─────────────────────────────────────────────
  const handleMouseDown = useCallback((row, col) => {
    // Delete mode: bắt đầu drag-delete (dù ô có ghế hay không)
    if (isDeleteMode) {
      isDraggingRef.current = true;
      dragStartRef.current = { row, col };
      setIsDragging(true);
      setDragStart({ row, col });
      setDragEnd({ row, col });
      return;
    }

    const key = `${row}-${col}`;
    // Add mode: click vào ghế đã có → xóa đơn lẻ
    if (seatMatrix[key]) {
      removeSeat(row, col, seatMatrix, seatOrder);
      return;
    }

    isDraggingRef.current = true;
    dragStartRef.current = { row, col };
    setIsDragging(true);
    setDragStart({ row, col });
    setDragEnd({ row, col });
  }, [isDeleteMode, seatMatrix, seatOrder, removeSeat]);

  const handleMouseEnter = useCallback((row, col) => {
    if (!isDraggingRef.current) return;
    setDragEnd({ row, col });
  }, []);

  const handleMouseUp = useCallback((row, col) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsDragging(false);

    const start = dragStartRef.current;
    const end = { row, col };

    if (isDeleteMode) {
      applyDragDelete(start, end, seatMatrix, seatOrder);
    } else {
      applyDragSelection(start, end, seatMatrix, seatOrder);
    }

    setDragStart(null);
    setDragEnd(null);
    dragStartRef.current = null;
  }, [isDeleteMode, seatMatrix, seatOrder, applyDragSelection, applyDragDelete]);

  // Cancel drag if mouse leaves the grid
  const handleGridMouseLeave = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      dragStartRef.current = null;
    }
  }, []);

  // ─── Clear all ──────────────────────────────────────────────────────────────
  const clearAllSeats = () => {
    setSeatMatrix({});
    setSeatOrder([]);
    onChange([]);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  const previewKeys = isDragging ? getDragPreviewKeys() : new Set();

  const renderSeatGrid = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        width: '100%',
        overflowX: 'auto',
        userSelect: 'none',
      }}
      onMouseLeave={handleGridMouseLeave}
    >
      {/* Screen */}
      <div style={{
        width: '80%', height: '8px',
        background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 100%)',
        borderRadius: '4px', marginBottom: '20px', position: 'relative'
      }}>
        <div style={{
          position: 'absolute', top: '12px', left: '50%',
          transform: 'translateX(-50%)', fontSize: '12px', color: '#666', fontWeight: 'bold'
        }}>
          MÀN HÌNH
        </div>
      </div>

      <div style={{ display: 'inline-block', minWidth: 'fit-content' }}>
        {/* Column header */}
        <div style={{ display: 'flex', marginBottom: '8px', marginLeft: '50px' }}>
          {Array.from({ length: maxColumns }, (_, i) => (
            <div key={i + 1} style={{
              width: '30px', height: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 'bold', color: '#666', margin: '1px'
            }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map(row => (
          <div key={row} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
            {/* Row label left */}
            <div style={{
              width: '40px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '14px', marginRight: '10px', color: '#333'
            }}>
              {row}
            </div>

            {/* Seats */}
            <div style={{ display: 'flex' }}>
              {Array.from({ length: maxColumns }, (_, colIndex) => {
                const col = colIndex + 1;
                const key = `${row}-${col}`;
                const seat = seatMatrix[key];
                const isPreview = previewKeys.has(key) && (isDeleteMode ? !!seat : !seat);

                return (
                  <SeatCellDrag
                    key={key}
                    row={row}
                    col={col}
                    seat={seat}
                    isPreview={isPreview}
                    isDeleteMode={isDeleteMode}
                    selectedSeatType={selectedSeatType}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onMouseUp={handleMouseUp}
                  />
                );
              })}
            </div>

            {/* Row label right */}
            <div style={{
              width: '40px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '14px', marginLeft: '10px', color: '#333'
            }}>
              {row}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const getSeatStats = () => {
    const stats = { total: 0, standard: 0, vip: 0, couple: 0 };
    Object.values(seatMatrix).forEach(seat => {
      stats.total++;
      if (seat.type === 'standard') stats.standard++;
      else if (seat.type === 'vip') stats.vip++;
      else if (seat.type === 'couple') stats.couple++;
    });
    return stats;
  };

  const stats = getSeatStats();

  return (
    <>
      {contextHolder}
      <Card>
        <Row gutter={[16, 16]}>
          {/* Controls */}
          <Col span={24}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={16}>
                <Space wrap>
                  <Text strong>Loại ghế:</Text>
                  <Radio.Group
                    value={selectedSeatType}
                    onChange={e => setSelectedSeatType(e.target.value)}
                  >
                    <Radio value="standard">Standard</Radio>
                    <Radio value="vip">VIP</Radio>
                    <Radio value="couple">Couple</Radio>
                  </Radio.Group>
                </Space>
              </Col>
              <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => setIsDeleteMode(v => !v)}
                    type={isDeleteMode ? 'primary' : 'default'}
                    danger={isDeleteMode}
                    size="small"
                  >
                    {isDeleteMode ? 'Đang xóa vùng' : 'Kéo để xóa'}
                  </Button>
                  <Button icon={<ClearOutlined />} onClick={clearAllSeats} danger size="small">
                    Xóa tất cả
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* Usage hint */}
            <div style={{
              marginTop: '8px', padding: '8px 12px',
              background: isDeleteMode ? '#fff1f0' : '#f0f5ff', borderRadius: '6px',
              fontSize: '12px', color: '#555',
              border: isDeleteMode ? '1px solid #ffa39e' : '1px solid transparent',
              transition: 'all 0.2s'
            }}>
              {isDeleteMode ? (
                <>🗑️ <strong>Chế độ xóa:</strong> Giữ và kéo để xóa vùng ghế. Click nút <strong>"Kéo để xóa"</strong> để thoát.</>
              ) : (
                <>
                  💡 <strong>Giữ và kéo</strong> để chọn vùng ghế. Kéo trái→phải đánh số từ trái; phải→trái đánh số từ phải.
                  &nbsp;<strong>Click</strong> vào ghế đã có để xóa đơn lẻ.
                  {selectedSeatType === 'couple' && (
                    <span style={{ color: '#eb2f96' }}>
                      &nbsp;• Ghế đôi: số ghế lẻ trong vùng sẽ tự bị bỏ.
                    </span>
                  )}
                </>
              )}
            </div>
          </Col>

          {/* Grid */}
          <Col span={24}>
            <Title level={5} style={{ textAlign: 'center', marginBottom: '16px' }}>
              Sơ đồ phòng chiếu
            </Title>
            {renderSeatGrid()}

            {/* Legend */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Space wrap>
                <Tag color="default">Trống</Tag>
                <Tag color="blue">Standard</Tag>
                <Tag color="gold">VIP</Tag>
                <Tag color="magenta">Couple</Tag>
                {isDeleteMode ? (
                  <Tag style={{ background: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322' }}>
                    Vùng sẽ xóa (preview)
                  </Tag>
                ) : (
                  <Tag style={{ background: '#e6f7ff', borderColor: '#91d5ff', color: '#1890ff' }}>
                    Đang chọn (preview)
                  </Tag>
                )}
              </Space>
            </div>
          </Col>

          {/* Stats */}
          <Col span={24}>
            <Card size="small" title="Thống kê ghế">
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={6}>
                  <Text>Tổng: <strong style={{ color: '#1890ff' }}>{stats.total}</strong></Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Text>Standard: <strong style={{ color: '#1890ff' }}>{stats.standard}</strong></Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Text>VIP: <strong style={{ color: '#faad14' }}>{stats.vip}</strong></Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Text>Couple: <strong style={{ color: '#eb2f96' }}>{stats.couple}</strong></Text>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>
    </>
  );
};

// ─── Internal drag-aware seat cell ─────────────────────────────────────────────
const SeatCellDrag = ({ row, col, seat, isPreview, isDeleteMode, selectedSeatType, onMouseDown, onMouseEnter, onMouseUp }) => {
  const getStyle = () => {
    const base = {
      width: '30px', height: '30px', margin: '1px',
      border: '1px solid #ddd', borderRadius: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: isDeleteMode ? 'crosshair' : (seat ? 'pointer' : 'crosshair'),
      fontSize: '10px', fontWeight: 'bold',
      transition: 'all 0.1s ease',
      userSelect: 'none',
    };

    // Delete mode preview: ghế sẽ bị xóa → highlight đỏ
    if (isPreview && isDeleteMode) {
      return { ...base, backgroundColor: '#ff4d4f', borderColor: '#cf1322', color: 'white', transform: 'scale(1.05)', opacity: 0.75 };
    }

    // Add mode preview: ô trống sẽ được thêm ghế
    if (isPreview && !isDeleteMode) {
      const previewColors = {
        standard: { bg: '#bae7ff', border: '#1890ff', color: '#003a8c' },
        vip:      { bg: '#ffe7ba', border: '#faad14', color: '#874d00' },
        couple:   { bg: '#ffd6e7', border: '#eb2f96', color: '#780650' },
      };
      const c = previewColors[selectedSeatType] || previewColors.standard;
      return { ...base, backgroundColor: c.bg, borderColor: c.border, color: c.color, transform: 'scale(1.05)' };
    }

    if (!seat) {
      return { ...base, backgroundColor: '#f5f5f5', color: '#ccc', borderColor: '#e0e0e0' };
    }

    switch (seat.type) {
      case 'standard': return { ...base, backgroundColor: '#1890ff', color: 'white', borderColor: '#0050b3' };
      case 'vip':      return { ...base, backgroundColor: '#faad14', color: 'white', borderColor: '#d48806' };
      case 'couple':   return { ...base, backgroundColor: '#eb2f96', color: 'white', borderColor: '#c41d7f' };
      default:         return base;
    }
  };

  const getTitle = () => {
    if (isDeleteMode) {
      return seat
        ? `Ghế ${seat.seatKey} - kéo để xóa vùng`
        : `Ô trống tại ${row}${col}`;
    }
    return seat
      ? `Ghế ${seat.seatKey} (${row}${col}) - ${seat.type.toUpperCase()}\nClick để xóa`
      : `Kéo để chọn vùng tại ${row}${col}`;
  };

  return (
    <div
      style={getStyle()}
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={() => onMouseUp(row, col)}
      title={getTitle()}
    >
      {seat ? seat.seatKey : ''}
    </div>
  );
};

export default SeatLayoutBuilder;