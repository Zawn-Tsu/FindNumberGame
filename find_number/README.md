# 🎮 Find Number Game - Tìm Số 1vs1

Một trò chơi multiplayer thời gian thực cho 2 người chơi, kết nối qua mạng.

## 📋 Mô tả

**Game Tìm Số** là một trò chơi đơn giản nhưng thú vị:
- 2 người chơi cùng nhau
- Bảng trò chơi gồm 100 số từ 1 đến 100, được sắp xếp ngẫu nhiên
- Mục tiêu: Click vào các số **theo thứ tự từ 1 → 2 → 3 → ... → 100**
- Ai click đúng số được +1 điểm
- Cuối cùng, người có điểm cao nhất thắng!

## 🛠️ Công nghệ

- **Backend**: Node.js + Express.js
- **Real-time Communication**: Socket.io
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## 📦 Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd find_number
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình (tùy chọn)
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Sửa `.env` nếu cần:
```
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

## 🚀 Chạy game

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 🎮 Cách chơi

1. **Mở trình duyệt** tại `http://localhost:3000`
2. **Mở 2 tab/cửa sổ** trình duyệt (hoặc chia sẻ URL với bạn khác qua mạng)
3. **Player 1** và **Player 2** sẽ tự động kết nối
4. **Click vào số theo thứ tự** từ 1 đến 100
5. **Ai click đúng** được +1 điểm
6. **Sau khi tìm xong 100 số**, game kết thúc

## 📁 Cấu trúc dự án

```
find_number/
├── src/
│   ├── server.js          # Main server file
│   └── config.js          # Cấu hình
├── public/
│   ├── index.html         # Giao diện chính
│   ├── css/
│   │   └── style.css      # Styling
│   └── js/
│       └── script.js      # Logic frontend
├── package.json           # Dependencies
├── .env.example           # Template cấu hình
├── .gitignore            # Git ignore file
├── Procfile              # Cấu hình deployment
└── README.md             # File này
```

## 🌐 Deploy

### Heroku
```bash
heroku create <app-name>
git push heroku main
```

### Railway
1. Push code lên GitHub
2. Connect repository tại Railway.app
3. Railway sẽ tự động detect Node.js và start server

### Render
1. Tạo account tại render.com
2. New → Web Service
3. Connect GitHub repository
4. Chọn Node environment

## 🎨 Giao diện

- 🔵 **Xanh**: Số chưa được ai click
- 🟢 **Xanh lá**: Số bạn đã click
- 🔴 **Đỏ**: Số đối thủ đã click

## 📝 Ghi chú

- Game hỗ trợ **1 phòng chơi** (room1) với tối đa 2 người
- Có thể mở rộng để hỗ trợ nhiều phòng bằng cách sử dụng URL parameter
- Dữ liệu được lưu trữ tạm thời trên server (reset khi server restart)

## 📞 Liên hệ

Tác giả: Zawn-Tsu

## 📄 License

ISC
