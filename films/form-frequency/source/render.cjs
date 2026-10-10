const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process');
let renderer;try{renderer=require('@remotion/renderer');}catch{renderer=require('../../../story-studio/node_modules/@remotion/renderer');}
const ROOT=__dirname,OUT=path.resolve(process.env.FILM_OUTPUT||path.join(ROOT,'out'));
fs.mkdirSync(OUT,{recursive:true});
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(req.url.split('?')[0]);const p=path.resolve(ROOT,'.'+(name==='/'?'/index.html':name));if(!p.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
 try{const data=fs.readFileSync(p);const mime={'.html':'text/html','.js':'text/javascript','.woff2':'font/woff2','.ttf':'font/ttf'}[path.extname(p)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime});res.end(data);}catch{res.writeHead(404);res.end();}
});
async function run(command,args){await new Promise((resolve,reject)=>{const p=spawn(command,args,{stdio:'inherit'});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(new Error(command+' exited '+code)));});}
(async()=>{
 await new Promise(r=>server.listen(process.env.PORT||0,'127.0.0.1',r));const port=server.address().port;
 if(process.argv.includes('--serve')){console.log(`Preview: http://127.0.0.1:${port}`);return;}
 let browser;
 try{
  browser=await renderer.openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER||'/usr/bin/chromium',logLevel:'error',chromiumOptions:{gl:'swangle',enableMultiProcessOnLinux:true}});
  const page=await browser.newPage({context:()=>Promise.resolve(null),logLevel:'error',indent:false,pageIndex:0,onBrowserLog:null,onLog:()=>{}});
  await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
  await page.goto({url:`http://127.0.0.1:${port}/`,timeout:30000,options:{waitUntil:'load'}});
  const info=await page.evaluate(async()=>await window.ready);fs.writeFileSync(path.join(OUT,'engine.json'),JSON.stringify(info,null,2));console.log(JSON.stringify(info));
  if(process.argv.includes('--preview')){
   for(const t of [.6,1.4,2.8,3.7,4.8,6.3,7.8,8.7,10,11.4,12.6,14.6]){
    const data=await page.evaluate(s=>{const r=window.renderAt(s);if(r.shaderError)throw new Error('WebGL '+r.shaderError);return document.getElementById('film').toDataURL('image/png').split(',')[1];},t);
    fs.writeFileSync(path.join(OUT,`preview-${t.toFixed(1)}.png`),Buffer.from(data,'base64'));console.log('Preview',t);
   }
   const wav=await page.evaluate(async()=>{const bytes=window.waveBytes(await window.createScore());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);});fs.writeFileSync(path.join(OUT,'score.wav'),Buffer.from(wav,'base64'));
   return;
  }
  if(!fs.existsSync(path.join(OUT,'score.wav'))){
   const wav=await page.evaluate(async()=>{const bytes=window.waveBytes(await window.createScore());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);});fs.writeFileSync(path.join(OUT,'score.wav'),Buffer.from(wav,'base64'));
  }
  const silent=path.join(OUT,'picture.mp4');
  const encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-framerate','60','-vcodec','png','-i','pipe:0','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-profile:v','high','-level','4.2','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',silent],{stdio:['pipe','inherit','inherit']});
  let encoderFailure;const done=new Promise((resolve,reject)=>{encoder.on('error',e=>{encoderFailure=e;reject(e);});encoder.on('exit',code=>code===0?resolve():reject(new Error('Encoding exited '+code)));});done.catch(()=>{});
  const start=Date.now();
  for(let f=0;f<900;f++){
   if(encoderFailure)throw encoderFailure;
   const data=await page.evaluate(s=>{const r=window.renderAt(s);if(r.shaderError)throw new Error('WebGL '+r.shaderError);return document.getElementById('film').toDataURL('image/png').split(',')[1];},f/60);
   const bytes=Buffer.from(data,'base64');if(!encoder.stdin.write(bytes))await new Promise(r=>encoder.stdin.once('drain',r));
   if(f%60===0)console.log(`Frame ${f}/900; ${((Date.now()-start)/1000).toFixed(1)} seconds elapsed`);
  }
  encoder.stdin.end();await done;
  await run('ffmpeg',['-y','-hide_banner','-loglevel','warning','-i',silent,'-i',path.join(OUT,'score.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t','15','-movflags','+faststart',path.join(OUT,'form-frequency-15s.mp4')]);
  console.log('Saved '+path.join(OUT,'form-frequency-15s.mp4'));
 }finally{if(browser)await browser.close({silent:true});await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;server.close();});
