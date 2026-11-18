// Tin đăng từ trang dang-tin.html (không qua duyệt). Dùng chung cho TV (index.html) và trang đăng tin.
// Viết kiểu ES2015 cho trình duyệt TV cũ: không dùng ?. ?? async/await.
//
// Một tin (record) do máy chủ apps-script/tin.gs lưu:
//   id, createdAt, kind ('story' | 'ticker' | 'event'), cs: ['HP'] hoặc ['*'] (mọi cơ sở)
//   story:  title, tag, images: [{ id, url, w, h }] hoặc video: { id, type }, seconds (mỗi ảnh), from, until
//   ticker: text, from, until
//   event:  title, event: { from, to, time, place }
(function (W) {
  'use strict';
  // URL Apps Script (kết thúc bằng /exec). Để trống = chế độ thử: tin lưu ngay trong trình duyệt này,
  // PIN thử 000000 = mọi cơ sở, 111111 = cơ sở HP.
  var API_URL = '';
  var LIMITS = { title: 48, tag: 14, text: 120, place: 40, time: 20, images: 8, videoMB: 10 };
  var KEY = { cache: 'tkd-tin-cache', demo: 'tkd-tin-demo', pin: 'tkd-tin-pin' };

  function store(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) { return v === undefined ? null : false; }
  }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function addDays(iso, n) { var a = iso.split('-').map(Number); return dayKey(new Date(a[0], a[1] - 1, a[2] + n)); }
  function lastDay(r) { return r.kind === 'event' ? ((r.event && (r.event.to || r.event.from)) || '') : (r.until || ''); }
  function onAir(r, t) {
    t = t || dayKey();
    var end = lastDay(r);
    return (r.kind === 'event' || !r.from || r.from <= t) && (!end || end >= t);
  }
  function stateOf(r) {
    var t = dayKey(), end = lastDay(r);
    if (end && end < t) return { key: 'expired', label: 'Hết hạn' };
    if (r.kind !== 'event' && r.from && r.from > t) return { key: 'scheduled', label: 'Chờ ngày chiếu' };
    return { key: 'live', label: 'Đang trên TV' };
  }

  // Một tin → các mục đúng định dạng content.js (STORIES, AGENDA, TICKER)
  function toTV(r) {
    var out = { stories: [], agenda: [], ticker: [] }, cs = (r.cs || []).indexOf('*') > -1 ? null : r.cs;
    function withCS(o) { if (cs && cs.length) o.cs = cs; return o; }
    if (r.kind === 'story' && r.title) {
      var st = withCS({ id: 'n-' + r.id, tab: r.title, title: r.title, tag: r.tag || '', until: r.until || '' });
      var imgs = (r.images || []).map(function (i) { return i.url; }).filter(Boolean);
      if (r.video && r.video.id) { st.items = [{ type: 'video', src: 'tin:' + r.video.id }]; st.seconds = Math.min(90, Math.ceil(+r.video.seconds || 40) + 1); }
      else if (imgs.length > 1) { st.slides = imgs.map(function (u) { return { src: u }; }); st.slideSeconds = +r.seconds || 8; }
      else if (imgs.length) st.image = imgs[0];
      else return out;
      out.stories.push(st);
    }
    if (r.kind === 'ticker' && r.text) out.ticker.push(withCS({ text: r.text, until: r.until || '' }));
    if (r.kind === 'event' && r.title && r.event && r.event.from) {
      var a = withCS({ title: r.title, from: r.event.from });
      if (r.event.to && r.event.to > r.event.from) a.to = r.event.to;
      if (r.event.time) a.time = r.event.time;
      if (r.event.place) a.place = r.event.place;
      out.agenda.push(a);
    }
    return out;
  }
  // Ghép tin đăng vào window.TV: tin Bảng tin mới nhất đứng đầu, trước các tin trong content.js
  function mergeInto(TV, recs) {
    var st = [];
    TV.STORIES = TV.STORIES || []; TV.AGENDA = TV.AGENDA || []; TV.TICKER = TV.TICKER || [];
    recs.slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).forEach(function (r) {
      var x = toTV(r);
      st = st.concat(x.stories); TV.AGENDA = TV.AGENDA.concat(x.agenda); TV.TICKER = x.ticker.concat(TV.TICKER);
    });
    TV.STORIES = st.concat(TV.STORIES);
  }
  function sig(items) { return items.map(function (r) { return r.id; }).sort().join('|'); }

  // ---------- máy chủ: Apps Script, hoặc chế độ thử trong trình duyệt ----------
  function call(action, data) {
    data = data || {};
    if (!API_URL) return demo(action, data);
    var req;
    if (action === 'published' || action === 'file') req = fetch(API_URL + '?action=' + action + (data.id ? '&id=' + encodeURIComponent(data.id) : '') + '&t=' + Date.now(), { cache: 'no-store', redirect: 'follow' });
    else req = fetch(API_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: action }, data)) });
    return req.then(function (r) { if (!r.ok) throw new Error('Máy chủ trả lỗi ' + r.status); return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || 'Lỗi không rõ'); return j; });
  }
  function demo(action, data) {
    var PINS = { '000000': '*', '111111': 'HP' };
    return new Promise(function (res, rej) {
      setTimeout(function () {
        try {
          var list = store(KEY.demo) || [], save = function () { if (!store(KEY.demo, list)) throw new Error('Bộ nhớ trình duyệt đầy (ảnh/video thử quá lớn)'); };
          if (action === 'published') return res({ ok: true, items: list });
          if (action === 'file') { var v = list.filter(function (r) { return r.video && r.video.id === data.id; })[0]; if (!v) throw new Error('Không tìm thấy file'); return res({ ok: true, type: v.video.type, data: v.video.data }); }
          var cs = PINS[String(data.pin || '')];
          if (!cs) throw new Error('Sai mã PIN');
          var mine = function (r) { return cs === '*' || (r.cs || []).join() === cs; };
          if (action === 'login') return res({ ok: true, cs: cs });
          if (action === 'mine') return res({ ok: true, items: list.filter(mine) });
          if (action === 'delete') { list = list.filter(function (r) { return !(r.id === data.id && mine(r)); }); save(); return res({ ok: true }); }
          if (action === 'post') {
            var r = JSON.parse(JSON.stringify(data.record || {}));
            r.id = 'D' + Date.now().toString(36).toUpperCase(); r.createdAt = new Date().toISOString();
            r.cs = cs === '*' ? (r.cs && r.cs.length ? r.cs : ['*']) : [cs];
            r.images = (data.files || []).map(function (f) { return { url: 'data:' + f.type + ';base64,' + f.data, w: f.w, h: f.h }; });
            if (data.video) r.video = { id: 'v' + r.id, type: data.video.type, data: data.video.data, seconds: data.video.seconds };
            list.unshift(r); save(); return res({ ok: true, record: { id: r.id } });
          }
          throw new Error('Thao tác không hỗ trợ: ' + action);
        } catch (e) { rej(e); }
      }, 250);
    });
  }
  function published() {
    return call('published').then(function (j) { store(KEY.cache, j.items || []); return j.items || []; });
  }
  // Video lấy qua Apps Script (base64) rồi dựng blob: Drive chặn trang ngoài phát file trực tiếp
  function fileBlob(id) {
    return call('file', { id: id }).then(function (j) {
      var b = atob(j.data), n = b.length, u = new Uint8Array(n), i;
      for (i = 0; i < n; i++) u[i] = b.charCodeAt(i);
      return new Blob([u], { type: j.type || 'video/mp4' });
    });
  }
  function withTimeout(p, ms) {
    return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error('timeout')); }, ms); p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); });
  }

  // ---------- TV ----------
  // Có bản lưu đệm thì chạy ngay bằng bản đó; watch() hỏi lại máy chủ định kỳ, danh sách tin đổi thì tải lại trang.
  var api = { bootSig: null };
  function loadForTV(TV) {
    function apply(items) { items = (items || []).filter(function (r) { return onAir(r); }); api.bootSig = sig(items); mergeInto(TV, items); }
    var cached = store(KEY.cache);
    if (cached) { apply(cached); return Promise.resolve(); }
    var live = published();
    // Apps Script lâu không gọi thì "thức dậy" chậm: quá 6 giây thì TV chạy trước, tin về muộn thì tải lại
    return withTimeout(live, 6000).then(apply, function () {
      apply([]);
      live.then(function (items) { if (items.filter(function (r) { return onAir(r); }).length) location.reload(); }, function () {});
    });
  }
  function watch(seconds) {
    setInterval(function () {
      published().then(function (items) {
        if (api.bootSig !== null && sig(items.filter(function (r) { return onAir(r); })) !== api.bootSig) location.reload();
      }, function () {});
    }, Math.max(30, seconds || 120) * 1000);
  }

  // ---------- trang đăng tin: nén ảnh, đọc video ----------
  function readB64(blob) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).split(',')[1] || ''); }; fr.onerror = rej; fr.readAsDataURL(blob); });
  }
  // Ảnh: cạnh dài ≤ 1600, JPEG 85%
  function packImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var W0 = im.naturalWidth, H0 = im.naturalHeight, k = Math.min(1, 1600 / Math.max(W0, H0));
        var c = document.createElement('canvas'); c.width = Math.round(W0 * k); c.height = Math.round(H0 * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        var d = c.toDataURL('image/jpeg', 0.85);
        res({ name: file.name, type: 'image/jpeg', data: d.split(',')[1], w: c.width, h: c.height, preview: d });
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Không đọc được ảnh ' + file.name)); };
      im.src = url;
    });
  }
  function packVideo(file) {
    if (!/^video\/mp4$/.test(file.type)) return Promise.reject(new Error('Video phải là file MP4'));
    if (file.size > LIMITS.videoMB * 1024 * 1024) return Promise.reject(new Error('Video lớn quá ' + LIMITS.videoMB + ' MB, hãy cắt ngắn hoặc nén lại'));
    var dur = new Promise(function (res) {                        // thời lượng để TV chiếu đủ video
      var v = document.createElement('video'), u = URL.createObjectURL(file), done = function (x) { URL.revokeObjectURL(u); res(x); };
      v.preload = 'metadata'; v.onloadedmetadata = function () { done(v.duration || 0); }; v.onerror = function () { done(0); }; v.src = u;
      setTimeout(function () { done(0); }, 8000);
    });
    return Promise.all([readB64(file), dur]).then(function (x) {
      if (x[1] > 90) throw new Error('Video dài quá 90 giây, hãy cắt ngắn lại');
      return { name: file.name, type: 'video/mp4', data: x[0], size: file.size, seconds: Math.round(x[1]) };
    });
  }

  W.TIN = Object.assign(api, {
    LIMITS: LIMITS, KEY: KEY, store: store, dayKey: dayKey, addDays: addDays, onAir: onAir, stateOf: stateOf,
    toTV: toTV, mergeInto: mergeInto, call: call, published: published, fileBlob: fileBlob, loadForTV: loadForTV, watch: watch,
    packImage: packImage, packVideo: packVideo, isDemo: function () { return !API_URL; }
  });
})(window);
