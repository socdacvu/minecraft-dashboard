# NovaMC Website - Copilot Coding Agent Instructions

Bạn đang chỉnh sửa website chính thức của NovaMC Network.

## Ngôn ngữ
- Toàn bộ nội dung hiển thị cho người dùng phải viết bằng tiếng Việt có dấu.
- Văn phong chuyên nghiệp, phù hợp với một máy chủ Minecraft lớn tại Việt Nam.
- Không dùng câu cụt, không viết kiểu sơ sài.

## Chủ đề giao diện
- Chủ đề chính: đám mây, bầu trời xanh, ánh sáng cyan, Allay.
- Giao diện phải khác biệt, không sao chép bố cục từ SoulMC hoặc bất kỳ website gốc nào.
- Có thể lấy cảm hứng về tính năng, nhưng layout, spacing, component và hiệu ứng phải được thiết kế mới.

## Cấu trúc file
- Không nhồi toàn bộ code vào một file nếu không cần.
- Config phải tách riêng:
  - config/site.config.js
  - config/servers.config.js
  - config/features.config.js
  - config/staff.config.js
  - config/rules.config.js
  - config/faq.config.js
  - config/effects.config.js

## Yêu cầu giao diện
- Responsive tốt trên desktop, tablet và điện thoại.
- Có hiệu ứng mây bay nhẹ.
- Có particle, glow, hover animation nhưng không được làm lag.
- Giao diện phải tạo cảm giác như một server Minecraft lớn, chỉnh chu và chuyên nghiệp.

## Phần Đội Ngũ Nhân Viên
- Owner hiển thị nổi bật riêng.
- Các staff còn lại chạy ngang nhẹ nhàng.
- Có thể bấm vào tên hoặc thẻ staff để xem thông tin liên hệ.
- Không để hiệu ứng chạy quá nhanh gây khó chịu.

## Quy tắc code
- Viết HTML, CSS, JavaScript sạch, dễ đọc.
- Không dùng thư viện nặng nếu không cần.
- Không hardcode dữ liệu staff/server trong HTML nếu đã có config.
- Không xóa tính năng cũ nếu chưa được yêu cầu.
- Không commit file rác, file log, file tạm.
- Sau khi sửa, kiểm tra lỗi console cơ bản.
