// src/components/CinemaRoom3D/FirstPersonView.jsx
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/**
 * Camera teleport đến vị trí ghế, nhìn về phía màn hình
 * Dùng useThree() để truy cập camera và controls
 */
const FirstPersonView = ({ seat, screenZ }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!seat || !seat.position) return;

    const [sx, sy, sz] = seat.position;

    // Đặt camera ở đầu người ngồi (~0.9m trên mặt ghế)
    camera.position.set(sx, sy + 0.9, sz);

    // Nhìn về phía màn hình
    camera.lookAt(0, sy + 1.2, screenZ);

    // Reset field of view cho first-person
    camera.fov = 75;
    camera.updateProjectionMatrix();
  }, [seat, camera, screenZ]);

  return (
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      rotateSpeed={0.4}
      minPolarAngle={Math.PI / 6}   // không nhìn quá lên trên
      maxPolarAngle={Math.PI / 1.5} // không nhìn quá xuống
    />
  );
};

export default FirstPersonView;