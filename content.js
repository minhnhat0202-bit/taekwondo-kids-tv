// =====================================================================
// NỘI DUNG MÀN HÌNH TV · Taekwondo Kids Việt Nam · trang index.html
// Việc hằng ngày (thêm tin, đổi lịch, vinh danh, dòng chạy) CHỈ sửa file này.
// Đường dẫn ảnh, video viết tính từ thư mục này: 'img/...', 'media/...'.
// Một file dùng cho mọi cơ sở: mở index.html?cs=HP (mã cơ sở trong BRANCHES).
// Mục nào có cs: 'HP' hoặc cs: ['HP','GS'] thì chỉ hiện ở cơ sở đó; không khai cs = mọi cơ sở.
// Ngày viết 'YYYY-MM-DD'. Thứ trong tuần: 0 = Chủ nhật, 1 = Thứ Hai ... 6 = Thứ Bảy.
// =====================================================================
window.TV = {

  // true = hiện nhãn "DỮ LIỆU MẪU" trên đầu màn hình. Đặt false khi đã thay nội dung thật.
  SAMPLE: true,

  CENTER: { name: 'Taekwondo Kids Việt Nam', hotline: '097 893 1747', facebook: 'fb.com/taekwondokids.vietnam' },

  // Cơ sở mặc định khi URL không có ?cs=
  DEFAULT_BRANCH: 'HP',
  BRANCHES: {
    HP: 'Cơ sở Hapulico', GS: 'Cơ sở GreenStars', ND: 'Cơ sở Nghĩa Đô', HD: 'Cơ sở Hà Đông',
    LB: 'Cơ sở Long Biên', GH: 'Cơ sở Gia Hoà', HL: 'Cơ sở Hạ Long'
  },

  // Thời lượng mặc định mỗi tin (giây), khi tin không khai seconds.
  STORY_SECONDS: 40,

  // ---- Bảng tin (khung lớn bên trái): thứ tự mảng = thứ tự chiếu ----
  //   id, tab (tên ngắn trên thanh story), title, tag (nhãn vàng, tuỳ chọn), sub (dòng phụ, tuỳ chọn)
  //   seconds · until: 'YYYY-MM-DD' tự ẩn sau ngày này · cs · ticker: câu (hoặc mảng câu) thêm vào dòng chạy
  // Chọn MỘT kiểu nội dung:
  //   image: 'img/...'                              một ảnh, poster tĩnh
  //   slides: [{ src, sub? }], slideSeconds         nhiều ảnh lần lượt, có bộ đếm n / tổng
  //   items: [{ type: 'video', src }, { type: 'image', src, seconds? }]   video phát hết thì sang mục kế
  //   points: ['...', '...'], cover?: 'img/...'     thẻ chữ đánh số (nội quy, tinh thần võ đạo); cover = ảnh nền mờ
  STORIES: [
    { id: 'thi-dai-t8', tab: 'Thi lên đai T8/2026', title: 'Kỳ thi lên đai tháng 8/2026', tag: 'Chúc mừng',
      sub: 'Chúc mừng các võ sinh đã hoàn thành xuất sắc bài thi', image: 'img/thi-len-dai-t8-2026.jpg' },

    { id: '10-nam', tab: '10 năm Taekwondo Kids', title: 'Hành trình 10 năm Taekwondo Kids', tag: '2015 – 2025',
      slideSeconds: 7,
      slides: [{ src: 'img/10-nam-1.jpg' }, { src: 'img/10-nam-2.jpg' }, { src: 'img/10-nam-3.jpg' }, { src: 'img/10-nam-4.jpg' }] },

    { id: 'tinh-than', tab: 'Tinh thần võ đạo', title: 'Năm tinh thần Taekwondo', cover: 'img/hanoi-festival-2026.jpg', seconds: 25,
      points: ['Lễ nghĩa · Courtesy', 'Liêm sỉ · Integrity', 'Kiên nhẫn · Perseverance', 'Tự chủ · Self-control', 'Bất khuất · Indomitable spirit'] },

    { id: 'hung-vuong', tab: 'Giải Hùng Vương', title: 'Giải Vô địch Taekwondo Phú Thọ mở rộng · Cúp Hùng Vương', tag: 'Thành tích',
      slideSeconds: 7,
      slides: [{ src: 'img/giai-hung-vuong-1.jpg' }, { src: 'img/giai-hung-vuong-2.jpg' }, { src: 'img/giai-hung-vuong-3.jpg' }] },

    { id: 'noi-quy', tab: 'Nội quy võ đường', title: 'Nội quy võ đường', seconds: 25, cover: 'img/co-so-hapulico.jpg',
      points: ['Có mặt trước giờ tập 10 phút, mặc võ phục và thắt đai đúng cách', 'Chào thầy, chào bạn khi vào và ra khỏi võ đường',
        'Cắt móng tay, móng chân; không đeo trang sức khi tập', 'Mang bình nước riêng, giữ võ đường sạch sẽ',
        'Phụ huynh vui lòng chờ ở khu vực dành riêng'] }
  ],

  // ---- Ca học (khung "Ca học hôm nay"): tự lọc theo thứ, tự báo Đang tập / Sắp vào / Đã xong ----
  //   days: [thứ...] · start, end: 'HH:MM' · title: tên lớp · note: cấp đai, độ tuổi · coach · room (tuỳ chọn) · cs
  //   from, to (tuỳ chọn): khoảng ngày áp dụng (lịch hè, lịch Tết...)
  SCHEDULE: [
    { days: [1, 2, 3, 4, 5], start: '17:00', end: '18:00', title: 'Lớp Cơ bản', note: 'Đai trắng – vàng · 4 đến 7 tuổi', coach: 'Thầy Nguyễn Đình Toàn' },
    { days: [1, 2, 3, 4, 5], start: '18:00', end: '19:00', title: 'Lớp Nâng cao', note: 'Đai xanh – đỏ · từ 8 tuổi', coach: 'Thầy Nguyễn Đình Toàn' },
    { days: [6, 0], start: '09:00', end: '10:00', title: 'Lớp Mầm non', note: 'Đai trắng · 4 đến 6 tuổi', coach: 'Thầy Nguyễn Đình Toàn' },
    { days: [6, 0], start: '10:00', end: '11:00', title: 'Lớp Cơ bản', note: 'Đai trắng – vàng', coach: 'Thầy Nguyễn Đình Toàn' },
    { days: [6, 0], start: '14:00', end: '15:00', title: 'Lớp Thi đấu', note: 'Đội tuyển đối kháng', coach: 'Thầy Nguyễn Đình Toàn' },
    { days: [6, 0], start: '15:00', end: '16:00', title: 'Lớp Quyền', note: 'Ôn bài quyền thi đai', coach: 'Thầy Nguyễn Đình Toàn' },
    { days: [6, 0], start: '17:00', end: '18:00', title: 'Lớp Cơ bản', note: 'Đai trắng – vàng', coach: 'Thầy Nguyễn Đình Toàn' },
    { days: [6, 0], start: '18:00', end: '19:00', title: 'Lớp Nâng cao', note: 'Đai xanh – đỏ', coach: 'Thầy Nguyễn Đình Toàn' }
  ],

  // ---- Vinh danh (khung giữa bên phải): mỗi thẻ 8 giây ----
  //   type: 'star' (Võ sinh tiêu biểu) | 'belt' (Lên đai mới) | 'birthday' (Sinh nhật) | 'medal' (Huy chương)
  //   name · note · belt: mã đai (trang, vang_trang, vang, xanh_vang, xanh, do_xanh, do, den_1...) · photo (tuỳ chọn)
  //   from, to hoặc until: khoảng ngày hiện · cs
  HONORS: [
    { type: 'star', name: 'Nguyễn Minh Khang', note: 'Võ sinh tiêu biểu tháng 10 · Chăm chỉ, đi tập đủ 100% buổi', belt: 'xanh', until: '2026-10-31' },
    { type: 'birthday', name: 'Trần Bảo Ngọc', note: 'Chúc mừng sinh nhật 7 tuổi · 20/10', belt: 'vang', from: '2026-10-18', to: '2026-10-22' },
    { type: 'belt', name: 'Lê Gia Huy', note: 'Đạt Đai Đỏ vạch Xanh tại kỳ thi T8/2026', belt: 'do_xanh', until: '2026-11-30' },
    { type: 'medal', name: 'Phạm Anh Thư', note: 'Huy chương Vàng quyền cá nhân · Giải trẻ Hà Nội', belt: 'do', until: '2026-12-31' }
  ],

  // ---- Sắp diễn ra (khung dưới bên phải) ----
  //   from, to (tuỳ chọn) · title · time, place (tuỳ chọn) · cs
  //   Có to = một giai đoạn. Hiện 4 mục gần nhất chưa kết thúc; mục đang diễn ra có nhãn "Đang diễn ra".
  AGENDA: [
    { title: 'Mở đăng ký thi lên đai kỳ T12/2026', from: '2026-10-20', to: '2026-11-15', place: 'Tại quầy lễ tân' },
    { title: 'Kiểm tra trình độ trước kỳ thi', from: '2026-11-22', time: 'Ca tập thường' },
    { title: 'Kỳ thi lên đai T12/2026', from: '2026-12-06', time: '07:30', place: 'Nhà thi đấu ĐH Sư phạm Hà Nội' },
    { title: 'Liên hoan cuối năm võ sinh', from: '2026-12-27', time: '16:00' }
  ],

  // Câu thêm vào dòng chạy. Chuỗi, hoặc { text, until: 'YYYY-MM-DD', cs }.
  TICKER: [
    { text: 'Đóng học phí tháng 11 trước ngày 05/11 tại quầy lễ tân hoặc chuyển khoản', until: '2026-11-05' },
    'Phụ huynh nhắc con mang bình nước riêng và đến trước giờ tập 10 phút',
    'Hotline tư vấn, đăng ký học thử miễn phí: 097 893 1747'
  ]
};
