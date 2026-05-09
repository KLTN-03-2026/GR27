# Hướng Dẫn Triển Khai Tính Năng Sơ Đồ Phòng Chiếu 3D

## Tổng Quan Tính Năng

Web đặt vé xem phim đa rạp tích hợp chế độ xem sơ đồ ghế 3D bằng React Three Fiber (R3F). Người dùng có thể xoay, zoom, click vào ghế để chọn, và xem góc nhìn first-person từ ghế đã chọn.

---

## Stack Công Nghệ

- **React 19** (CRA)
- **@react-three/fiber** — R3F render engine
- **@react-three/drei** — helpers: useGLTF, OrbitControls, CameraControls, Html, useProgress
- **three** — ThreeJS core
- **Ant Design 5** — UI components
- **Model ghế:** `/public/models/cinema_seat.glb` (1 file duy nhất)

### Cài đặt packages
```bash
npm install @react-three/fiber @react-three/drei three
```

---

## Cấu Trúc File Cần Tạo/Sửa

```
src/
└── components/
    ├── BookingModal/
    │   ├── SeatSelection.jsx          ← SỬA: thêm toggle 2D/3D
    │   ├── Booking.scss               ← SỬA: thêm styles cho 3D viewer
    │   └── index.jsx                  ← KHÔNG SỬA
    └── CinemaRoom3D/                  ← TẠO MỚI (folder)
        ├── index.jsx                  ← Main component, export CinemaRoom3D
        ├── CinemaRoom3D.scss          ← Styles cho wrapper
        ├── useSeats3D.js              ← Hook: tính tọa độ 3D từ seatLayout
        ├── RoomGeometry.jsx           ← Phòng chiếu: sàn, tường, trần, màn hình
        ├── CinemaSeat3D.jsx           ← 1 ghế đơn từ .glb
        ├── CoupleSeat3D.jsx           ← Ghế đôi = 2 ghế mirror
        ├── SeatsLayer.jsx             ← Render toàn bộ ghế từ layout data
        ├── Tooltip3D.jsx              ← Tooltip khi hover ghế
        └── FirstPersonView.jsx        ← Camera first-person từ ghế
```

---

## Chi Tiết Từng File

### 1. `useSeats3D.js` — Hook tính tọa độ 3D

**Nhiệm vụ:** Nhận `seatLayout: ISeat[]` từ `showtime.seats`, tính ra tọa độ `(x, y, z)` cho từng ghế trong không gian 3D.

**Logic:**
```
- allRows: sort theo alphabet A→Z (A gần màn hình nhất, Z xa nhất)
- rowIndex: A=0, B=1, C=2...
- x = (seat.number - 1) * SEAT_WIDTH - (maxNumber / 2) * SEAT_WIDTH  → căn giữa theo chiều ngang
- z = -rowIndex * ROW_DEPTH  → âm = gần màn hình, dương = xa
- y = rowIndex * ROW_ELEVATION  → hàng sau cao hơn (tạo độ dốc rạp)
- partnerSeatKey → đánh dấu là partner, không render riêng
- null trong matrix (số ghế thiếu) → lối đi, không render ghế
```

**Constants:**
```js
const SEAT_WIDTH = 1.0      // khoảng cách ngang giữa các ghế
const ROW_DEPTH = 1.5       // khoảng cách sâu giữa các hàng
const ROW_ELEVATION = 0.3   // mỗi hàng cao hơn hàng trước
const SEAT_HEIGHT = 0.5     // ghế cao hơn sàn hàng đó
```

**Return:** `processedSeats[]` — mỗi phần tử gồm `{ ...seat, position: [x, y, z], isPartner: bool }`

---

### 2. `RoomGeometry.jsx` — Phòng chiếu procedural

**Nhiệm vụ:** Render phòng chiếu 3D hoàn toàn bằng ThreeJS geometry (không dùng .glb).

**Các thành phần:**
- **Sàn:** `PlaneGeometry` xoay -90° trên trục X, màu tối `#1a1a1a`, có thể thêm texture carpet
- **Trần:** `PlaneGeometry` giống sàn nhưng lật, màu `#111`
- **Tường trái/phải:** `BoxGeometry` mỏng, màu `#1a1a1a`
- **Tường sau:** `BoxGeometry`, màu `#222`
- **Màn hình chiếu:**
  - `PlaneGeometry` lớn (ví dụ 16x7 units) đặt phía trước phòng
  - `MeshStandardMaterial` với `emissive: '#ffffff'`, `emissiveIntensity: 0.3` để phát sáng nhẹ
  - Text "MÀN HÌNH CHÍNH" dùng `<Html>` của drei
  - Thêm `<pointLight>` màu trắng nhạt trước màn hình để tạo hiệu ứng ánh sáng chiếu ra
- **Đèn:** `ambientLight` intensity thấp + `pointLight` từ màn hình

**Kích thước phòng (tính theo số hàng/số ghế từ data):**
```js
const roomWidth = maxSeatsPerRow * SEAT_WIDTH + 4  // padding 2m mỗi bên
const roomDepth = totalRows * ROW_DEPTH + 4
const roomHeight = 6
```

---

### 3. `CinemaSeat3D.jsx` — Ghế đơn từ .glb

**Nhiệm vụ:** Render 1 ghế rạp từ file `/public/models/cinema_seat.glb`, override màu theo trạng thái.

**Props:**
```js
{
  seat,           // ISeat object
  position,       // [x, y, z]
  isSelected,     // bool — đang được chọn
  isBooked,       // bool — đã có người đặt
  isViewing,      // bool — đang xem góc nhìn từ ghế này
  onSeatClick,    // function(seat)
  onSeatHover,    // function(seat | null)
  rotation,       // [0,0,0] default, [0, Math.PI, 0] nếu là ghế mirror
}
```

**Màu sắc:**
```js
const SEAT_COLORS = {
  booked:    '#6b7280',  // xám — đã đặt, không thể chọn
  selected:  '#22c55e',  // xanh lá — đang chọn trong phiên này
  viewing:   '#f59e0b',  // vàng cam — đang xem góc nhìn
  standard:  '#b91c1c',  // đỏ gạch — ghế thường
  vip:       '#7c3aed',  // tím — ghế VIP
  couple:    '#db2777',  // hồng — ghế đôi
}
```

**Override màu:**
```js
// Sau khi clone scene:
clonedScene.traverse((child) => {
  if (child.isMesh) {
    // Debug lần đầu: console.log(child.name) để biết tên mesh vải
    // Chỉ đổi mesh là phần vải (fabric), giữ nguyên khung đen
    if (child.name.toLowerCase().includes('fabric') || 
        child.name.toLowerCase().includes('seat') ||
        child.name.toLowerCase().includes('cushion')) {
      child.material = child.material.clone()
      child.material.color.set(seatColor)
    }
  }
})
```

> **Lưu ý debug:** Chạy app lần đầu, mở console xem tên mesh để filter đúng.  
> Nếu không biết tên, override TẤT CẢ mesh trước rồi điều chỉnh sau.

**Cursor:** `onPointerOver` → `cursor: 'pointer'` nếu không phải booked

---

### 4. `CoupleSeat3D.jsx` — Ghế đôi

**Nhiệm vụ:** Render ghế đôi = 2 ghế đơn mirror nhau.

**Logic:**
- Ghế trái: rotation `[0, 0, 0]`
- Ghế phải: rotation `[0, Math.PI, 0]` (xoay 180° trục Y)
- Khoảng cách: offset x = ±`COUPLE_OFFSET` (≈ 0.5)
- Không có tay vịn chính giữa → tự nhiên do mirror

**Khi click:**
- Click vào 1 trong 2 ghế → gọi `onSeatClick(mainSeat)` (ghế chính, không phải partner)
- Cả 2 ghế đổi màu cùng lúc (truyền `isSelected` cho cả 2)

**Khi hover:**
- Hover vào ghế nào → tooltip hiện thông tin của `mainSeat` (partnerSeatKey)

---

### 5. `SeatsLayer.jsx` — Layer render tất cả ghế

**Nhiệm vụ:** Loop qua `processedSeats` từ `useSeats3D`, render `CinemaSeat3D` hoặc `CoupleSeat3D` tùy loại.

**Logic filter partner:**
```js
// Không render ghế là partner (đã được render bởi ghế chính)
const partnerKeys = new Set(
  layout.filter(s => s.type === 'couple' && s.partnerSeatKey)
        .map(s => s.partnerSeatKey)
)
const renderableSeats = processedSeats.filter(s => !partnerKeys.has(s.seatKey))
```

**Render:**
```jsx
renderableSeats.map(seat => {
  if (seat.type === 'couple') {
    return <CoupleSeat3D key={seat.seatKey} seat={seat} ... />
  }
  return <CinemaSeat3D key={seat.seatKey} seat={seat} ... />
})
```

---

### 6. `Tooltip3D.jsx` — Tooltip hover

**Dùng `<Html>` từ @react-three/drei** để render HTML trong 3D space.

**Hiển thị:**
```
Ghế: A5
Loại: VIP
Giá: 120.000đ
```

**Điều kiện hiện:** chỉ khi `hoveredSeat !== null` và `!isFirstPersonMode`

---

### 7. `FirstPersonView.jsx` — Camera góc nhìn từ ghế

**Nhiệm vụ:** Khi user click "Xem góc nhìn", camera teleport đến vị trí ghế, nhìn về màn hình.

**Dùng `useThree()` từ R3F để lấy `camera`:**
```js
const { camera } = useThree()

useEffect(() => {
  if (!viewingSeat) return
  
  const seatPos = viewingSeat.position
  // Camera đặt ở đầu người ngồi (~0.9m trên mặt ghế)
  camera.position.set(seatPos[0], seatPos[1] + 0.9, seatPos[2])
  
  // Nhìn về phía màn hình (z âm, y cao hơn một chút)
  camera.lookAt(0, 2, -roomDepth / 2)
}, [viewingSeat, camera])
```

**Controls trong first-person mode:**
- Dùng `OrbitControls` với `enablePan={false}`, `enableZoom={false}`
- Chỉ cho phép rotate quanh điểm nhìn

---

### 8. `index.jsx` — Main CinemaRoom3D component

**Props nhận vào:**
```js
{
  showtime,          // showtime object (chứa seats, seatTypes, basePrice)
  selectedSeats,     // ISeat[] — từ BookingModal state
  onSelect,          // function(newSelectedSeats) — callback cập nhật lên BookingModal
}
```

**State nội bộ:**
```js
const [isFirstPerson, setIsFirstPerson] = useState(false)
const [viewingSeatIndex, setViewingSeatIndex] = useState(0)  // index trong selectedSeats
const [hoveredSeat, setHoveredSeat] = useState(null)
const [webGLSupported, setWebGLSupported] = useState(true)
```

**WebGL check:**
```js
useEffect(() => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) setWebGLSupported(false)
  } catch(e) {
    setWebGLSupported(false)
  }
}, [])
```

**UI Layout:**
```
[Toolbar: nút "Quay lại" (trong first-person) | nút "Xem góc nhìn" (khi đã chọn ghế)]
[Canvas R3F]
  └── Suspense (loading)
      ├── RoomGeometry
      ├── SeatsLayer
      ├── Tooltip3D
      ├── FirstPersonView (nếu isFirstPerson)
      └── OrbitControls (nếu không first-person)
[Nếu nhiều ghế: nút Previous/Next ghế để đổi góc nhìn]
```

---

### 9. Sửa `SeatSelection.jsx` — Thêm toggle 2D/3D

**Thêm state:**
```js
const [viewMode, setViewMode] = useState('2d')  // '2d' | '3d'
```

**Thêm UI:**
```jsx
<div className="view-mode-toggle">
  <Button 
    type={viewMode === '2d' ? 'primary' : 'default'}
    onClick={() => setViewMode('2d')}
  >Sơ đồ 2D</Button>
  <Button
    type={viewMode === '3d' ? 'primary' : 'default'}
    onClick={() => setViewMode('3d')}
    disabled={!webGLSupported}
    icon={<VideoCameraOutlined />}
  >Chế độ 3D</Button>
</div>

{viewMode === '2d' 
  ? renderSeatLayout()  // code cũ
  : <CinemaRoom3D showtime={showtime} selectedSeats={selectedSeats} onSelect={onSelect} />
}
```

**selectedSeats sync:** Vì cả 2D và 3D đều nhận `selectedSeats` và `onSelect` từ BookingModal, data tự đồng bộ khi toggle.

---

## Luồng Dữ Liệu

```
BookingModal
  └── selectedSeats (state)
  └── setSelectedSeats (setter)
        ↓
  SeatSelection.jsx
    ├── [2D mode] renderSeatLayout() — code cũ
    └── [3D mode] CinemaRoom3D
          ├── useSeats3D(showtime.seats) → processedSeats với position 3D
          ├── SeatsLayer → CinemaSeat3D / CoupleSeat3D
          │     ├── onClick → handleSeatClick() → onSelect(newSeats) → lên BookingModal
          │     └── màu sắc dựa vào selectedSeats prop
          └── FirstPersonView → camera teleport
```

---

## Xử Lý Ghế Đôi

**Trong showtime.seats:**
```
{ seatKey: "A5", type: "couple", partnerSeatKey: "A6" }  ← ghế chính
{ seatKey: "A6", type: "couple", partnerSeatKey: "A5" }  ← partner
```

**Rule render:**
1. Build `partnerKeys = Set(["A6"])` — keys là partner
2. Chỉ render ghế KHÔNG có trong partnerKeys (`A5`)
3. `CoupleSeat3D` nhận `seat = A5`, tự tìm partner `A6` trong layout để biết status
4. `A5` render ở `position`, `A6` render ở `position + [COUPLE_OFFSET*2, 0, 0]` với rotation mirror

**Khi click ghế đôi:**
- Reuse logic `handleSeatClick` từ `SeatSelection.jsx` (đã xử lý partner đúng rồi)

---

## Loading & Error Handling

**Loading (Suspense):**
```jsx
<Suspense fallback={<LoadingScreen />}>
  {/* scene */}
</Suspense>
```

**LoadingScreen** dùng `useProgress()` từ drei:
```js
const { progress } = useProgress()
// Hiển thị thanh progress % loading model .glb
```

**WebGL không hỗ trợ:**
```jsx
{!webGLSupported && (
  <Alert 
    type="warning"
    message="Trình duyệt không hỗ trợ 3D. Vui lòng dùng Chrome/Firefox mới nhất."
  />
)}
<Button disabled={!webGLSupported} onClick={() => setViewMode('3d')}>
  Chế độ 3D
</Button>
```

---

## Preload Model

Đặt ở ngoài component (top-level file):
```js
useGLTF.preload('/models/cinema_seat.glb')
```

---

## Các Lỗi Thường Gặp & Fix

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| Model không load | Path sai | Kiểm tra `/public/models/cinema_seat.glb` tồn tại |
| Tất cả ghế cùng đổi màu | Dùng chung scene object | Bắt buộc `scene.clone()` cho mỗi ghế |
| Ghế đôi render 2 lần | Quên filter partnerKey | Build `partnerKeys Set` và filter trước khi render |
| Camera không teleport | Dùng ref thay vì useThree | Dùng `useThree().camera` bên trong Canvas |
| Tooltip bị che | z-index HTML trong 3D | Dùng `<Html distanceFactor={10}>` của drei |
| FPS thấp với nhiều ghế | Clone quá nhiều | Xem xét dùng InstancedMesh cho performance |
| OrbitControls conflict với click | Event propagation | Dùng `onPointerDown` thay `onClick` nếu cần |

---

## Prompt Sử Dụng Lại (nếu cần làm lại)

```
Dự án: Web đặt vé xem phim đa rạp, React 19 (CRA), Ant Design 5, đã có @react-three/fiber, @react-three/drei, three.

Cần triển khai tính năng "Sơ đồ phòng chiếu 3D" với các yêu cầu sau:

SCHEMA GHẾ (từ DB):
interface ISeat {
  row: string;       // "A", "B", "C"...
  number: number;    // 1, 2, 3...
  type: "standard" | "vip" | "couple";
  seatKey: string;   // "A1", "B5"
  partnerSeatKey?: string; // chỉ có khi type === "couple"
  status?: "available" | "booked" | "locked";
}

MODEL GHẾ: /public/models/cinema_seat.glb — ghế rạp đơn, tay vịn bên trái

FILE CẦN TẠO (trong src/components/CinemaRoom3D/):
- index.jsx: Main component nhận {showtime, selectedSeats, onSelect}
- useSeats3D.js: Hook tính tọa độ 3D từ row+number (không có x,y,z trong DB)
- RoomGeometry.jsx: Phòng chiếu procedural (sàn, tường, trần, màn hình phát sáng)
- CinemaSeat3D.jsx: 1 ghế từ .glb, override màu theo trạng thái
- CoupleSeat3D.jsx: Ghế đôi = 2 ghế mirror (rotation Y = Math.PI cho ghế phải)
- SeatsLayer.jsx: Render tất cả ghế, filter partnerKey không render 2 lần
- FirstPersonView.jsx: Camera teleport đến vị trí ghế, nhìn về màn hình

FILE CẦN SỬA:
- src/components/BookingModal/SeatSelection.jsx: Thêm toggle 2D/3D, import CinemaRoom3D

TÍNH NĂNG:
1. Toggle 2D/3D (sync selectedSeats giữa 2 chế độ)
2. Màu ghế: xám=đã đặt, xanh lá=đang chọn, vàng=đang xem first-person, đỏ=standard, tím=VIP, hồng=couple
3. Hover ghế → tooltip (seatKey, type, giá)
4. Click ghế trống → chọn/bỏ chọn (reuse logic handleSeatClick từ SeatSelection cũ)
5. Nút "Xem góc nhìn" → first-person camera từ ghế đã chọn
6. Nếu nhiều ghế, có nút prev/next để chuyển góc nhìn
7. Nút "Quay lại" để exit first-person
8. WebGL detection → disable nút 3D nếu không hỗ trợ
9. Suspense loading với useProgress()
10. Ghế từ cao xuống thấp (hàng A gần màn hình, thấp hơn; hàng cuối cao hơn = ROW_ELEVATION)
11. Ghế đôi mirror: ghế chính rotation [0,0,0], ghế partner rotation [0, Math.PI, 0]

CONSTANTS (trong useSeats3D.js):
SEAT_WIDTH=1.0, ROW_DEPTH=1.5, ROW_ELEVATION=0.3, COUPLE_OFFSET=0.5
```