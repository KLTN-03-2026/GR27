// src/components/CinemaRoom3D/RoomGeometry.jsx
//
// Thêm bậc thang sàn (stepped floor) theo từng hàng ghế như rạp thật.
// Nhận thêm props: totalRows, rowDepth, rowElevation từ useSeats3D
// để tính chính xác vị trí và kích thước từng bậc.

import React from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

const RoomGeometry = ({
  width = 20,
  depth = 20,
  height = 7,
  // Thông tin hàng ghế để tính bậc thang
  totalRows = 0,
  rowDepth = 1.6,
  rowElevation = 0.45,
  seatsStartZ = 0, // z của hàng đầu tiên (rowIndex=0)
}) => {
  const halfW = width / 2;
  const halfD = depth / 2;

  const screenZ = -halfD + 0.1;
  const screenWidth = width * 0.85;
  const screenHeight = height * 0.55;
  const screenY = height * 0.38;

  const ceilingLightRows = 2;
  const ceilingLightCols = 3;

  // ── Tính bậc thang sàn ─────────────────────────────────────────────────────
  // Mỗi bậc là một box nằm dưới hàng ghế tương ứng.
  // rowIndex=0 là hàng gần màn hình nhất (z nhỏ nhất), cao nhất.
  // rowIndex=totalRows-1 là hàng cuối (z lớn nhất), thấp nhất (y=0).
  //
  // Chiều cao bậc = rowIndex * rowElevation (hàng trước cao hơn)
  // Vị trí z = seatsStartZ + rowIndex * rowDepth
  // Mỗi bậc dày theo z = rowDepth, rộng = width - 2 (chừa lối đi 2 bên)

  const steps =
    totalRows > 0
      ? Array.from({ length: totalRows }, (_, rowIndex) => {
          // y của mặt trên bậc = rowIndex * rowElevation
          const stepTopY = rowIndex * rowElevation;
          // Chiều cao khối box (từ y=0 lên tới mặt trên bậc)
          const stepH = stepTopY; // box cao bằng chính nó
          // z tâm của bậc
          const stepZ = seatsStartZ + rowIndex * rowDepth;

          return { rowIndex, stepTopY, stepH, stepZ };
        })
      : [];

  return (
    <group>
      {/* === ÁNH SÁNG === */}
      <ambientLight intensity={1.1} color="#4a4a6a" />
      <ambientLight intensity={0.65} color="#ffffff" />

      <pointLight
        position={[0, screenY, screenZ + 1]}
        intensity={5}
        color="#e8f4fd"
        distance={depth * 1.3}
        decay={1.5}
      />
      <pointLight
        position={[0, height - 0.5, 0]}
        intensity={1.8}
        color="#e0d8ff"
        distance={depth * 1.5}
        decay={1.5}
      />
      <pointLight
        position={[0, height - 1, halfD - 1]}
        intensity={0.8}
        color="#ffffff"
        distance={depth}
        decay={2}
      />
      <pointLight
        position={[-halfW + 0.5, 0.5, 0]}
        intensity={0.7}
        color="#ffd700"
        distance={depth}
        decay={2}
      />
      <pointLight
        position={[halfW - 0.5, 0.5, 0]}
        intensity={0.7}
        color="#ffd700"
        distance={depth}
        decay={2}
      />

      {/* === ĐÈN TRẦN === */}
      {Array.from({ length: ceilingLightRows }, (_, row) => {
        const xOffset =
          -halfW * 0.5 + row * ((halfW * 1.0) / (ceilingLightRows - 1));
        return Array.from({ length: ceilingLightCols }, (_, col) => {
          const zPos =
            -halfD + 2 + col * ((depth - 4) / (ceilingLightCols - 1));
          return (
            <group key={`ceil-${row}-${col}`}>
              <mesh position={[xOffset, height - 0.08, zPos]}>
                <sphereGeometry args={[0.07, 6, 6]} />
                <meshStandardMaterial
                  color="#fff8e7"
                  emissive="#fff5d0"
                  emissiveIntensity={3}
                />
              </mesh>
              <pointLight
                position={[xOffset, height - 0.15, zPos]}
                intensity={0.5}
                color="#fff8e7"
                distance={height * 2}
                decay={2}
              />
            </group>
          );
        });
      })}

      {/* === SÀN PHẲNG (vùng lối đi phía trước + sau ghế) === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#1e2a38"
          roughness={0.85}
          metalness={0.08}
        />
      </mesh>

      {/* === BẬC THANG SÀN (stepped floor) ===
       * Mỗi hàng ghế = 1 bục sàn.
       * rowIndex=0 (hàng gần màn hình, cao nhất) xuống đến hàng cuối (thấp nhất y=0).
       * Bục bao gồm:
       *   - Mặt trên (top face): plane nằm ngang tại y = stepTopY
       *   - Thành trước (riser): plane đứng nối mặt trên bậc này với mặt trên bậc kế
       */}
      {steps.map(({ rowIndex, stepTopY, stepZ }) => {
        if (rowIndex === 0) return null; // hàng đầu = sàn phẳng, không cần bậc

        const prevStepTopY = (rowIndex - 1) * rowElevation; // mặt trên bậc trước (thấp hơn)
        const riserH = stepTopY - prevStepTopY; // chiều cao thành đứng
        const riserZ = stepZ - rowDepth / 2; // z mép trước của bậc này

        // Chiều rộng bục (chừa lối đi giữa 0.6 + buffer)
        const stepWidth = width - 0.2;

        return (
          <group key={`step-${rowIndex}`}>
            {/* Mặt trên bậc (top face) — nằm ngang */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, stepTopY + 0.001, stepZ]}
              receiveShadow
            >
              <planeGeometry args={[stepWidth, rowDepth]} />
              <meshStandardMaterial
                color="#243d58"
                roughness={0.9}
                metalness={0.05}
              />
            </mesh>

            {/* Thành đứng trước bậc (riser) — nối mặt trên bậc thấp lên bậc cao */}
            <mesh position={[0, prevStepTopY + riserH / 2, riserZ]}>
              <boxGeometry args={[stepWidth, riserH, 0.06]} />
              <meshStandardMaterial color="#1a2030" roughness={0.9} />
            </mesh>

            {/* Khối xi măng đặc — bịt kín gầm ghế */}
            <mesh position={[0, stepTopY / 2, stepZ]}>
              <boxGeometry args={[stepWidth, stepTopY, rowDepth]} />
              <meshStandardMaterial
                color="#1a2535"
                roughness={0.95}
                metalness={0.05}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

       {totalRows > 0 && (() => {
        const lastStepTopY = (totalRows - 1) * rowElevation;
        const lastStepZ    = seatsStartZ + (totalRows - 1) * rowDepth;
        const gapStart     = lastStepZ + rowDepth / 2;
        const gapEnd       = halfD;
        const gapDepth     = gapEnd - gapStart;
        const gapZ         = (gapStart + gapEnd) / 2;
        const stepWidth    = width - 0.2;

        if (gapDepth <= 0) return null;

        return (
          <mesh position={[0, lastStepTopY / 2, gapZ]}>
            <boxGeometry args={[stepWidth, lastStepTopY + 0.1, gapDepth]} />
            <meshStandardMaterial color="#243d58" roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
        );
      })()}

      {/* Thảm lối đi giữa */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.6, depth - 1]} />
        <meshStandardMaterial color="#1e1060" roughness={1} />
      </mesh>

      {/* === TRẦN === */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#1c1c28"
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === TƯỜNG TRÁI === */}
      <mesh position={[-halfW, height / 2, 0]}>
        <boxGeometry args={[0.25, height, depth]} />
        <meshStandardMaterial
          color="#52526e"
          roughness={0.8}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === TƯỜNG PHẢI === */}
      <mesh position={[halfW, height / 2, 0]}>
        <boxGeometry args={[0.25, height, depth]} />
        <meshStandardMaterial
          color="#52526e"
          roughness={0.8}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === TƯỜNG SAU === */}
      <mesh position={[0, height / 2, halfD]}>
        <boxGeometry args={[width, height, 0.25]} />
        <meshStandardMaterial
          color="#48485f"
          roughness={0.8}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === TƯỜNG TRƯỚC (phía màn hình) === */}
      <mesh position={[0, height / 2, screenZ - 0.2]}>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial color="#0d0d12" roughness={0.9} />
      </mesh>

      {/* === MÀN HÌNH === */}
      <mesh position={[0, screenY, screenZ + 0.01]}>
        <boxGeometry args={[screenWidth + 0.3, screenHeight + 0.3, 0.05]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.3} />
      </mesh>
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
      <Html
        position={[0, screenY, screenZ + 0.1]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            color: "rgba(20, 60, 100, 0.7)",
            fontSize: "14px",
            fontWeight: "700",
            letterSpacing: "4px",
            fontFamily: "Arial, sans-serif",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          MÀN HÌNH CHÍNH
        </div>
      </Html>

      {/* === ĐÈN LỐI ĐI — đặt trên mép trước từng bậc thang === */}
      {totalRows > 0
        ? Array.from({ length: totalRows }, (_, rowIndex) => {
            // y mặt trên bậc + nhô lên 0.06 để bóng đèn nằm trên bề mặt
            const stepY = rowIndex * rowElevation + 0.06;
            // z mép trước của bậc (cạnh gần phía dưới)
            const stepZ = seatsStartZ + rowIndex * rowDepth - rowDepth * 0.45;
            return (
              <group key={`aisle-light-${rowIndex}`}>
                <mesh position={[-halfW + 0.35, stepY, stepZ]}>
                  <sphereGeometry args={[0.055, 6, 6]} />
                  <meshStandardMaterial
                    color="#ffd700"
                    emissive="#ffd700"
                    emissiveIntensity={2.5}
                  />
                </mesh>
                <mesh position={[halfW - 0.35, stepY, stepZ]}>
                  <sphereGeometry args={[0.055, 6, 6]} />
                  <meshStandardMaterial
                    color="#ffd700"
                    emissive="#ffd700"
                    emissiveIntensity={2.5}
                  />
                </mesh>
              </group>
            );
          })
        : // fallback khi chưa có dữ liệu ghế
          Array.from({ length: 6 }, (_, i) => {
            const z = -halfD + 1 + i * ((depth - 2) / 5);
            return (
              <group key={i}>
                <mesh position={[-halfW + 0.35, 0.15, z]}>
                  <sphereGeometry args={[0.055, 6, 6]} />
                  <meshStandardMaterial
                    color="#ffd700"
                    emissive="#ffd700"
                    emissiveIntensity={2}
                  />
                </mesh>
                <mesh position={[halfW - 0.35, 0.15, z]}>
                  <sphereGeometry args={[0.055, 6, 6]} />
                  <meshStandardMaterial
                    color="#ffd700"
                    emissive="#ffd700"
                    emissiveIntensity={2}
                  />
                </mesh>
              </group>
            );
          })}
    </group>
  );
};

export default RoomGeometry;
