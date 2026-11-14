# DR.CGF: giao diện 2D / 3D

- `/`: showroom 3D mặc định.
- `/2d/`: trang chủ 2D trước khi tích hợp, dùng base `/` để giữ nguyên đường dẫn tài nguyên.
- `/showroom/`: mã và tài nguyên riêng của showroom, không chứa PDF công bố.
- Nút chuyển giao diện dùng `assets/js/view-switch.js` và `assets/css/view-switch.css`. Website 2D tải nút qua shared-components.js.
- Không dùng lưu lựa chọn để thay đổi trang chủ mặc định. Các trang nội dung hiện có giữ nguyên đường dẫn.
- Build và triển khai Cloudflare Pages như trước: `npm run build`, thư mục đầu ra `.`.
