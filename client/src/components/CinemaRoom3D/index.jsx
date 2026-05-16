// src/components/CinemaRoom3D/index.jsx
import React, { useState, useCallback, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Button, Alert, message } from 'antd';
import {
  EyeOutlined, LeftOutlined, RightOutlined,
  RollbackOutlined, ExpandOutlined, CompressOutlined,
} from '@ant-design/icons';
import * as THREE from 'three';
import RoomGeometry from './RoomGeometry';
import SeatsLayer from './SeatsLayer';
import Tooltip3D from './Tooltip3D';
import FirstPersonView from './FirstPersonView';
import useSeats3D from './useSeats3D';
import './CinemaRoom3D.scss';


// ==========================================
// WASD Camera Controller (bên trong Canvas)
// ==========================================
const WASDController = ({ keysRef }) => {
  const { camera, invalidate } = useThree();
  const SPEED = 0.1;

  useFrame(() => {
    const keys = keysRef.current;
    const moving =
      keys['w'] || keys['a'] || keys['s'] || keys['d'] ||
      keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];

    if (!moving) return;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys['w'] || keys['arrowup'])    camera.position.addScaledVector(forward,  SPEED);
    if (keys['s'] || keys['arrowdown'])  camera.position.addScaledVector(forward, -SPEED);
    if (keys['a'] || keys['arrowleft'])  camera.position.addScaledVector(right,   -SPEED);
    if (keys['d'] || keys['arrowright']) camera.position.addScaledVector(right,    SPEED);

    invalidate();
  });

  return null;
};

// ==========================================
// Scene nội bộ (phải nằm trong <Canvas>)
// ==========================================
const CinemaScene = ({
  showtime, processedSeats, partnerKeys, roomDimensions,
  selectedSeats, onSeatClick, onSeatHover, hoveredSeat,
  isFirstPerson, viewingSeat, keysRef,
  seatsData, // { totalRows, rowDepth, rowElevation, seatsStartZ }
}) => {
  const screenZ = -(roomDimensions.depth / 2) + 0.1;

  return (
    <>
      <RoomGeometry
        width={roomDimensions.width}
        depth={roomDimensions.depth}
        height={roomDimensions.height}
        totalRows={seatsData?.totalRows ?? 0}
        rowDepth={seatsData?.rowDepth ?? 1.6}
        rowElevation={seatsData?.rowElevation ?? 0.45}
        seatsStartZ={seatsData?.seatsStartZ ?? 0}
      />
      <SeatsLayer
        processedSeats={processedSeats}
        partnerKeys={partnerKeys}
        selectedSeats={selectedSeats}
        onSeatClick={onSeatClick}
        onSeatHover={onSeatHover}
        viewingSeat={viewingSeat}
        showtime={showtime}
      />

      {!isFirstPerson && hoveredSeat && (
        <Tooltip3D seat={hoveredSeat} showtime={showtime} />
      )}

      <WASDController keysRef={keysRef} />

      {isFirstPerson ? (
        <FirstPersonView seat={viewingSeat} screenZ={screenZ} />
      ) : (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={3}
          maxDistance={roomDimensions.depth * 0.75}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 1, 0]}
          regress
        />
      )}
    </>
  );
};

// ==========================================
// Main Component
// ==========================================
const CinemaRoom3D = ({ showtime, selectedSeats = [], onSelect }) => {
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [viewingIndex, setViewingIndex]   = useState(0);
  const [hoveredSeat, setHoveredSeat]     = useState(null);
  const [webGLError, setWebGLError]       = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);

  const keysRef = useRef({});

  const { processedSeats, partnerKeys, roomDimensions, allRows } = useSeats3D(showtime?.seats);

  // Tính seatsStartZ: z của hàng đầu tiên (rowIndex=0) — dùng để vẽ bậc thang đúng vị trí
  const seatsStartZ = React.useMemo(() => {
    if (!processedSeats.length) return 0;
    const firstRowSeat = processedSeats.find(s => s.rowIndex === 0);
    return firstRowSeat?.position?.[2] ?? 0;
  }, [processedSeats]);

  const seatsData = {
    totalRows:    allRows?.length ?? 0,
    rowDepth:     1.6,
    rowElevation: 0.45,
    seatsStartZ,
  };

  const availableViewSeats = selectedSeats.filter(
    s => s.status !== 'booked' && s.status !== 'locked'
  );

  const viewingSeat = isFirstPerson
    ? processedSeats.find(s => s.seatKey === availableViewSeats[viewingIndex]?.seatKey)
    : null;

  // WebGL check
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      if (!c.getContext('webgl') && !c.getContext('experimental-webgl')) setWebGLError(true);
    } catch { setWebGLError(true); }
  }, []);

  // WASD keyboard listeners
  useEffect(() => {
    const MAP = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      if (MAP.includes(k)) { keysRef.current[k] = true; e.preventDefault(); }
    };
    const onUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // Seat click handler
  const handleSeatClick = useCallback((seat) => {
    if (seat.status === 'booked' || seat.status === 'locked') {
      message.warning('Ghế này đã có người chọn.'); return;
    }
    const isSelected = selectedSeats.some(s => s.seatKey === seat.seatKey);
    let next = [...selectedSeats];

    if (isSelected) {
      next = next.filter(s => s.seatKey !== seat.seatKey);
      if (seat.type === 'couple' && seat.partnerSeatKey)
        next = next.filter(s => s.seatKey !== seat.partnerSeatKey);
    } else {
      const count = new Set(next.map(s => s.seatKey)).size;
      const add   = seat.type === 'couple' ? 2 : 1;
      if (count + add > 6) { message.warning('Tối đa 6 ghế.'); return; }

      if (seat.type === 'couple') {
        const partner = showtime?.seats?.find(s => s.seatKey === seat.partnerSeatKey);
        if (partner && (partner.status === 'booked' || partner.status === 'locked')) {
          message.warning('Ghế đôi đi kèm đã có người chọn.'); return;
        }
        const extra = showtime?.seatTypes?.find(st => st.type === 'couple')?.extraFee || 0;
        const price = ((showtime?.basePrice || 0) + extra) / 2;
        next.push({ ...seat, price });
        if (partner) next.push({ ...partner, price });
      } else {
        const extra = showtime?.seatTypes?.find(st => st.type === seat.type)?.extraFee || 0;
        next.push({ ...seat, price: (showtime?.basePrice || 0) + extra });
      }
    }
    onSelect?.(next);
  }, [selectedSeats, showtime, onSelect]);

  const handleSeatHover = useCallback((seat) => setHoveredSeat(seat), []);

  if (webGLError) {
    return (
      <Alert type="warning" showIcon message="Không thể hiển thị 3D"
        description="Trình duyệt không hỗ trợ WebGL. Vui lòng dùng Chrome/Firefox mới nhất."
        style={{ margin: '16px 0' }} />
    );
  }

  // D-pad button helper
  const DPadBtn = ({ keyName, icon, className }) => (
    <button
      className={`cinema3d-dpad__btn ${className}`}
      onPointerDown={() => { keysRef.current[keyName] = true; }}
      onPointerUp={()   => { keysRef.current[keyName] = false; }}
      onPointerLeave={() => { keysRef.current[keyName] = false; }}
    >
      {icon}
    </button>
  );

  const initCameraZ = roomDimensions.depth * 0.38;
  const initCameraY = 6;

  // ✅ Khi fullscreen: giảm DPR + demand frameloop để đỡ lag do pixel nhiều hơn
  // Khi modal thường: giữ nguyên cấu hình cũ (mượt sẵn rồi)
  const canvasDpr       = isFullscreen ? [1, 1]   : [1, 1.5];
  const canvasFrameloop = isFullscreen && !isFirstPerson ? 'demand' : 'always';

  return (
    <div className={`cinema3d-wrapper ${isFullscreen ? 'cinema3d-wrapper--fullscreen' : ''}`}>

      {/* === TOOLBAR === */}
      <div className="cinema3d-toolbar">
        {isFirstPerson ? (
          <div className="cinema3d-toolbar__left">
            <Button icon={<RollbackOutlined />} onClick={() => setIsFirstPerson(false)}
              className="cinema3d-btn cinema3d-btn--back">Quay lại</Button>
            {availableViewSeats.length > 1 && (
              <div className="cinema3d-seat-nav">
                <Button icon={<LeftOutlined />} size="small" className="cinema3d-btn"
                  onClick={() => setViewingIndex(i => (i - 1 + availableViewSeats.length) % availableViewSeats.length)} />
                <span className="cinema3d-seat-nav__label">
                  {availableViewSeats[viewingIndex]?.seatKey} ({viewingIndex + 1}/{availableViewSeats.length})
                </span>
                <Button icon={<RightOutlined />} size="small" className="cinema3d-btn"
                  onClick={() => setViewingIndex(i => (i + 1) % availableViewSeats.length)} />
              </div>
            )}
            <span className="cinema3d-toolbar__hint">🎥 Góc nhìn từ ghế {viewingSeat?.seatKey}</span>
          </div>
        ) : (
          <div className="cinema3d-toolbar__left">
            <Button type="primary" icon={<EyeOutlined />}
              onClick={() => {
                if (availableViewSeats.length === 0) { message.info('Chọn ghế để xem góc nhìn.'); return; }
                setViewingIndex(0); setIsFirstPerson(true);
              }}
              disabled={selectedSeats.length === 0}
              className="cinema3d-btn cinema3d-btn--view">
              Xem góc nhìn từ ghế
            </Button>
            {selectedSeats.length === 0 && (
              <span className="cinema3d-toolbar__hint">Chọn ghế để xem góc nhìn</span>
            )}
          </div>
        )}
        <div className="cinema3d-toolbar__right">
          <Button icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={() => setIsFullscreen(v => !v)}
            className="cinema3d-btn" title="Toàn màn hình" />
        </div>
      </div>

      {/* === CANVAS === */}
      <div className="cinema3d-canvas-wrapper">
        <Canvas
          key={`${roomDimensions.depth}`}
          camera={{
            position: [0, initCameraY, initCameraZ],
            fov: 60,
            near: 0.1,
            far: 1000,
          }}
          shadows={false}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
            alpha: false,
          }}
          dpr={canvasDpr}
          frameloop={canvasFrameloop}
          style={{ background: '#0a0a14' }}
          performance={{ min: 0.5 }}
        >
          <Suspense fallback={null}>
            <CinemaScene
              showtime={showtime}
              processedSeats={processedSeats}
              partnerKeys={partnerKeys}
              roomDimensions={roomDimensions}
              selectedSeats={selectedSeats}
              onSeatClick={handleSeatClick}
              onSeatHover={handleSeatHover}
              hoveredSeat={hoveredSeat}
              isFirstPerson={isFirstPerson}
              viewingSeat={viewingSeat}
              keysRef={keysRef}
              seatsData={seatsData}
            />
          </Suspense>
        </Canvas>

        {/* === D-PAD MŨI TÊN === */}
        <div className="cinema3d-dpad">
          <DPadBtn keyName="w"          icon="↑" className="cinema3d-dpad__up" />
          <DPadBtn keyName="a"          icon="←" className="cinema3d-dpad__left" />
          <div className="cinema3d-dpad__center" />
          <DPadBtn keyName="d"          icon="→" className="cinema3d-dpad__right" />
          <DPadBtn keyName="s"          icon="↓" className="cinema3d-dpad__down" />
        </div>
      </div>

      {/* === LEGEND === */}
      {!isFirstPerson && (
        <div className="cinema3d-legend">
          {[
            { color: '#9f1239', label: 'Thường' },
            { color: '#6d28d9', label: 'VIP' },
            { color: '#be185d', label: 'Đôi' },
            { color: '#16a34a', label: 'Đang chọn' },
            { color: '#374151', label: 'Đã bán' },
          ].map(({ color, label }) => (
            <span key={label} className="cinema3d-legend__item">
              <span className="cinema3d-legend__dot" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* === HINT BAR === */}
      {!isFirstPerson && (
        <div className="cinema3d-hint-bar">
          <span>🖱️ Kéo để xoay</span>
          <span>🔍 Cuộn để zoom</span>
          <span>⌨️ WASD / ↑↓←→ để di chuyển</span>
          <span>👆 Click ghế để chọn</span>
        </div>
      )}
    </div>
  );
};

export default CinemaRoom3D;