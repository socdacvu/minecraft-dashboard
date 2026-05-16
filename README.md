# NovaMC Cloud Allay Redesign V3

Bản này đã đổi toàn bộ bố cục để khác trang gốc:

- Không dùng navbar ngang dạng gốc, thay bằng **side rail** bên trái và topbar riêng cho mobile.
- Hero đổi thành bố cục **Sky Console**: nội dung bên trái, Allay + trạng thái bên phải.
- Máy chủ đổi từ lưới card sang **server river / timeline**.
- Tính năng đổi sang **bento dashboard** bất đối xứng.
- Đội ngũ đổi thành **command deck**: Owner đứng riêng bên trái, nhân viên chạy ngang nhẹ ở bên phải.
- Thế giới đổi thành **cloud map** với đảo mây và Allay bay.
- Vẫn giữ hiệu ứng mây, sao, particle, cursor glow, modal Địa Chỉ, Luật Lệ, FAQ, Hệ Thống.

## Cấu trúc

```txt
novamc-cloud-allay-redesign/
├─ index.html
├─ assets/
│  ├─ allay-mascot.svg
│  └─ novamc-logo.svg
├─ css/
│  └─ styles.css
├─ js/
│  └─ app.js
└─ config/
   ├─ site.config.js
   ├─ servers.config.js
   ├─ features.config.js
   ├─ staff.config.js
   ├─ rules.config.js
   ├─ faq.config.js
   └─ effects.config.js
```

## Cách chỉnh nhanh

- Đổi IP, tên server, link mạng xã hội: `config/site.config.js`
- Đổi danh sách máy chủ: `config/servers.config.js`
- Đổi tính năng: `config/features.config.js`
- Đổi Owner và Staff: `config/staff.config.js`
- Đổi luật lệ: `config/rules.config.js`
- Đổi FAQ: `config/faq.config.js`
- Đổi số lượng sao, mây, particle: `config/effects.config.js`

Mở trực tiếp `index.html` để xem, hoặc upload cả thư mục lên Cloudflare Pages / Netlify / Vercel.
