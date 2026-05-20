window.NOVAMC_SITE = {
  serverName: "NovaMC",
  title: "NovaMC | Máy Chủ Minecraft Việt Nam",
  description: "NovaMC - Máy chủ Minecraft sinh tồn vanilla, cộng đồng văn minh và đội ngũ vận hành chuyên nghiệp.",
  navLogoIcon: "☀️",
  hero: {
    badge: "MÁY CHỦ MINECRAFT VIỆT NAM",
    titleLeft: "NOVA",
    titleRight: "MC",
    subtitle: "Kết Nối Người Chơi - Xây Dựng Thế Giới",
    description: "Chào mừng đến với <strong style='color:var(--sky)'>NovaMC</strong> — nơi bạn cùng chúng mình khám phá thế giới Minecraft trong một cộng đồng văn minh, lịch sự và giàu tinh thần sáng tạo. NovaMC được xây dựng bởi đội ngũ quản trị chuyên nghiệp, luôn hướng đến trải nghiệm sinh tồn ổn định, công bằng và lâu dài cho mọi người chơi.",
    buttons: [
      { label: "📍 Địa Chỉ Server", modal: "connect", type: "primary" },
      { label: "ℹ️ Thông Tin", href: "#info", type: "secondary" },
      { label: "📋 Luật Lệ", modal: "rules", type: "secondary" },
      { label: "💬 Discord", modal: "discord", type: "secondary" }
    ],
    allayIcons: ["☁️", "☁️", "☁️", "☁️", "☁️", "☁️"]
  },
  status: {
    text: "TRỰC TUYẾN",
    playerText: "Đang kiểm tra",
    playerSubtext: "đang kiểm tra",
    pingText: "—",
    pingSubtext: "Singapore node",
    realtime: {
      enabled: true,
      host: "play.novamc.asia",
      port: 25552,
      edition: "bedrock",
      regionLabel: "Singapore",
      refreshMs: 15000,
      timeoutMs: 8000
    }
  },
  connection: [
    {
      icon: "📋",
      label: "Java Edition",
      ip: "play.novamc.asia",
      note: "Dành cho Minecraft Java Edition.",
      copy: true,
      copyText: "play.novamc.asia"
    },
    {
      icon: "📱",
      label: "Bedrock Edition",
      ip: "play.novamc.asia",
      port: "25552",
      note: "Dành cho MCPE / Bedrock Edition. Cần nhập đúng port 25552.",
      copy: true,
      copyText: "play.novamc.asia:25552"
    },
    {
      icon: "🔌",
      label: "IP phụ",
      ip: "novamc.usga.me:25552",
      note: "Dùng khi IP chính không truy cập được hoặc cần kết nối thay thế.",
      copy: true,
      copyText: "novamc.usga.me:25552"
    },
    {
      icon: "🧭",
      label: "Phiên bản nên dùng",
      ip: "1.21.5 trở lên",
      note: "Khuyến nghị dùng Minecraft 1.21.5 hoặc mới hơn để vào server ổn định nhất.",
      copy: false
    }
  ],
  socials: [
    { icon: "📘", image: "./assets/social/facebook.svg", label: "Facebook", url: "#", unavailable: true },
    { icon: "🎵", image: "./assets/social/tiktok.svg", label: "TikTok", url: "https://www.tiktok.com/@socdacvu?is_from_webapp=1&sender_device=pc" },
    { icon: "📺", image: "./assets/social/youtube.svg", label: "YouTube", url: "#", unavailable: true },
    { icon: "💬", image: "./assets/social/discord.svg", label: "Discord", url: "#discord", modal: "discord" }
  ],
  sections: {
    infoIntro: "Khám phá định hướng, hành trình phát triển và phong cách vận hành của NovaMC — một máy chủ Minecraft Việt Nam hướng đến cộng đồng văn minh, trải nghiệm sinh tồn và sự hỗ trợ chuyên nghiệp.",
    featuresIntro: "NovaMC tập trung vào các nền tảng cốt lõi giúp trải nghiệm sinh tồn trở nên ổn định, công bằng, gắn kết và đáng tin cậy trong thời gian dài.",
    staffTitle: "Đội Ngũ Vận Hành NovaMC",
    staffDesc: ""
  },
  world: {
    title: "Hành Trình Bất Tận",
    description: "Khám phá thế giới Minecraft đầy màu sắc tại NovaMC, nơi bạn có thể tự do sinh tồn, xây dựng, phiêu lưu và kết nối cùng những người chơi khác. Mỗi hành trình đều mang đến những trải nghiệm mới mẻ, thú vị và đáng nhớ.",
    stats: [
      { value: "90%", label: "Thuần Vanilla" },
      { value: "2", label: "Java & MCPE" },
      { value: "24/7", label: "Luôn hỗ trợ" }
    ]
  },
  footer: {
    tagline: "KẾT NỐI ĐAM MÊ",
    since: "SINCE 2025",
    quote: "NovaMC không chỉ là một máy chủ Minecraft, mà là một nền tảng được vận hành nghiêm túc, xây dựng cho cộng đồng chơi bền vững và văn minh.",
    copyrightYear: "2026"
  }
};

window.NOVAMC_PARTNERS = [
  {
    id: "partner-01",
    icon: "💬",
    name: "Đang đồng bộ Discord...",
    category: "Discord Partner",
    status: "Đang đồng bộ",
    shortDesc: "Tên đối tác sẽ tự động lấy từ Discord Invite.",
    desc: "Website sẽ tự động lấy tên, icon và thống kê đối tác từ Discord Invite discord.gg/8UYP3F8ATB.",
    benefits: ["Kết nối cộng đồng", "Hỗ trợ thông tin", "Cập nhật NovaMC"],
    discordInvite: "https://discord.gg/8UYP3F8ATB",
    url: "https://discord.gg/8UYP3F8ATB",
    contact: { discord: "https://discord.gg/8UYP3F8ATB", representative: "Tự động lấy từ Discord", website: "#" },
    joined: "2026",
    displayOnlyInvite: true,
    lockDisplayName: false
  }
];
