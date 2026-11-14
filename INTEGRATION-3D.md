# DR.CGF: giao diện 2D / 3D

- `/`: showroom 3D mặc định.
- `/2d/`: trang chủ 2D trước khi tích hợp, dùng base `/` để giữ nguyên đường dẫn tài nguyên.
- `/showroom/`: mã và tài nguyên riêng của showroom, không chứa PDF công bố.
- Nút chuyển giao diện dùng `assets/js/view-switch.js` và `assets/css/view-switch.css`. Website 2D tải nút qua shared-components.js.
- Khách mới vào trang chủ mặc định xem 3D. Sau khi bấm 2D/3D, lựa chọn được lưu trong localStorage (`drcgf.preferredView`) của trình duyệt và dùng lại khi về trang chủ. `view-preference.js` chạy sớm ở cả hai trang chủ; các trang nội dung không chuyển hướng. Nếu trình duyệt chặn lưu trữ, các nút vẫn chuyển trang bình thường.
- Build và triển khai Cloudflare Pages như trước: `npm run build`, thư mục đầu ra `.`.


## Cửa sổ nội dung 3D

- Các mục Giới thiệu, Sản phẩm, Thành phần, Tin tức, Liên hệ và mục con mở trong chính khung `#catalog` của showroom: bên phải trên PC và cùng bố cục bảng Sản phẩm trên mobile. Khung giữ nền kính, bo góc và vị trí sẵn có, không dùng hộp thoại giữa màn hình.
- Đường dẫn chia sẻ/khôi phục: `/?page=%2Fgioi-thieu%2Findex.html`. Đóng cửa sổ trở về `/`; nút quay lại và lịch sử trình duyệt giữ từng mục đã mở.
- `assets/js/showroom-windows.js` quản lý cửa sổ và điều hướng cùng website. `assets/css/showroom-windows.css` định dạng khung; `showroom-window-content.css` định dạng nội dung.
- Nội dung dùng chính các trang đang có trong khung cùng tên miền, giữ các chức năng tìm kiếm, biểu mẫu và liên kết. Thanh đầu/cuối của 2D được ẩn trong cửa sổ.
- Nút 2D/3D có trên toàn bộ trang nội dung 2D và giữ đúng mục, từ khóa, neo liên kết khi đổi chế độ. Trong cửa sổ, nút chuyển nằm trên thanh tiêu đề.
- Trang nội dung truy cập trực tiếp sẽ theo lựa chọn đã lưu của khách. Các trang trong cửa sổ không tự chuyển hướng, tránh lặp trang.
- Phiếu công bố trong cửa sổ dùng ảnh trang đầu khi có, không mở PDF đầy đủ. Bản 2D giữ nguyên dữ liệu cũ.
