# AGENTS.md - NovaMC Website

## Mục tiêu dự án
Website này là trang giới thiệu chính thức của NovaMC, một máy chủ Minecraft Việt Nam.

## Phong cách
- Chủ đề: bầu trời, đám mây, màu xanh cyan, Allay.
- Giao diện phải hiện đại, chuyên nghiệp, khác hoàn toàn website tham khảo.
- Không sao chép layout, hình ảnh, text hoặc animation từ website khác.

## Ngôn ngữ
- Toàn bộ text hiển thị phải là tiếng Việt có dấu.
- Viết rõ ràng, chuyên nghiệp, thân thiện.

## Cấu trúc
Dữ liệu phải được tách trong thư mục config:
- site.config.js: thông tin chung
- servers.config.js: danh sách cụm máy chủ
- features.config.js: tính năng
- staff.config.js: đội ngũ
- rules.config.js: luật lệ
- faq.config.js: câu hỏi thường gặp
- effects.config.js: cấu hình hiệu ứng

## Quy tắc khi sửa
- Không sửa trực tiếp main nếu đang làm bằng agent.
- Tạo branch riêng và pull request.
- Không xóa chức năng đang hoạt động.
- Không thêm thư viện nặng nếu không cần.
- Ưu tiên CSS/JS thuần cho website tĩnh.
- Kiểm tra responsive sau khi chỉnh layout.
