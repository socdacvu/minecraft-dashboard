window.NOVAMC_DISCORD = {
  // Invite chính thức của server Discord. Website chỉ dùng invite này để đồng bộ thông tin server.
  inviteUrl: "https://discord.com/invite/vWxxZ6mjPb",

  // Có thể điền sẵn Guild ID nếu muốn gọi Widget API trực tiếp.
  // Nếu để trống, web sẽ tự lấy guildId từ Invite API khi tải trang.
  guildId: "",

  // Bật Server Widget trong Discord: Server Settings -> Widget -> Enable Server Widget.
  // Khi bật, web sẽ đồng bộ được danh sách channel public, phòng voice và member online từ Widget API.
  enableWidgetSync: true,

  // Hiển thị Discord Widget giống ảnh mẫu.
  // Widget iframe sẽ tự hiện channel, voice room, member online và nút Join Discord.
  enableOfficialWidgetEmbed: true,
  widgetTheme: "dark",
  widgetHeight: 430,

  // Thời gian cache dữ liệu Discord ở trình duyệt để tránh gọi API quá nhiều.
  cacheMs: 60 * 1000,

  // Danh sách dự phòng nếu Server Widget chưa bật hoặc Discord API bị chặn tạm thời.
  fallbackChannels: [
    { name: "welcome", type: "text", icon: "#" },
    { name: "thông-báo", type: "text", icon: "📢" },
    { name: "support", type: "voice", icon: "🔊" },
    { name: "gaming", type: "voice", icon: "🔊" },
    { name: "music-room", type: "voice", icon: "🎵" },
    { name: "karaoke-room", type: "voice", icon: "🎤" }
  ]
};
