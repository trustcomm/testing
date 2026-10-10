/* Original signed-distance fields and optical tunnel. No external visual assets. */
window.fragmentSource = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float pulse;
uniform int scene;
out vec4 frag;
const float PI=3.14159265359;
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float shape(vec3 p){
  p.xz=rot(time*.39)*p.xz;
  p.xy=rot(.33+time*.24)*p.xy;
  if(scene==0){
    p.xy=rot(p.z*.52+time*.14)*p.xy;
    vec2 q=vec2(length(p.xy)-1.17,p.z);
    float a=atan(p.y,p.x);
    return length(q)-(.37+.075*sin(a*3.+time*1.7));
  }
  p.yz=rot(p.x*.72-time*.19)*p.yz;
  float a=atan(p.y,p.x);
  float ring=length(vec2(length(p.xy)-1.15,p.z))-.32;
  float orbit=length(p-vec3(1.1*cos(time*.9),1.1*sin(time*.9),.32*sin(time)))-.58;
  float k=.55;float h=clamp(.5+.5*(orbit-ring)/k,0.,1.);
  return mix(orbit,ring,h)-k*h*(1.-h);
}
vec3 normalAt(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));}
vec3 palette(float t){return .5+.5*cos(6.283185*(vec3(.0,.31,.54)+t));}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;
 vec3 col=vec3(.025,.041,.047);
 if(scene==1){
   vec2 p=uv; p=rot(.16*sin(time*.5))*p;
   float r=length(p); float angle=atan(p.y,p.x);
   float depth=1./max(r,.045);
   float z=depth*.6-time*1.4;
   float twist=angle+depth*.09+time*.18;
   float lanes=pow(.5+.5*cos(twist*12.+.5*sin(z)),15.);
   float bands=pow(.5+.5*cos(z*7.),22.);
   float ribs=pow(.5+.5*cos(twist*6.-z),28.);
   vec3 tint=mix(vec3(.20,.95,.73),vec3(1.,.30,.22),.5+.5*sin(z*.65+angle));
   col=vec3(.02,.035,.045)+tint*(lanes*.40+bands*.8+ribs*.45)*(smoothstep(.03,.40,r));
   col+=vec3(.38,.55,.45)*pow(1.-smoothstep(.0,.14,r),3.)*.35;
   col*=.55+.5*(1.-smoothstep(.2,1.3,r));
 }else{
   vec3 ro=vec3(0.,0.,5.1); vec3 rd=normalize(vec3(uv,-2.65));
   float d=0.;float hit=0.;vec3 p;
   for(int i=0;i<64;i++){p=ro+rd*d;float s=shape(p);if(s<.002){hit=1.;break;}d+=s*.78;if(d>9.)break;}
   if(hit>.5){
     vec3 n=normalAt(p);vec3 view=-rd;vec3 ref=reflect(rd,n);
     float diff=max(dot(n,normalize(vec3(-.5,1.,2.))),0.);
     float rim=pow(1.-max(dot(n,view),0.),2.6);
     float highlight=pow(max(dot(ref,normalize(vec3(-.9,1.2,2.))),0.),35.);
     float strip=pow(.5+.5*sin(ref.y*7.+ref.x*3.+time*.3),6.);
     vec3 chroma=mix(vec3(.05,.85,.68),vec3(.86,1.,.61),clamp(n.y*.5+.5,0.,1.));
     if(scene==2)chroma=mix(vec3(.16,.33,.97),vec3(1.,.33,.2),.5+.5*sin(p.y*2.2+p.x+time*.3));
     col=chroma*(.12+diff*.55)+strip*vec3(.60,.89,.79)*.7+highlight*vec3(1.,.94,.80)*1.3+rim*vec3(.6,.92,.65)*.7;
     col*=.9+.1*pulse;
   }else{
     float halo=exp(-length(uv)*3.);col+=vec3(.028,.07,.046)*halo;
     float grid=step(.986,fract((uv.x+.9)*22.))*step(.94,fract((uv.y+.5)*22.));col+=grid*.065;
   }
 }
 col=1.-exp(-col*1.25);col=pow(max(col,0.),vec3(.91));
 float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+floor(time*60.)*.04)*43758.5453)-.5;
 col+=grain*.012;frag=vec4(col,1.);
}`;
