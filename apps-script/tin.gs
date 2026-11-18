// Máy chủ đăng tin cho màn hình TV võ đường (không qua duyệt).
//   dang-tin.html → POST login, post, mine, delete (cần mã PIN cơ sở)
//   index.html (TV) → GET ?action=published (mọi tin còn hạn), GET ?action=file&id= (video, base64)
// Tin lưu ở sheet "Tin" của Google Sheet gắn script này; ảnh, video lưu ở thư mục Drive "ai có link đều xem được".
// Mã PIN ở sheet "Mã PIN" (chỉ chủ Sheet thấy): mỗi cơ sở một PIN, dòng mã * = toàn hệ thống (đăng cho mọi cơ sở, gỡ được mọi tin).
// Đổi PIN: sửa thẳng ô trong sheet, có hiệu lực sau tối đa 60 giây.
//
// CÀI ĐẶT: chạy hàm setup một lần (tạo sheet, thư mục Drive, PIN ngẫu nhiên), rồi Triển khai → Ứng dụng web:
// Thực thi với tư cách "Tôi", Người có quyền truy cập "Bất kỳ ai"; chép URL /exec vào API_URL trong tin.js.
// Sửa sau này bằng clasp: xem mục "Máy chủ đăng tin" trong AGENTS.md.

const SHEET = 'Tin', PIN_SHEET = 'Mã PIN';
const COLS = ['id', 'createdAt', 'cs', 'kind', 'title', 'from', 'until', 'json'];
const TZ = 'Asia/Ho_Chi_Minh';
const BRANCHES = { HP: 'Cơ sở Hapulico', GS: 'Cơ sở GreenStars', ND: 'Cơ sở Nghĩa Đô', HD: 'Cơ sở Hà Đông', LB: 'Cơ sở Long Biên', GH: 'Cơ sở Gia Hoà', HL: 'Cơ sở Hạ Long' };
const LIMITS = { title: 48, tag: 14, text: 120, place: 40, time: 20 };
const MAX_IMAGES = 8, MAX_IMAGE_B64 = 4 * 1024 * 1024, MAX_VIDEO_B64 = 14 * 1024 * 1024;   // video 10 MB ≈ 13,4 MB base64
const KEEP_DAYS = 30;                                                                         // tin hết hạn quá 30 ngày thì xoá hẳn (cả file)

function setup() {
  sheet_(); folder_(); pinSheet_();
  ScriptApp.getProjectTriggers().forEach((t) => { if (t.getHandlerFunction() === 'cleanup') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('cleanup').timeBased().everyDays(1).atHour(3).create();
  Logger.log('Xong. Mã PIN ở sheet "' + PIN_SHEET + '". Thư mục file: https://drive.google.com/drive/folders/' + prop_('FOLDER_ID'));
}

function doGet(e) {
  const a = (e && e.parameter && e.parameter.action) || 'published';
  try {
    if (a === 'published') return out_(published_());
    if (a === 'file') return out_(file_(e.parameter.id));
    return out_({ ok: false, error: 'Thao tác không hỗ trợ' });
  } catch (x) { return out_({ ok: false, error: String(x && x.message || x) }); }
}

function doPost(e) {
  let p;
  try { p = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ' }); }
  try {
    const cs = auth_(p.pin);
    if (p.action === 'login') return out_({ ok: true, cs: cs });
    if (p.action === 'mine') return out_({ ok: true, items: rows_().map((x) => x.rec).filter((r) => mine_(r, cs)) });
    if (p.action === 'post') return out_(post_(p, cs));
    if (p.action === 'delete') return out_(del_(p.id, cs));
    return out_({ ok: false, error: 'Thao tác không hỗ trợ' });
  } catch (x) { return out_({ ok: false, error: String(x && x.message || x) }); }
}

// ---------- thao tác ----------
function post_(p, cs) {
  const r = clean_(p.record || {});
  if (r.kind === 'story' && !r.title) throw new Error('Thiếu tiêu đề');
  if (r.kind === 'ticker' && !r.text) throw new Error('Thiếu nội dung thông báo');
  if (r.kind === 'event' && !(r.title && r.event.from)) throw new Error('Thiếu tên hoặc ngày sự kiện');
  const files = (p.files || []).slice(0, MAX_IMAGES);
  if (r.kind === 'story' && !files.length && !(p.video && p.video.data)) throw new Error('Tin Bảng tin cần ít nhất một ảnh hoặc một video');
  if (cs === '*') { const want = (p.record.cs || []).filter((c) => BRANCHES[c]); r.cs = want.length ? want : ['*']; }
  else r.cs = [cs];
  r.id = newId_(); r.createdAt = new Date().toISOString();
  if (r.kind === 'story') {
    const folder = folder_(), safe = (n) => String(n || 'file').replace(/[^\w.\-]+/g, '_');
    if (p.video && p.video.data) {
      if (p.video.data.length > MAX_VIDEO_B64) throw new Error('Video lớn quá 10 MB');
      const f = folder.createFile(Utilities.newBlob(Utilities.base64Decode(p.video.data), 'video/mp4', r.id + '-' + safe(p.video.name)));
      r.video = { id: f.getId(), type: 'video/mp4', seconds: Math.max(0, Math.min(90, Math.round(+p.video.seconds || 0))) };
    } else {
      r.images = files.map((f, n) => {
        if (!f || !f.data || f.data.length > MAX_IMAGE_B64) return null;
        const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(f.data), 'image/jpeg', r.id + '-' + (n + 1) + '-' + safe(f.name)));
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (x) {}
        return { id: file.getId(), url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1600', w: +f.w || 0, h: +f.h || 0 };
      }).filter(Boolean);
      if (!r.images.length) throw new Error('Không lưu được ảnh (ảnh quá lớn?)');
    }
  }
  withLock_(() => sheet_().appendRow(toRow_(r)));
  CacheService.getScriptCache().remove('published');
  return { ok: true, record: { id: r.id } };
}

function del_(id, cs) {
  return withLock_(() => {
    const found = rows_().filter((x) => x.rec.id === id)[0];
    if (!found) throw new Error('Không tìm thấy tin (có thể đã bị gỡ)');
    if (!mine_(found.rec, cs)) throw new Error('Tin này đăng cho nhiều cơ sở, chỉ PIN toàn hệ thống gỡ được');
    trashFiles_(found.rec);
    sheet_().deleteRow(found.row);
    CacheService.getScriptCache().remove('published');
    return { ok: true };
  });
}

// TV gọi mỗi 2 phút; đệm 60 giây cho đỡ tốn hạn mức
function published_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('published');
  if (hit) return JSON.parse(hit);
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const res = { ok: true, items: rows_().map((x) => x.rec).filter((r) => !lastDay_(r) || lastDay_(r) >= today) };
  try { cache.put('published', JSON.stringify(res), 60); } catch (x) {}
  return res;
}

// Video: Drive chặn trang ngoài phát file trực tiếp, nên TV lấy base64 qua đây. Chỉ trả file thuộc một tin.
function file_(id) {
  const r = rows_().map((x) => x.rec).filter((x) => x.video && x.video.id === id)[0];
  if (!r) throw new Error('Không tìm thấy file');
  const blob = DriveApp.getFileById(id).getBlob();
  return { ok: true, type: r.video.type || 'video/mp4', data: Utilities.base64Encode(blob.getBytes()) };
}

// Chạy hằng ngày lúc 3 giờ sáng (trigger do setup tạo): xoá tin hết hạn quá KEEP_DAYS ngày cùng file ảnh, video
function cleanup() {
  const limit = Utilities.formatDate(new Date(Date.now() - KEEP_DAYS * 86400000), TZ, 'yyyy-MM-dd');
  withLock_(() => {
    rows_().filter((x) => lastDay_(x.rec) && lastDay_(x.rec) < limit).sort((a, b) => b.row - a.row)
      .forEach((x) => { trashFiles_(x.rec); sheet_().deleteRow(x.row); });
  });
  CacheService.getScriptCache().remove('published');
}

// ---------- tiện ích ----------
function clean_(r) {
  const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  const day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '');
  const kind = ['story', 'ticker', 'event'].indexOf(r.kind) > -1 ? r.kind : '';
  if (!kind) throw new Error('Loại tin không hợp lệ');
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const o = { kind: kind };
  if (kind === 'story') { o.title = str(r.title, LIMITS.title); o.tag = str(r.tag, LIMITS.tag); o.seconds = Math.max(4, Math.min(30, +r.seconds || 8)); }
  if (kind === 'ticker') o.text = str(r.text, LIMITS.text);
  if (kind === 'event') {
    const ev = r.event || {};
    o.title = str(r.title, LIMITS.title);
    o.event = { from: day(ev.from), to: day(ev.to), time: str(ev.time, LIMITS.time), place: str(ev.place, LIMITS.place) };
    if (o.event.to && o.event.to < o.event.from) o.event.to = '';
  } else {
    o.from = day(r.from) || today;
    o.until = day(r.until) || Utilities.formatDate(new Date(Date.now() + 7 * 86400000), TZ, 'yyyy-MM-dd');
    if (o.until < o.from) throw new Error('Ngày kết thúc trước ngày bắt đầu');
  }
  return o;
}
function lastDay_(r) { return r.kind === 'event' ? ((r.event && (r.event.to || r.event.from)) || '') : (r.until || ''); }
function mine_(r, cs) { return cs === '*' || (r.cs || []).join() === cs; }
function trashFiles_(r) {
  (r.images || []).concat(r.video ? [r.video] : []).forEach((i) => { if (i.id) try { DriveApp.getFileById(i.id).setTrashed(true); } catch (x) {} });
}

// PIN → mã cơ sở ('*' = toàn hệ thống). Sai quá 20 lần trong 10 phút thì tạm khoá, chống dò PIN.
function auth_(pin) {
  const cache = CacheService.getScriptCache(), fails = +(cache.get('fails') || 0);
  if (fails >= 20) throw new Error('Nhập sai quá nhiều lần, thử lại sau 10 phút');
  pin = String(pin || '').trim();
  const cs = pin.length >= 4 ? pins_()[pin] : '';
  if (!cs) { cache.put('fails', String(fails + 1), 600); Utilities.sleep(800); throw new Error('Sai mã PIN'); }
  return cs;
}
function pins_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('pins');
  if (hit) return JSON.parse(hit);
  const map = {};
  pinSheet_().getDataRange().getValues().slice(1).forEach((v) => {
    const code = String(v[0] || '').trim().toUpperCase(), pin = String(v[2] || '').trim();
    if (pin.length >= 4 && (code === '*' || BRANCHES[code])) map[pin] = code;
  });
  try { cache.put('pins', JSON.stringify(map), 60); } catch (x) {}
  return map;
}
function pinSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(PIN_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(PIN_SHEET);
  const used = {}, rnd = () => { let p; do { p = String(Math.floor(100000 + Math.random() * 900000)); } while (used[p]); used[p] = 1; return p; };
  const rows = [['Mã cơ sở', 'Tên', 'PIN (ít nhất 4 số, không trùng nhau)'], ['*', 'Toàn hệ thống (đăng cho mọi cơ sở)', rnd()]]
    .concat(Object.keys(BRANCHES).map((k) => [k, BRANCHES[k], rnd()]));
  sh.getRange(1, 1, rows.length, 3).setNumberFormat('@').setValues(rows);
  sh.setFrozenRows(1); sh.getRange('1:1').setFontWeight('bold'); sh.setColumnWidth(2, 280); sh.setColumnWidth(3, 260);
  return sh;
}
function rows_() {
  const sh = sheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const j = COLS.indexOf('json');
  return sh.getRange(2, 1, n, COLS.length).getValues()
    .map((v, k) => { try { return { row: k + 2, rec: JSON.parse(v[j]) }; } catch (x) { return null; } })
    .filter(Boolean).reverse();                                              // mới nhất lên đầu
}
function toRow_(r) {
  return COLS.map((c) => (c === 'json' ? JSON.stringify(r) : c === 'cs' ? (r.cs || []).join(',') : c === 'title' ? (r.title || r.text || '')
    : c === 'from' ? (r.kind === 'event' ? r.event.from : r.from) : c === 'until' ? lastDay_(r) : (r[c] == null ? '' : r[c])));
}
function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(COLS); sh.setFrozenRows(1); sh.getRange('1:1').setFontWeight('bold'); sh.setColumnWidth(COLS.length, 400); }
  return sh;
}
function folder_() {
  const id = prop_('FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  const f = DriveApp.createFolder('TV Taekwondo Kids · Ảnh, video tin đăng');
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (x) {}
  PropertiesService.getScriptProperties().setProperty('FOLDER_ID', f.getId());
  return f;
}
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function withLock_(fn) { const l = LockService.getScriptLock(); l.waitLock(20000); try { return fn(); } finally { l.releaseLock(); } }
function newId_() { return 'T' + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
