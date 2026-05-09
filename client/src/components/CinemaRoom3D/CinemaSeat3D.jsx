// src/components/CinemaRoom3D/CinemaSeat3D.jsx
//
// Ghế rạp dựng bằng Three.js geometry thuần — không dùng .glb
// Nhẹ hơn rất nhiều, hỗ trợ 100+ ghế không lag
//
// Cấu trúc ghế:
//   [headrest]  ← gối tựa đầu
//   [backrest]  ← lưng ghế (nghiêng nhẹ)
//   [seat]      ← mặt ngồi (có thể gập lên)
//   [armrest L/R] ← tay vịn (màu đen)
//   [legs]      ← 2 chân đỡ

import React, { useMemo } from 'react';
import * as THREE from 'three';

// -------------------------------------------------------
// Màu theo loại ghế
// -------------------------------------------------------
const TYPE_COLORS = {
  standard: '#9f1239',  // đỏ gạch
  vip:      '#6d28d9',  // tím
  couple:   '#be185d',  // hồng
};
const STATUS_COLORS = {
  booked:   '#374151',
  locked:   '#374151',
  selected: '#16a34a',
  viewing:  '#d97706',
};
const ARMREST_COLOR  = '#111111';
const LEG_COLOR      = '#1a1a1a';

// -------------------------------------------------------
// Shared geometries (tạo 1 lần, dùng lại cho tất cả ghế)
// -------------------------------------------------------
const geoCache = {};
const getGeo = (key, factory) => {
  if (!geoCache[key]) geoCache[key] = factory();
  return geoCache[key];
};

// Material cache theo màu hex
const matCache = {};
const getFabricMat = (hex) => {
  if (!matCache[hex]) {
    const c = new THREE.Color(hex);
    matCache[hex] = new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.8,
      metalness: 0.0,
      emissive: c.clone().multiplyScalar(0.25),
      emissiveIntensity: 1,
    });
  }
  return matCache[hex];
};
const armrestMat = new THREE.MeshStandardMaterial({ color: ARMREST_COLOR, roughness: 0.4, metalness: 0.3 });
const legMat     = new THREE.MeshStandardMaterial({ color: LEG_COLOR,     roughness: 0.5, metalness: 0.4 });

// -------------------------------------------------------
// ProceduralSeat — render 1 ghế bằng BoxGeometry
// -------------------------------------------------------
const ProceduralSeat = ({ color, showArmrestLeft = true, showArmrestRight = true }) => {
  const fabricMat = useMemo(() => getFabricMat(color), [color]);

  // Geometry (shared)
  const backGeo     = getGeo('back',     () => new THREE.BoxGeometry(0.78, 0.72, 0.1));
  const headGeo     = getGeo('head',     () => new THREE.BoxGeometry(0.42, 0.18, 0.1));
  const seatGeo     = getGeo('seat',     () => new THREE.BoxGeometry(0.78, 0.1,  0.6));
  const armGeo      = getGeo('arm',      () => new THREE.BoxGeometry(0.08, 0.12, 0.55));
  const armTopGeo   = getGeo('armtop',   () => new THREE.BoxGeometry(0.1,  0.05, 0.5));
  const legGeo      = getGeo('leg',      () => new THREE.BoxGeometry(0.06, 0.38, 0.06));
  const baseGeo     = getGeo('base',     () => new THREE.BoxGeometry(0.72, 0.05, 0.12));

  return (
    <group>
      {/* === LƯNG GHẾ (nghiêng nhẹ ra sau ~8°) === */}
      <group rotation={[0.14, 0, 0]} position={[0, 0.52, -0.22]}>
        <mesh geometry={backGeo} material={fabricMat} castShadow />
        {/* Gối tựa đầu */}
        <mesh geometry={headGeo} material={fabricMat} position={[0, 0.44, 0.02]} />
      </group>

      {/* === MẶT NGỒI === */}
      <mesh geometry={seatGeo} material={fabricMat} position={[0, 0.14, 0.04]} castShadow />

      {/* === TAY VỊN TRÁI === */}
      {showArmrestLeft && (
        <group position={[-0.44, 0.18, 0.02]}>
          <mesh geometry={armGeo}    material={armrestMat} />
          <mesh geometry={armTopGeo} material={armrestMat} position={[0, 0.085, -0.015]} />
        </group>
      )}

      {/* === TAY VỊN PHẢI === */}
      {showArmrestRight && (
        <group position={[0.44, 0.18, 0.02]}>
          <mesh geometry={armGeo}    material={armrestMat} />
          <mesh geometry={armTopGeo} material={armrestMat} position={[0, 0.085, -0.015]} />
        </group>
      )}

      {/* === CHÂN GHẾ (2 chân trước) === */}
      <mesh geometry={legGeo} material={legMat} position={[-0.28, -0.1, 0.22]} />
      <mesh geometry={legGeo} material={legMat} position={[ 0.28, -0.1, 0.22]} />

      {/* === ĐẾ GHẾ (thanh nối 2 chân) === */}
      <mesh geometry={baseGeo} material={legMat} position={[0, -0.26, 0.22]} />
    </group>
  );
};

// -------------------------------------------------------
// CinemaSeat3D — public component
// -------------------------------------------------------
const CinemaSeat3D = ({
  seat,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isSelected = false,
  isBooked   = false,
  isViewing  = false,
  onSeatClick,
  onSeatHover,
  scale = 1,
  showArmrestLeft  = true,
  showArmrestRight = true,
}) => {
  const color = useMemo(() => {
    if (isBooked)   return STATUS_COLORS.booked;
    if (isViewing)  return STATUS_COLORS.viewing;
    if (isSelected) return STATUS_COLORS.selected;
    return TYPE_COLORS[seat?.type] ?? TYPE_COLORS.standard;
  }, [isBooked, isViewing, isSelected, seat?.type]);

  const s = typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <group
      position={position}
      rotation={rotation}
      scale={s}
      onClick={(e) => { e.stopPropagation(); if (!isBooked) onSeatClick?.(seat); }}
      onPointerOver={(e) => { e.stopPropagation(); if (!isBooked) document.body.style.cursor = 'pointer'; onSeatHover?.(seat); }}
      onPointerOut={(e)  => { e.stopPropagation(); document.body.style.cursor = 'default'; onSeatHover?.(null); }}
    >
      <ProceduralSeat
        color={color}
        showArmrestLeft={showArmrestLeft}
        showArmrestRight={showArmrestRight}
      />
    </group>
  );
};

export default CinemaSeat3D;