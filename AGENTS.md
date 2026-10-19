# Màn hình TV võ đường Taekwondo Kids

Dành cho mọi agent (Claude Code, omp). Đọc file này trước, chỉ mở thêm file khác khi cần.
Dựng theo khung Bản tin TV của VTNet (`~/Documents/1. Viettel/3. VTNET/Internal Communication/Dashboard/tv/`), đổi nội dung cho võ đường.

## Bản đồ
- `content.js`: **toàn bộ nội dung**. Hướng dẫn từng trường ở đầu mỗi mục. Việc hằng ngày chỉ sửa file này.
  - `STORIES` Bảng tin (khung lớn trái): kiểu `image`, `slides`, `items` (video + ảnh), `points` (thẻ chữ đánh số).
  - `SCHEDULE` Ca học: lặp theo thứ trong tuần, TV tự báo Đang tập / Còn n phút / Sắp tới, ẩn ca đã xong.
  - `HONORS` Vinh danh: `star`, `belt`, `birthday`, `medal`; mỗi thẻ 8 giây.
  - `AGENDA` Sắp diễn ra (4 mục gần nhất) · `TICKER` dòng chạy · `SAMPLE` nhãn "Dữ liệu mẫu".
- `index.html`: giao diện và mã. Chỉ sửa khi đổi bố cục hoặc thêm kiểu tin mới.
- `img/` ảnh (cạnh dài ≤ 1600, JPG), `media/` video H.264 MP4.

## Nhiều cơ sở, một bộ file
- Mỗi TV mở `index.html?cs=<mã>`: HP Hapulico, GS GreenStars, ND Nghĩa Đô, HD Hà Đông, LB Long Biên, GH Gia Hoà, HL Hạ Long. Không có `?cs=` thì dùng `DEFAULT_BRANCH`.
- Mục nào chỉ cho một số cơ sở thì thêm `cs: 'HP'` hoặc `cs: ['HP', 'GS']`. Không khai `cs` = mọi cơ sở.

## Công thức hay dùng
- **Thêm tin có ảnh:** `sips -Z 1600 -s format jpeg -s formatOptions 80 "<ảnh gốc>" --out img/<ten-khong-dau>.jpg`, rồi thêm một mục vào `STORIES` (đặt `until` nếu chỉ chiếu vài ngày). Nhiều ảnh dùng `slides`.
- **Thêm video:** chép vào `media/<ten>.mp4` (H.264), dùng `items: [{ type: 'video', src: 'media/<ten>.mp4' }]`.
- **Vinh danh:** thêm `{ type, name, note, belt, until }` vào `HONORS`. Mã đai: trang, vang_trang, vang, xanh_vang, xanh, do_xanh, do, den_1 đến den_4. Ảnh chân dung (tuỳ chọn) `photo: 'img/vs-<ten>.jpg'`, ảnh vuông ~400px.
- **Sinh nhật võ sinh:** `type: 'birthday'`, `from`/`to` quanh ngày sinh nhật để tự hiện, tự ẩn.
- **Đổi lịch học:** sửa `SCHEDULE`. Lịch tạm (hè, Tết) thêm mục có `from`/`to`; nếu thay hẳn lịch thường thì thêm `to` cho mục cũ.
- **Thông báo chạy chữ:** thêm vào `TICKER`, dùng `{ text, until }` cho thông báo có hạn (học phí, nghỉ lễ).
- **Sự kiện:** thêm vào `AGENDA` (`from`, tuỳ chọn `to`, `time`, `place`).

## Kiểm tra trước khi xong
1. `node -e "global.window={};require('./content.js');console.log(window.TV.STORIES.length)"` không lỗi cú pháp.
2. Mọi `src`, `image`, `cover`, `photo` mới trong `content.js` có file thật (`ls img/... media/...`).
3. Nếu sửa giao diện: `python3 -m http.server 8766` rồi chụp Chrome headless `--window-size=1920,1080` trang `http://localhost:8766/index.html?at=2026-10-18T09:40#<số tin>`. `?at=` giả lập giờ để xem trạng thái ca học.

## Quy ước
- Màu theo logo: đỏ E8232A, vàng FFD600, xanh dương 0047AB, xanh trời 00AEEF, xanh lá 00B050, nền xanh đêm 04122B. Font Barlow Condensed (tiêu đề) + Be Vietnam Pro (nội dung), giống website.
- Tên võ sinh là trẻ em: chỉ đưa lên TV khi phụ huynh đồng ý; không ghi thông tin liên hệ, trường lớp của võ sinh.
