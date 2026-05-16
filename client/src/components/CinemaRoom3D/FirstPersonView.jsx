// src/components/CinemaRoom3D/FirstPersonView.jsx
//
// TRUE first-person: camera CỐ ĐỊNH tại vị trí ghế, chỉ xoay tại chỗ.
//
// Vấn đề của OrbitControls: nó xoay camera QUANH một target point,
// dù target đặt ở màn hình thì camera vẫn bay vòng quanh điểm đó.
// Fix: bỏ OrbitControls, tự handle mouse drag để xoay euler tại chỗ.

import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FirstPersonView = ({ seat, screenZ }) => {
  const { camera, gl } = useThree();

  // Góc xoay hiện tại
  const yawRef   = useRef(0);  // xoay ngang (trục Y)
  const pitchRef = useRef(0);  // xoay dọc (trục X)

  const isDragging = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });

  // Khi seat thay đổi: teleport camera + tính góc nhìn về màn hình
  useEffect(() => {
    if (!seat?.position) return;

    const [sx, sy, sz] = seat.position;
    camera.position.set(sx, sy + 0.9, sz);
    camera.fov = 75;
    camera.updateProjectionMatrix();

    // Tính yaw ban đầu hướng về tâm màn hình
    const dx = 0 - sx;
    const dz = screenZ - sz;
    yawRef.current   = Math.atan2(dx, -dz);
    pitchRef.current = 0.05; // nhìn hơi lên nhẹ
  }, [seat, camera, screenZ]);

  // Mỗi frame áp euler vào camera — camera KHÔNG di chuyển, chỉ xoay
  useFrame(() => {
    if (!seat?.position) return;
    camera.quaternion.setFromEuler(
      new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ')
    );
  });

  // Drag handlers
  const onPointerDown = useCallback((e) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    gl.domElement.style.cursor = 'grabbing';
  }, [gl]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.004;
    yawRef.current   -= dx * sensitivity;
    pitchRef.current -= dy * sensitivity;

    // Clamp: không lộn ngược trần/sàn
    pitchRef.current = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, pitchRef.current));
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    gl.domElement.style.cursor = 'grab';
  }, [gl]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown',  onPointerDown);
    el.addEventListener('pointermove',  onPointerMove);
    el.addEventListener('pointerup',    onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);
    return () => {
      el.style.cursor = 'default';
      el.removeEventListener('pointerdown',  onPointerDown);
      el.removeEventListener('pointermove',  onPointerMove);
      el.removeEventListener('pointerup',    onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
    };
  }, [gl, onPointerDown, onPointerMove, onPointerUp]);

  return null; // Không cần OrbitControls
};

export default FirstPersonView;