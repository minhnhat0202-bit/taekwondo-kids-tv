# Màn hình TV võ đường Taekwondo Kids

Dành cho mọi agent (Claude Code, omp). Đọc file này trước, chỉ mở thêm file khác khi cần.
Dựng theo khung Bản tin TV của VTNet (`~/Documents/1. Viettel/3. VTNET/Internal Communication/Dashboard/tv/`), đổi nội dung cho võ đường.

## Bản đồ
- `content.js`: **toàn bộ nội dung**. Hướng dẫn từng trường ở đầu mỗi mục. Việc hằng ngày chỉ sửa file này.
  - `STORIES` Bảng tin (khung lớn trái): kiểu `image`, `slides`, `items` (video + ảnh), `points` (thẻ chữ đánh số).
  - `SCHEDULE` Ca học (khung Hôm nay): lặp theo thứ trong tuần, TV tự báo Đang tập / Còn n phút / Sắp tới, ẩn ca đã xong.
  - `HONORS` Vinh danh: **khung đang tắt trên TV** (thêm vào HONORS không hiện gì); bật lại = thêm khung `p-honor` vào `.side` trong `index.html` (chỉ Claude).
  - `AGENDA` Sắp diễn ra (4 mục gần nhất) · `TICKER` dòng chạy · `SAMPLE` nhãn "Dữ liệu mẫu".
- `index.html`: giao diện và mã. Chỉ sửa khi đổi bố cục hoặc thêm kiểu tin mới.
- `dang-tin.html`: **trang đăng tin** cho các cơ sở (điện thoại), không qua duyệt, vào bằng mã PIN cơ sở. Đăng được Bảng tin (≤ 8 ảnh hoặc 1 video MP4 ≤ 10 MB, ≤ 90 giây), Thông báo chạy chữ, Sự kiện; gỡ tin của mình. TV nhận tin trong khoảng 2 phút.
- `tin.js`: mã dùng chung cho TV và trang đăng tin (gọi máy chủ, ghép tin đăng vào `STORIES`/`TICKER`/`AGENDA`, nén ảnh 1600px). `API_URL` ở đầu file; để trống = chế độ thử (tin lưu trong trình duyệt, PIN thử 000000 / 111111).
- `apps-script/tin.gs`: máy chủ (Google Sheet "Tin" + thư mục Drive ảnh/video). Mã PIN ở sheet "Mã PIN" của chính Sheet đó: mỗi cơ sở một PIN, mã `*` = toàn hệ thống (đăng cho nhiều cơ sở, gỡ mọi tin). Tin hết hạn quá 30 ngày tự xoá lúc 3 giờ sáng.
- `img/` ảnh (cạnh dài ≤ 1600, JPG), `media/` video H.264 MP4.

## Máy chủ đăng tin (chỉ Claude làm, hỏi người dùng trước mỗi lần triển khai)
- Đổi PIN, khoá một cơ sở: sửa thẳng sheet "Mã PIN" (xoá PIN = khoá), có hiệu lực sau ≤ 60 giây, không cần triển khai lại. Sai PIN 20 lần trong 10 phút thì khoá đăng nhập 10 phút.
- Sửa `apps-script/tin.gs`: thử trước bằng `node apps-script/test.js` (giả lập Apps Script, mọi dòng phải OK), rồi trong `apps-script/`: `clasp push --force` → `clasp redeploy <mã triển khai> -d "<thay đổi>"` (mã triển khai = đoạn giữa `/macros/s/` và `/exec` của `API_URL`, giữ nguyên URL) → gọi thử `API_URL?action=published`. `.clasp.json` không commit.
- Tin đăng chiếu trước các tin trong `content.js`, mới nhất đứng đầu. Gỡ gấp một tin: vào `dang-tin.html` bằng PIN toàn hệ thống, bấm Gỡ.

## Nhiều cơ sở, một bộ file
- Mỗi TV mở `index.html?cs=<mã>`: HP Hapulico, GS GreenStars, ND Nghĩa Đô, HD Hà Đông, LB Long Biên, GH Gia Hoà, HL Hạ Long. Không có `?cs=` thì dùng `DEFAULT_BRANCH`.
- Mục nào chỉ cho một số cơ sở thì thêm `cs: 'HP'` hoặc `cs: ['HP', 'GS']`. Không khai `cs` = mọi cơ sở.

## Công thức hay dùng
- **Thêm tin có ảnh:** `sips -Z 1600 -s format jpeg -s formatOptions 80 "<ảnh gốc>" --out img/<ten-khong-dau>.jpg`, rồi thêm một mục vào `STORIES` (đặt `until` nếu chỉ chiếu vài ngày). Nhiều ảnh dùng `slides`.
- **Thêm video:** chép vào `media/<ten>.mp4` (H.264), dùng `items: [{ type: 'video', src: 'media/<ten>.mp4' }]`. Nén về **≤ 10 MB** (cạnh dài ≤ 1280, bỏ tiếng vì TV phát câm): TV tải trọn file về máy lúc mở trang để phát không giật, file lớn thì tải lâu và tốn bộ nhớ TV.
- **Ảnh thiết kế riêng cho Bảng tin (poster, thông báo):** khung ảnh trên TV 1920×1080 **1202×702** (tỷ lệ ~1,71:1, không phải 16:9); tiêu đề một dòng ≤ 48 ký tự, không còn dòng phụ `sub`. TV luôn hiện trọn ảnh (contain), phần trống phủ nền mờ; muốn kín khung thì dựng ảnh **1920×1121**, chữ cách mép ≥ 32 px (khung bo góc 20 px).
- **Dòng chạy:** tốc độ cố định `TICKER_SPEED` px/giây trong `content.js` (mặc định 150), không phụ thuộc độ dài nội dung.
- **Vinh danh:** thêm `{ type, name, note, belt, until }` vào `HONORS`. Mã đai: trang, vang_trang, vang, xanh_vang, xanh, do_xanh, do, den_1 đến den_4. Ảnh chân dung (tuỳ chọn) `photo: 'img/vs-<ten>.jpg'`, ảnh vuông ~400px.
- **Sinh nhật võ sinh:** `type: 'birthday'`, `from`/`to` quanh ngày sinh nhật để tự hiện, tự ẩn.
- **Đổi lịch học:** sửa `SCHEDULE`. Lịch tạm (hè, Tết) thêm mục có `from`/`to`; nếu thay hẳn lịch thường thì thêm `to` cho mục cũ.
- **Thông báo chạy chữ:** thêm vào `TICKER`, dùng `{ text, until }` cho thông báo có hạn (học phí, nghỉ lễ).
- **Sự kiện:** thêm vào `AGENDA` (`from`, tuỳ chọn `to`, `time`, `place`).

## Kiểm tra trước khi xong
1. `node -e "global.window={};require('./content.js');console.log(window.TV.STORIES.length)"` không lỗi cú pháp.
2. Mọi `src`, `image`, `cover`, `photo` mới trong `content.js` có file thật (`ls img/... media/...`).
2b. Nếu sửa `tin.js` hoặc `dang-tin.html`: `node --check tin.js`, mở `dang-tin.html` (chế độ thử khi `API_URL` trống) đăng thử một tin rồi xem `index.html?cs=HP`.
3. Nếu sửa giao diện: `python3 -m http.server 8766` rồi chụp Chrome headless `--window-size=1920,1080` trang `http://localhost:8766/index.html?at=2026-10-18T09:40#<số tin>`. `?at=` giả lập giờ để xem trạng thái ca học.

## Quy ước
- Màu theo logo: đỏ E8232A, vàng FFD600, xanh dương 0047AB, xanh trời 00AEEF, xanh lá 00B050, nền xanh đêm 04122B. Font Barlow Condensed (tiêu đề) + Be Vietnam Pro (nội dung), giống website.
- Tên võ sinh là trẻ em: chỉ đưa lên TV khi phụ huynh đồng ý; không ghi thông tin liên hệ, trường lớp của võ sinh.
