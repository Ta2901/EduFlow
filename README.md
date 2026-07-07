# EduFlow - Hệ thống học tập thông minh

EduFlow là một nền tảng giáo dục hiện đại được thiết kế để hỗ trợ quá trình học tập và giảng dạy của giáo viên và học sinh. Hệ thống được xây dựng với responsive design, tối ưu hoàn hảo cho cả web và mobile.

## 🚀 Tính năng chính

### Cho Giáo viên
- **Dashboard quản lý**: Theo dõi tiến độ học tập của học sinh
- **Quản lý khóa học**: Tạo, chỉnh sửa và quản lý nội dung khóa học
- **Quản lý học sinh**: Xem danh sách và tiến độ học tập của từng học sinh
- **Tạo bài tập**: Tạo và chấm bài tập, kiểm tra cho học sinh
- **Thống kê**: Báo cáo chi tiết về hiệu quả giảng dạy

### Cho Học sinh
- **Dashboard học tập**: Xem tổng quan tiến độ học tập
- **Khóa học**: Tham gia các khóa học và theo dõi tiến độ
- **Làm bài tập**: Làm bài tập và kiểm tra trực tuyến
- **Ghi chú**: Lưu trữ ghi chú cá nhân
- **Thảo luận**: Tương tác với giáo viên và bạn học

### Tính năng Responsive
- **Mobile First**: Tối ưu hoàn hảo cho thiết bị di động
- **Desktop Ready**: Giao diện đầy đủ tính năng trên máy tính
- **Cross-platform**: Hoạt động mượt mà trên mọi thiết bị

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## 📦 Cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd EduFlow
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Chạy development server**
```bash
npm run dev
```

4. **Mở trình duyệt**
Truy cập [http://localhost:3000](http://localhost:3000)

## 🏗️ Cấu trúc dự án

```
EduFlow/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── login/             # Authentication pages
│   ├── register/
│   ├── student/           # Student pages
│   │   ├── dashboard/
│   │   ├── courses/
│   │   └── assignments/
│   └── teacher/           # Teacher pages
│       ├── dashboard/
│       └── courses/
├── components/            # Reusable components
├── lib/                   # Utility functions
├── public/               # Static assets
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Secondary**: Gray (#64748b)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Font**: Inter
- **Headings**: Font weights 600-700
- **Body**: Font weight 400

### Spacing
- **Base unit**: 4px
- **Common spacing**: 4, 8, 12, 16, 24, 32, 48, 64px

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔐 Tài khoản Demo

### Học sinh
- **Email**: student@eduflow.com
- **Password**: password123

### Giáo viên
- **Email**: teacher@eduflow.com
- **Password**: password123

## 🚀 Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📄 Pages và Routes

### Public Routes
- `/` - Trang chủ
- `/login` - Đăng nhập
- `/register` - Đăng ký

### Student Routes
- `/student/dashboard` - Dashboard học sinh
- `/student/courses/[id]` - Chi tiết khóa học
- `/student/assignments/[id]` - Làm bài tập

### Teacher Routes
- `/teacher/dashboard` - Dashboard giáo viên
- `/teacher/courses/[id]` - Quản lý khóa học

## 🎯 Tính năng Responsive

### Mobile (< 640px)
- Sidebar ẩn/hiện với hamburger menu
- Grid layout chuyển thành single column
- Touch-friendly buttons và inputs
- Optimized typography cho màn hình nhỏ

### Tablet (640px - 1024px)
- Sidebar có thể thu gọn
- Grid layout 2-3 columns
- Balanced spacing và typography

### Desktop (> 1024px)
- Full sidebar luôn hiển thị
- Grid layout tối đa 4 columns
- Hover effects và animations
- Keyboard navigation support

## 🔧 Customization

### Thay đổi theme colors
Chỉnh sửa file `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom primary colors
      }
    }
  }
}
```

### Thêm components mới
Tạo file trong thư mục `components/` và import vào các pages cần thiết.

## 📈 Performance

- **Lazy loading**: Components được load khi cần
- **Image optimization**: Next.js Image component
- **Code splitting**: Automatic với Next.js
- **Bundle optimization**: Tree shaking và minification

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Module not found**
```bash
npm install
```

2. **Port already in use**
```bash
npm run dev -- -p 3001
```

3. **Build errors**
```bash
npm run build
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📝 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub hoặc liên hệ team phát triển.

---

**EduFlow** - Nền tảng giáo dục hiện đại cho tương lai học tập! 🎓

