/* ============================================================
   CONFIG - THÔNG TIN CHUNG WEBSITE
   Sửa file này để đổi tên server, IP, link mạng xã hội, trạng thái.
============================================================ */
window.NOVA_SITE_CONFIG = {
  serverName: "NovaMC",
  networkName: "NovaMC Network",
  title: "NovaMC Network | Máy Chủ Minecraft Việt Nam",
  navLogoIcon: "☁️",
  hero: {
    badge: "MÁY CHỦ MINECRAFT HÀNG ĐẦU VIỆT NAM",
    titleLeft: "NOVA",
    titleRight: "MC",
    subtitle: "Nơi Những Đám Mây Chạm Tới Giấc Mơ",
    description: "Chào mừng đến với <strong style='color:var(--cyan-glow)'>NovaMC Network</strong> — nơi những đám mây xanh bao phủ vùng đất huyền bí và cộng đồng game thủ văn minh cùng nhau kiến tạo những kỳ tích. Bay cao cùng chúng mình nhé!",
    buttons: [
      { label: "🎮 Tham Gia Ngay", href: "#servers", type: "primary" },
      { label: "✨ Khám Phá", href: "#features", type: "secondary" }
    ],
    allayIcons: ["🦋", "☁️", "✨", "💙", "🌟", "🫧"]
  },
  status: {
    text: "TRỰC TUYẾN",
    playerMin: 15,
    playerMax: 99,
    pingMin: 8,
    pingMax: 22
  },
  connection: [
    { icon: "💻", label: "Java Edition", ip: "NOVAMC.VN", note: "Phiên bản PC - ưu tiên đề xuất.", copy: true },
    { icon: "📱", label: "Bedrock Edition", ip: "PE.NOVAMC.VN", note: "Dành cho Mobile, Tablet và Console. Port: 19132", copy: true },
    { icon: "🛡️", label: "IP Dự Phòng", ip: "PLAY.NOVAMC.VN", note: "Sử dụng khi đường truyền IP chính lỗi.", copy: true },
    { icon: "🌐", label: "IP Quốc Tế", ip: "GLOBAL.NOVAMC.VN", note: "Tối ưu cho người chơi ở nước ngoài.", copy: true }
  ],
  socials: [
    { icon: "📘", label: "Facebook", url: "#" },
    { icon: "🎵", label: "TikTok", url: "#" },
    { icon: "📺", label: "YouTube", url: "#" },
    { icon: "💬", label: "Discord", url: "#" }
  ],
  footer: {
    tagline: "KẾT NỐI ĐAM MÊ",
    since: "SINCE 2024",
    quote: "Chúng mình không chỉ là một máy chủ, <em>mà chúng mình là một gia đình trên đám mây.</em>",
    copyrightYear: "2026"
  }
};
