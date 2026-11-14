# DR.CGF: giao diện 2D / 3D

- `/`: showroom 3D mặc định.
- `/2d/`: trang chủ 2D trước khi tích hợp, dùng base `/` để giữ nguyên đường dẫn tài nguyên.
- `/showroom/`: mã và tài nguyên riêng của showroom, không chứa PDF công bố.
- Nút chuyển giao diện dùng `assets/js/view-switch.js` và `assets/css/view-switch.css`. Website 2D tải nút qua shared-components.js.
- Khách mới vào trang chủ mặc định xem 3D. Sau khi bấm 2D/3D, lựa chọn được lưu trong localStorage (`drcgf.preferredView`) của trình duyệt và dùng lại khi về trang chủ. `view-preference.js` chạy sớm ở cả hai trang chủ; các trang nội dung không chuyển hướng. Nếu trình duyệt chặn lưu trữ, các nút vẫn chuyển trang bình thường.
- Build và triển khai Cloudflare Pages như trước: `npm run build`, thư mục đầu ra `.`.
