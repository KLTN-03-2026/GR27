// src/components/CinemaRoom3D/RoomGeometry.jsx
import React from 'react';
import { Html } from '@react-three/drei';

/**
 * Render phòng chiếu 3D procedural:
 * Sàn, trần, tường 3 bên, màn hình phát sáng
 *
 * FIX: Tăng ánh sáng để ghế không bị đen
 */
const RoomGeometry = ({ width = 20, depth = 20, height = 7 }) => {
  const halfW = width / 2;
  const halfD = depth / 2;

  // Màn hình nằm ở phía z âm (phía trước phòng)
  const screenZ = -halfD + 0.1;
  const screenWidth = width * 0.85;
  const screenHeight = height * 0.55;
  const screenY = height * 0.38;

  return (
    <group>
      {/* === ÁNH SÁNG === */}

      {/*
       * FIX CHÍNH: Tăng ambientLight từ 0.15 lên 0.55
       * Đây là nguyên nhân chính khiến ghế bị đen thui
       * Rạp chiếu phim thật tối nhưng trong 3D viewer cần đủ sáng để phân biệt màu ghế
       */}
      <ambientLight intensity={0.55} color="#2a2a4a" />

      {/* Ánh sáng trắng tổng thể để fill shadow */}
      <ambientLight intensity={0.3} color="#ffffff" />

      {/* Ánh sáng từ màn hình chiếu ra — tăng intensity */}
      <pointLight
        position={[0, screenY, screenZ + 1]}
        intensity={4}
        color="#e8f4fd"
        distance={depth * 1.2}
        decay={1.5}
      />

      {/* Đèn fill từ phía trên giữa phòng — đảm bảo ghế không bị underlit */}
      <pointLight
        position={[0, height - 0.5, 0]}
        intensity={1.2}
        color="#e0d8ff"
        distance={depth * 1.5}
        decay={1.5}
      />

      {/* Đèn nhẹ từ phía sau phòng (phụ trợ) */}
      <pointLight
        position={[0, height - 1, halfD - 1]}
        intensity={0.6}
        color="#ffffff"
        distance={depth}
        decay={2}
      />

      {/* Đèn lối đi (trái và phải) — giữ nguyên vàng ấm */}
      <pointLight position={[-halfW + 0.5, 0.5, 0]} intensity={0.6} color="#ffd700" distance={depth} decay={2} />
      <pointLight position={[halfW - 0.5, 0.5, 0]} intensity={0.6} color="#ffd700" distance={depth} decay={2} />

      {/* === SÀN === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        {/* FIX: Sáng sàn lên chút để trông giống ảnh tham chiếu */}
        <meshStandardMaterial color="#1a1a2a" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Thảm lối đi giữa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.6, depth - 1]} />
        <meshStandardMaterial color="#1e1060" roughness={1} />
      </mesh>

      {/* === TRẦN === */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#0d0d1a" roughness={1} side={2} />
      </mesh>

      {/* === TƯỜNG TRÁI === */}
      <mesh position={[-halfW, height / 2, 0]}>
        <boxGeometry args={[0.2, height, depth]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.9} />
      </mesh>

      {/* === TƯỜNG PHẢI === */}
      <mesh position={[halfW, height / 2, 0]}>
        <boxGeometry args={[0.2, height, depth]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.9} />
      </mesh>

      {/* === TƯỜNG SAU (phía sau người xem) === */}
      <mesh position={[0, height / 2, halfD]}>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.9} />
      </mesh>

      {/* === TƯỜNG TRƯỚC (phía màn hình) === */}
      <mesh position={[0, height / 2, screenZ - 0.2]}>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial color="#0d0d12" roughness={0.9} />
      </mesh>

      {/* === MÀN HÌNH CHIẾU === */}
      {/* Viền màn hình (khung đen) */}
      <mesh position={[0, screenY, screenZ + 0.01]}>
        <boxGeometry args={[screenWidth + 0.3, screenHeight + 0.3, 0.05]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Bề mặt màn hình (phát sáng) */}
      <mesh position={[0, screenY, screenZ + 0.05]}>
        <planeGeometry args={[screenWidth, screenHeight]} />
        <meshStandardMaterial
          color="#d4eaf7"
          emissive="#c8e6f5"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0}
        />
      </mesh>

      {/* Text "MÀN HÌNH CHÍNH" trên màn hình */}
      <Html
        position={[0, screenY, screenZ + 0.1]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          color: 'rgba(20, 60, 100, 0.7)',
          fontSize: '14px',
          fontWeight: '700',
          letterSpacing: '4px',
          fontFamily: 'Arial, sans-serif',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}>
          MÀN HÌNH CHÍNH
        </div>
      </Html>

      {/* === ĐÈN VÀNG LỐI ĐI (dọc theo 2 bên) === */}
      {Array.from({ length: 6 }, (_, i) => {
        const z = -halfD + 1 + i * ((depth - 2) / 5);
        return (
          <group key={i}>
            {/* Đèn nhỏ bên trái */}
            <mesh position={[-halfW + 0.3, 0.15, z]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
            </mesh>
            {/* Đèn nhỏ bên phải */}
            <mesh position={[halfW - 0.3, 0.15, z]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export default RoomGeometry;