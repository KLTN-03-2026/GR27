// src/components/CinemaRoom3D/CinemaSeat3D.jsx
//
// Tối ưu performance: gộp toàn bộ geometry của 1 ghế thành 1 mesh duy nhất
// dùng BufferGeometryUtils.mergeGeometries → giảm draw call từ 7 xuống còn 2
// (1 cho fabric, 1 cho armrest+leg vì khác material)
//
// Trước: 100 ghế × 7 mesh = 700 draw calls
// Sau:   100 ghế × 2 mesh = 200 draw calls

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// -------------------------------------------------------
// Màu theo loại / trạng thái ghế
// -------------------------------------------------------
const TYPE_COLORS = {
  standard: '#9f1239',
  vip:      '#6d28d9',
  couple:   '#be185d',
};
const STATUS_COLORS = {
  booked:   '#374151',
  locked:   '#374151',
  selected: '#16a34a',
  viewing:  '#d97706',
};
const ARMREST_COLOR = '#111111';

// -------------------------------------------------------
// Material cache
// -------------------------------------------------------
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

const armLegMat = new THREE.MeshStandardMaterial({
  color: ARMREST_COLOR,
  roughness: 0.45,
  metalness: 0.3,
});

// -------------------------------------------------------
// Tạo geometry đã transform sẵn (apply matrix) để merge được
// -------------------------------------------------------
const makeBox = (w, h, d, px, py, pz, rx = 0) => {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.Matrix4();
  if (rx !== 0) mat.makeRotationX(rx);
  const trans = new THREE.Matrix4().makeTranslation(px, py, pz);
  mat.premultiply(trans);
  geo.applyMatrix4(mat);
  return geo;
};

// -------------------------------------------------------
// Cache merged geometry theo key (color + armrest config)
// Tránh tạo lại mỗi lần re-render
// -------------------------------------------------------
const geoCache = {};

const buildFabricGeo = (showArmrestLeft, showArmrestRight) => {
  const key = `fabric_${showArmrestLeft}_${showArmrestRight}`;
  if (geoCache[key]) return geoCache[key];

  const parts = [
    // Lưng ghế (nghiêng ~8° = 0.14 rad quanh X, translate về sau)
    makeBox(0.78, 0.72, 0.1,  0,     0.52, -0.22, 0.14),
    // Gối tựa đầu
    makeBox(0.42, 0.18, 0.1,  0,     0.96, -0.20, 0.14),
    // Mặt ngồi
    makeBox(0.78, 0.1,  0.6,  0,     0.14,  0.04),
  ];

  if (showArmrestLeft) {
    parts.push(makeBox(0.08, 0.12, 0.55, -0.44, 0.26, 0.02)); // thân tay vịn trái
    parts.push(makeBox(0.1,  0.05, 0.5,  -0.44, 0.345, 0.005)); // mặt trên tay vịn trái
  }
  if (showArmrestRight) {
    parts.push(makeBox(0.08, 0.12, 0.55,  0.44, 0.26, 0.02));  // thân tay vịn phải
    parts.push(makeBox(0.1,  0.05, 0.5,   0.44, 0.345, 0.005)); // mặt trên tay vịn phải
  }

  const merged = mergeGeometries(parts);
  parts.forEach(g => g.dispose());
  geoCache[key] = merged;
  return merged;
};

const buildLegGeo = () => {
  if (geoCache['legs']) return geoCache['legs'];

  const parts = [
    makeBox(0.06, 0.38, 0.06, -0.28, -0.1, 0.22), // chân trái
    makeBox(0.06, 0.38, 0.06,  0.28, -0.1, 0.22), // chân phải
    makeBox(0.72, 0.05, 0.12,  0,   -0.26, 0.22), // đế nối
  ];

  const merged = mergeGeometries(parts);
  parts.forEach(g => g.dispose());
  geoCache['legs'] = merged;
  return merged;
};

// -------------------------------------------------------
// ProceduralSeat — chỉ 2 mesh thay vì 7
// -------------------------------------------------------
const ProceduralSeat = ({ color, showArmrestLeft = true, showArmrestRight = true }) => {
  const fabricMat = useMemo(() => getFabricMat(color), [color]);
  const fabricGeo = useMemo(
    () => buildFabricGeo(showArmrestLeft, showArmrestRight),
    [showArmrestLeft, showArmrestRight]
  );
  const legGeo = useMemo(() => buildLegGeo(), []);

  return (
    <group>
      {/* Fabric: lưng + đầu + mặt ngồi + tay vịn — 1 draw call */}
      <mesh geometry={fabricGeo} material={fabricMat} castShadow />
      {/* Legs: 2 chân + đế — 1 draw call */}
      <mesh geometry={legGeo} material={armLegMat} />
    </group>
  );
};

// -------------------------------------------------------
// CinemaSeat3D — public component (API không đổi)
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
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; onSeatHover?.(seat); }}
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