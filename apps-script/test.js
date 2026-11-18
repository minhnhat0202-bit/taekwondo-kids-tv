// Bộ giả lập Apps Script để thử tin.gs trên máy, không cần Google: node apps-script/test.js
// In OK/FAIL cho từng phép thử (đăng, lọc cơ sở, gỡ, dọn tin cũ, khoá khi sai PIN). Không triển khai file này.
const fs=require('fs'), vm=require('vm');
const sheets={}; const mkSheet=(n)=>{const sh={n,data:[],appendRow(r){this.data.push(r.slice())},getLastRow(){return this.data.length},setFrozenRows(){},setColumnWidth(){},
 getRange(a,b,c,d){ if(typeof a==='string') return {setFontWeight(){return this}}; const self=this; return {setNumberFormat(){return this},setValues(v){v.forEach((r,i)=>self.data[a-1+i]=r.slice())},getValues(){return self.data.slice(a-1,a-1+c).map(r=>r.slice(b-1,b-1+d))}} },
 getDataRange(){const self=this;return{getValues(){return self.data.map(r=>r.slice())}}}, deleteRow(i){this.data.splice(i-1,1)}}; return sh;};
const files={}; let fid=0, props={}, cache={};
const ctx={ console,
 SpreadsheetApp:{getActive:()=>({getSheetByName:(n)=>sheets[n]||null, insertSheet:(n)=>(sheets[n]=mkSheet(n))})},
 DriveApp:{Access:{},Permission:{},createFolder:()=>({getId:()=>'FOLDER',setSharing(){}}),getFolderById:()=>({createFile:(b)=>{const id='F'+(++fid)+'xxxxxxxxxx';files[id]={b,trashed:false};return{getId:()=>id,setSharing(){}}}}),
  getFileById:(id)=>({setTrashed(){files[id].trashed=true},getBlob:()=>({getBytes:()=>files[id].b.bytes})})},
 PropertiesService:{getScriptProperties:()=>({getProperty:(k)=>props[k]||null,setProperty:(k,v)=>{props[k]=v}})},
 CacheService:{getScriptCache:()=>({get:(k)=>cache[k]||null,put:(k,v)=>{cache[k]=v},remove:(k)=>{delete cache[k]}})},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 ScriptApp:{getProjectTriggers:()=>[],newTrigger:()=>({timeBased:()=>({everyDays:()=>({atHour:()=>({create(){}})})})})},
 Logger:{log:()=>{}},
 Utilities:{sleep(){},formatDate:(d,tz,f)=>{const x=new Date(d.getTime()+7*3600e3).toISOString();return f==='yyyy-MM-dd'?x.slice(0,10):x.slice(2,4)+x.slice(5,7)+x.slice(8,10)},
  base64Decode:(s)=>Buffer.from(s,'base64'),base64Encode:(b)=>Buffer.from(b).toString('base64'),newBlob:(bytes,type,name)=>({bytes,type,name})},
 ContentService:{MimeType:{JSON:1},createTextOutput:(s)=>({setMimeType(){return JSON.parse(s)}})}};
vm.createContext(ctx); vm.runInContext(fs.readFileSync(require('path').join(__dirname, 'tin.gs'),'utf8'),ctx);
const P=(o)=>ctx.doPost({postData:{contents:JSON.stringify(o)}}), G=(p)=>ctx.doGet({parameter:p});
ctx.setup();
const pinOf=(c)=>sheets['Mã PIN'].data.find(r=>r[0]===c)[2], all=pinOf('*'), hp=pinOf('HP'), gs=pinOf('GS');
const eq=(name,cond,x)=>console.log((cond?'OK  ':'FAIL')+' '+name+(cond?'':' → '+JSON.stringify(x)));
let r=P({action:'login',pin:'123'}); eq('sai PIN', !r.ok && /Sai/.test(r.error), r);
r=P({action:'login',pin:hp}); eq('login HP', r.ok && r.cs==='HP', r);
r=P({action:'login',pin:all}); eq('login *', r.ok && r.cs==='*', r);
const img=Buffer.from('fakejpeg').toString('base64');
r=P({action:'post',pin:hp,record:{kind:'story',title:'Tin HP',cs:['GS']},files:[{name:'a.jpg',data:img,w:10,h:5}]}); eq('post story HP (ép cs=HP)', r.ok, r);
r=P({action:'post',pin:hp,record:{kind:'story',title:'Không ảnh'}}); eq('story thiếu ảnh bị chặn', !r.ok, r);
r=P({action:'post',pin:hp,record:{kind:'story',title:'Video'},video:{name:'v.mp4',data:img,seconds:33}}); eq('post video', r.ok, r);
r=P({action:'post',pin:gs,record:{kind:'ticker',text:'TB GS',until:'2099-01-01'}}); eq('post ticker GS', r.ok, r);
r=P({action:'post',pin:all,record:{kind:'event',title:'SK chung',event:{from:'2099-02-02'}}}); eq('post event *', r.ok, r);
r=P({action:'post',pin:all,record:{kind:'ticker',text:'TB HP+GS',cs:['HP','GS','XX']}}); eq('post ticker * chọn cơ sở', r.ok, r);
r=P({action:'post',pin:hp,record:{kind:'ticker',text:'cũ',from:'2020-01-01',until:'2020-01-02'}}); eq('post ticker hết hạn', r.ok, r);
r=G({action:'published'}); const it=r.items; eq('published 5 tin còn hạn', r.ok && it.length===5, it.map(x=>x.title||x.text));
const st=it.find(x=>x.title==='Tin HP'); eq('cs ép HP', st.cs.join()==='HP' && st.images[0].url.includes('thumbnail'), st);
eq('cs lọc mã lạ', it.find(x=>x.text==='TB HP+GS').cs.join()==='HP,GS', it.find(x=>x.text==='TB HP+GS'));
eq('event cs *', it.find(x=>x.title==='SK chung').cs.join()==='*', 0);
const vid=it.find(x=>x.video); r=G({action:'file',id:vid.video.id}); eq('lấy video', r.ok && r.data===img && vid.video.seconds===33, r);
r=G({action:'file',id:st.images[0].id}); eq('không trả file không phải video', !r.ok, r);
r=P({action:'mine',pin:hp}); eq('mine HP = 3 (story, video, hết hạn)', r.items.length===3, r.items.map(x=>x.title||x.text));
r=P({action:'mine',pin:all}); eq('mine * = 6', r.items.length===6, r.items.length);
r=P({action:'delete',pin:gs,id:st.id}); eq('GS không gỡ được tin HP', !r.ok, r);
r=P({action:'delete',pin:hp,id:it.find(x=>x.text==='TB HP+GS').id}); eq('HP không gỡ tin nhiều cơ sở', !r.ok, r);
r=P({action:'delete',pin:hp,id:st.id}); eq('HP gỡ tin HP', r.ok, r);
eq('file ảnh vào thùng rác', files[st.images[0].id].trashed, 0);
ctx.cleanup(); r=P({action:'mine',pin:all}); eq('cleanup xoá tin hết hạn lâu', r.items.length===4, r.items.map(x=>x.title||x.text));
for(let i=0;i<20;i++) P({action:'login',pin:'0000'}); r=P({action:'login',pin:hp}); eq('khoá sau 20 lần sai', !r.ok && /quá nhiều/.test(r.error), r);
