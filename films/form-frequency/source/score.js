/* All sound is synthesized in Web Audio. Seeded noise is generated in memory. */
window.createScore = async function(){
 const SR=48000,DURATION=15,ctx=new OfflineAudioContext(2,SR*DURATION,SR);
 const mix=ctx.createGain();mix.gain.value=.65;
 const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-14;compressor.knee.value=12;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.15;
 mix.connect(compressor);compressor.connect(ctx.destination);
 const delay=ctx.createDelay(.5);delay.delayTime.value=.1875;const feedback=ctx.createGain();feedback.gain.value=.22;const wet=ctx.createGain();wet.gain.value=.16;mix.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(compressor);
 let seed=7241;const noise=ctx.createBuffer(1,SR*2,SR);const nd=noise.getChannelData(0);for(let i=0;i<nd.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;nd[i]=seed/2147483648-1;}
 function env(g,t,d,v){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+.004);g.gain.exponentialRampToValueAtTime(.0001,Math.min(t+d,14.99));}
 function tone(freq,t,d,v,type='sine',pan=0){const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();o.type=type;o.frequency.value=freq;env(g,t,d,v);p.pan.value=pan;o.connect(g);g.connect(p);p.connect(mix);o.start(t);o.stop(Math.min(t+d+.02,15));}
 function noiseHit(t,d,v,hz,pan=0){const b=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),p=ctx.createStereoPanner();b.buffer=noise;f.type='highpass';f.frequency.value=hz;env(g,t,d,v);p.pan.value=pan;b.connect(f);f.connect(g);g.connect(p);p.connect(mix);b.start(t);b.stop(Math.min(t+d,15));}
 function kick(t,v=1){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(158,t);o.frequency.exponentialRampToValueAtTime(44,t+.14);env(g,t,.34,.78*v);o.connect(g);g.connect(mix);o.start(t);o.stop(t+.36);tone(880,t,.022,.08*v,'triangle');}
 function snare(t){noiseHit(t,.17,.24,1100);tone(180,t,.10,.16,'triangle');}
 // D minor / Bb / F / C. Thirty half-second beats, with a final held resolution.
 const roots=[73.416,58.27,87.307,65.406];
 for(let b=0;b<30;b++){
   const t=b*.5;
   if(b<28){kick(t,b<4?.85:1);if(b%2===1)snare(t);}
   if(b<28)for(let h=0;h<4;h++)noiseHit(t+h*.125,.025+(h===2?.018:0),h===0?.055:.032,6500,(h%2?1:-1)*.42);
   const root=roots[Math.min(3,Math.floor(b/8))];
   if(b<28){tone(root,t+.02,.26,.21,'sine');tone(root*2,t+.26,.17,.085,'triangle');}
   if(b>=4&&b<28){
     const ratios=[2,2.997,4,5.993,4,2.997,2,3.564];
     for(let s=0;s<2;s++){const j=(b*2+s)%8;const f=root*ratios[j];tone(f,t+s*.25+.008,.19,.075,'triangle',j%2?.55:-.55);tone(f*2.001,t+s*.25+.011,.12,.018,'sine',j%2?-.4:.4);}
   }
 }
 // Filtered swells arrive exactly on the 2, 4, 7, 9 and 12-second visual cuts.
 for(const cut of [2,4,7,9,12]){
   const start=cut-.4,b=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();b.buffer=noise;f.type='bandpass';f.Q.value=.75;f.frequency.setValueAtTime(350,start);f.frequency.exponentialRampToValueAtTime(10000,cut);g.gain.setValueAtTime(.001,start);g.gain.exponentialRampToValueAtTime(.16,cut-.012);g.gain.exponentialRampToValueAtTime(.0001,cut+.04);b.connect(f);f.connect(g);g.connect(mix);b.start(start);b.stop(cut+.05);tone(55,cut,.5,.33,'sine');
 }
 for(const f of [146.832,220,293.664,349.228]){tone(f,14, .96,.065,'triangle',f<250?-.25:.25);tone(f*2,14.002,.8,.02,'sine');}
 const buffer=await ctx.startRendering();
 for(let c=0;c<2;c++){const a=buffer.getChannelData(c);for(let i=0;i<a.length;i++){const t=i/SR;const fade=Math.min(1,t/.006,(15-t)/.16);a[i]=Math.tanh(a[i]*1.12)*Math.max(0,fade);}}
 return buffer;
};
window.waveBytes=function(buffer){
 const count=buffer.length,bytes=new ArrayBuffer(44+count*4),v=new DataView(bytes);const str=(off,s)=>{for(let i=0;i<s.length;i++)v.setUint8(off+i,s.charCodeAt(i));};
 str(0,'RIFF');v.setUint32(4,bytes.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,buffer.sampleRate,true);v.setUint32(28,buffer.sampleRate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,count*4,true);
 const a=buffer.getChannelData(0),b=buffer.getChannelData(1);for(let i=0;i<count;i++){v.setInt16(44+i*4,Math.round(Math.max(-1,Math.min(1,a[i]))*32767),true);v.setInt16(46+i*4,Math.round(Math.max(-1,Math.min(1,b[i]))*32767),true);}return new Uint8Array(bytes);
};
