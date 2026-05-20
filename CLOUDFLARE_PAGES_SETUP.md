# NovaMC — Cloudflare Pages + Pages Functions + KV

Bản này đã thêm hệ thống đăng nhập nội bộ và quản trị dữ liệu trực tiếp trên web.

## Tài khoản mặc định

- Tài khoản: `admin`
- Mật khẩu: `admin123`

Nên đổi mật khẩu sau khi deploy bằng biến môi trường Cloudflare:

- `OWNER_USERNAME` = tài khoản Owner mới
- `OWNER_PASSWORD` = mật khẩu Owner mới

Hoặc dùng `OWNER_PASSWORD_SHA256` nếu muốn lưu hash SHA-256 thay vì mật khẩu thường.

## Các file đã thêm

- `functions/api/login.js` — API đăng nhập Owner
- `functions/api/me.js` — kiểm tra phiên đăng nhập
- `functions/api/logout.js` — đăng xuất
- `functions/api/content.js` — lấy dữ liệu công khai từ KV
- `functions/api/content/save.js` — lưu dữ liệu vào KV, yêu cầu đăng nhập Owner
- `functions/_lib/auth.js` — xác thực, session, chuẩn hóa dữ liệu
- `js/admin.js` — giao diện quản trị nội bộ
- `wrangler.toml.example` — mẫu cấu hình Wrangler

## Cách deploy trên Cloudflare Pages

1. Upload hoặc push toàn bộ source này lên GitHub.
2. Vào Cloudflare Dashboard → Workers & Pages → Pages → Create project.
3. Chọn repo NovaMC.
4. Framework preset: `None`.
5. Build command: để trống.
6. Build output directory: `/` hoặc `.` nếu Cloudflare yêu cầu.
7. Deploy.
8. Tạo KV namespace, ví dụ: `novamc_content`.
9. Vào Pages project → Settings → Bindings → Add → KV namespace.
10. Variable name bắt buộc đặt là: `NOVAMC_KV`.
11. Chọn KV namespace vừa tạo.
12. Redeploy project để binding có hiệu lực.
13. Gắn custom domain `novamc.asia` vào Pages project.

## Cách sử dụng

1. Mở `https://novamc.asia`.
2. Bấm nút `Nội Bộ` ở menu bên trái.
3. Đăng nhập bằng Owner.
4. Chỉnh:
   - Đội Ngũ Vận Hành NovaMC
   - Không Gian Đối Tác
5. Bấm `Lưu thay đổi lên Cloudflare KV`.
6. Web sẽ tự render lại dữ liệu mới, người xem khác tải lại trang sẽ thấy thay đổi.

## Ghi chú quan trọng

- Không cần VPS.
- Không cần hosting Node.js riêng.
- Không cần port 21209.
- Không ảnh hưởng server Minecraft.
- Dữ liệu chỉnh trên web được lưu ở Cloudflare KV.
- File `server.js` cũ vẫn được giữ lại để bạn tham khảo/chạy local kiểu cũ nếu muốn, nhưng bản Pages không cần chạy file Node.js đó.
