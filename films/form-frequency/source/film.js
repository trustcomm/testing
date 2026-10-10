/* Deterministic Canvas typography and geometry over actual WebGL/GLSL fields. */
const W=1920,H=1080,canvas=document.getElementById('film'),c=canvas.getContext('2d',{alpha:false});
const glCanvas=document.createElement('canvas');glCanvas.width=W;glCanvas.height=H;
const gl=glCanvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});
if(!gl)throw new Error('WebGL 2 is required for this film.');
function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,'#version 300 es\nin vec2 position;void main(){gl_Position=vec4(position,0.,1.);}'));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,window.fragmentSource));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
gl.useProgram(program);const positions=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,positions);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);const u={};for(const k of ['resolution','time','pulse','scene'])u[k]=gl.getUniformLocation(program,k);
const P={ink:'#091313',paper:'#eceee0',lime:'#c6fa53',coral:'#ff543c',teal:'#33dab5',blue:'#657bff'};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>1-Math.pow(1-clamp(v),4);
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const spring=v=>1-Math.exp(-9*Math.max(0,v))*Math.cos(Math.max(0,v)*14);
function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function line(x1,y1,x2,y2,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function circle(x,y,r,color,stroke=false,width=2){c.beginPath();c.arc(x,y,Math.max(0,r),0,Math.PI*2);c[stroke?'strokeStyle':'fillStyle']=color;c.lineWidth=width;c[stroke?'stroke':'fill']();}
function type(text,x,y,size,color=P.paper,align='left',weight=900){c.font=`${weight} ${size}px Inter`;c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=color;c.fillText(text,x,y);}
function mono(text,x,y,color=P.paper,align='left',size=19){c.font=`${size}px Mono`;c.textAlign=align;c.fillStyle=color;c.fillText(text,x,y);}
function fitted(text,x,y,width,size,color=P.paper,align='left',outline=false){c.save();c.font=`900 ${size}px Inter`;const actual=c.measureText(text).width;c.translate(x,y);c.scale(width/actual,1);c.textAlign=align;c.textBaseline='alphabetic';if(outline){c.strokeStyle=color;c.lineWidth=2.3;c.strokeText(text,0,0);}else{c.fillStyle=color;c.fillText(text,0,0);}c.restore();}
function shader(t,mode,pulse){gl.viewport(0,0,W,H);gl.uniform2f(u.resolution,W,H);gl.uniform1f(u.time,t);gl.uniform1f(u.pulse,pulse);gl.uniform1i(u.scene,mode);gl.drawArrays(gl.TRIANGLES,0,6);c.drawImage(glCanvas,0,0,W,H);}
function rail(t,label,color=P.paper){mono('FORM / FREQUENCY',72,62,color);mono(label,W-72,62,color,'right');line(72,89,W-72,89,color+'55',1);mono('MOTION STUDY   /   001',72,H-48,color);mono(`${String(Math.floor(t*60)).padStart(3,'0')}  :  900`,W-72,H-48,color,'right');rect(72,H-26,(W-144)*t/15,3,color);}
function cross(x,y,col,size=10){line(x-size,y,x+size,y,col,2);line(x,y-size,x,y+size,col,2);}
function dots(t,color=P.ink){c.fillStyle=color;c.globalAlpha=.15;for(let x=72;x<W;x+=48)for(let y=135;y<990;y+=48){c.fillRect(x+(Math.sin(y*.02+t)*2),y,2,2);}c.globalAlpha=1;}
function hero(t,pulse){
 shader(t,0,pulse);c.save();c.globalAlpha=.12;fitted('FORM',W/2,735,1740,550,P.paper,'center',true);c.restore();
 const reveal=ease(t/.6);c.save();c.translate(W/2,H/2);c.rotate(-.035*(1-reveal));c.scale(.88+.12*reveal,.88+.12*reveal);c.globalAlpha=reveal;fitted('FORM',0,122,1520,420,P.paper,'center');c.restore();
 // The inset remains a glossy, sculptural focal point behind the title.
 mono('IDEAS TAKE SHAPE.',W/2,844,P.lime,'center',24);for(let i=0;i<4;i++)cross(132+i*552,940,P.lime,8);
 rail(t,'01   /   SCULPT',P.paper);
}
function play(t,local,pulse){
 rect(0,0,W,H,P.paper);dots(t);
 const e=spring(local/.55),spread=ease(local/.5);
 const tile=440,top=300,xs=[230,740,1250],cols=[P.lime,P.coral,P.ink];
 for(let i=0;i<3;i++){
  c.save();const angle=(1-spread)*(-.28+i*.24)+.035*Math.sin(local*3+i);c.translate(xs[i]+tile/2,top+tile/2+(1-e)*(i%2?180:-180));c.rotate(angle);rect(-tile/2,-tile/2,tile,tile,cols[i]);
  c.save();c.rotate(local*(i%2?-.8:.6));
  if(i===0){for(let j=0;j<8;j++){c.rotate(Math.PI/4);rect(-26,-180,52,156,P.ink);}circle(0,0,72,P.lime);}
  if(i===1){const rr=125+18*pulse;circle(0,0,rr,P.paper);circle(0,0,rr*.49,P.coral);for(let j=0;j<4;j++){c.rotate(Math.PI/2);rect(-15,-205,30,80,P.ink);}}
  if(i===2){for(let j=0;j<6;j++){c.save();c.rotate(j*Math.PI/3);rect(-17,-180,34,360,P.teal);c.restore();}circle(0,0,70,P.ink);}
  c.restore();c.restore();
 }
 fitted('PLAY',76,256,1750,190,P.ink);mono('STRUCTURE + SURPRISE',960,865,P.ink,'center',24);line(72,926,1848,926,P.ink+'55',1);rail(t,'02   /   EXPLORE',P.ink);
}
function tunnel(t,local,pulse){
 shader(t,1,pulse);
 c.save();const e=ease(local/.6);c.globalAlpha=e;const out=smooth((local-2.35)/.6);c.translate(0,-out*50);
 fitted('FEEL THE',100,335,1700,225,P.paper);fitted('FREQUENCY',100,925,1700,228,P.paper);c.restore();
 const y=545;line(82,y,500,y,P.lime,2);line(1420,y,1838,y,P.lime,2);for(let i=0;i<35;i++){const h=8+72*Math.pow(.5+.5*Math.sin(i*.75-t*9),3)*(1+pulse*.3);rect(742+i*13,540-h/2,4,h,P.lime);}
 mono('120 BPM   /   SHAPE IS A SIGNAL',960,995,P.paper,'center',19);rail(t,'03   /   ACCELERATE');
}
function grid(t,local,pulse){
 rect(0,0,W,H,P.coral);const cols=8,rows=4,cell=178,left=248,top=198;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const delay=(x+y)*.045,scale=spring((local-delay)/.25),cx=left+x*cell,cy=top+y*cell;
  c.save();c.translate(cx,cy);c.rotate((local*.6+x*.3+y*.3));c.scale(Math.max(.001,scale),Math.max(.001,scale));
  if((x+y)%3===0){rect(-67,-67,134,134,P.ink);circle(0,0,35,P.coral);}else if((x+y)%3===1){circle(0,0,72,P.paper);circle(0,0,20+8*pulse,P.coral);}else{c.fillStyle=P.ink;c.beginPath();c.moveTo(-75,64);c.lineTo(0,-75);c.lineTo(75,64);c.closePath();c.fill();}c.restore();
 }
 const slide=ease(local/.38);rect(0,413,W,230,P.paper);fitted('BREAK THE GRID',72+(1-slide)*220,585,1776,167,P.ink);rail(t,'04   /   DISRUPT',P.ink);
}
function infinity(t,local,pulse){
 shader(t,2,pulse);c.save();c.translate(W/2,H/2);c.rotate(-.12+local*.1);c.scale(.78+.22*ease(local/.6),.78+.22*ease(local/.6));
 for(let i=0;i<3;i++){c.save();c.rotate(i*Math.PI/3);c.strokeStyle=i===1?P.coral+'70':P.teal+'50';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,640+i*60,175,0,0,Math.PI*2);c.stroke();c.restore();}c.restore();
 const e=ease(local/.6);c.save();c.globalAlpha=e;fitted('INFINITE',72,304,970,222,P.paper);fitted('POSSIBILITY.',1848,921,1420,224,P.paper,'right');c.restore();
 mono('NO TEMPLATES. JUST IMAGINATION.',72,972,P.teal);rail(t,'05   /   EVOLVE');
}
function finale(t,local,pulse){
 rect(0,0,W,H,P.ink);const e=ease(local/.45);
 // A radial curtain resolves from shader space into a crisp editorial lockup.
 if(local<.5){c.save();c.globalAlpha=1-e;shader(12,2,pulse);c.restore();}
 const lines=['MAKE','IT','MOVE.'],sizes=[314,300,340],ys=[410,685,990];
 for(let i=0;i<3;i++){
  const a=ease((local-i*.13)/.5),x=72+(1-a)*(i%2?-170:170);c.save();c.globalAlpha=a;fitted(lines[i],x,ys[i],i===1?530:1530,sizes[i],i===2?P.lime:P.paper);c.restore();
 }
 const r=98+8*pulse;c.save();c.translate(1625,625);c.rotate(local*.75);circle(0,0,r,P.coral);c.fillStyle=P.ink;c.beginPath();c.moveTo(-31,-47);c.lineTo(52,0);c.lineTo(-31,47);c.closePath();c.fill();c.restore();
 mono('GLSL  /  CANVAS  /  WEB AUDIO',1848,64,P.paper,'right',18);mono('FORM / FREQUENCY',72,64);line(72,89,1848,89,P.paper+'55',1);
 mono('DESIGNED IN CODE. FELT IN MOTION.',1848,1050,P.paper,'right',18);
 // Final eighth-second audio tail resolves on a held, readable frame.
}
window.renderAt=function(seconds){
 const t=clamp(seconds,0,15-1/60),pulse=Math.exp(-((t*2)%1)*7);c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;
 let label;
 if(t<2){hero(t,pulse);label='SCULPT';}else if(t<4){play(t,t-2,pulse);label='EXPLORE';}else if(t<7){tunnel(t,t-4,pulse);label='ACCELERATE';}else if(t<9){grid(t,t-7,pulse);label='DISRUPT';}else if(t<12){infinity(t,t-9,pulse);label='EVOLVE';}else{finale(t,t-12,pulse);label='RESOLVE';}
 // One-frame luma accents emphasize the beat-bound scene cuts.
 const sinceCut=Math.min(...[2,4,7,9,12].map(x=>t>=x?t-x:100));if(sinceCut<.033&&t>0){c.globalAlpha=.12*(1-sinceCut/.033);rect(0,0,W,H,P.paper);c.globalAlpha=1;}
 document.getElementById('clock').textContent=`${t.toFixed(2).padStart(5,'0')} / 15.00`;document.getElementById('scrub').value=t;
 return {time:t,scene:label,shaderError:gl.getError()};
};
window.ready=(async()=>{await document.fonts.load('900 32px Inter');await document.fonts.load('20px Mono');await document.fonts.ready;window.renderAt(0);const extension=gl.getExtension('WEBGL_debug_renderer_info');window.engineInfo={width:W,height:H,fps:60,duration:15,shaderSize:[W,H],renderer:extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),sceneCuts:[0,2,4,7,9,12,15],beatSeconds:.5};return window.engineInfo;})();
let playing=false,source,ac,animation;
document.getElementById('scrub').addEventListener('input',e=>{if(playing){source.stop();playing=false;cancelAnimationFrame(animation);}window.renderAt(Number(e.target.value));document.getElementById('play').textContent='Play with sound';});
document.getElementById('play').addEventListener('click',async()=>{
 const button=document.getElementById('play');if(playing){source.stop();cancelAnimationFrame(animation);playing=false;button.textContent='Play with sound';return;}
 button.disabled=true;button.textContent='Synthesizing…';await window.ready;ac=ac||new AudioContext();await ac.resume();const buffer=window.cachedScore||(window.cachedScore=await window.createScore());source=ac.createBufferSource();source.buffer=buffer;source.connect(ac.destination);source.start();const start=ac.currentTime;playing=true;button.disabled=false;button.textContent='Pause';
 function loop(){if(!playing)return;const t=ac.currentTime-start;window.renderAt(t);if(t>=15){playing=false;button.textContent='Play again';return;}animation=requestAnimationFrame(loop);}loop();
});
