// Picks the render hardware: the user's GPU whenever it really works, the CPU only as a fallback.
import {spawnSync} from 'node:child_process';

// Discrete cards first, so a laptop with both uses the stronger chip.
const ENCODERS=[
  {name:'h264_nvenc',label:'NVIDIA GPU',args:['-preset','p5','-tune','hq','-rc','vbr','-cq','19','-b:v','0','-pix_fmt','yuv420p']},
  {name:'h264_amf',label:'AMD GPU',args:['-quality','quality','-rc','cqp','-qp_i','19','-qp_p','21','-pix_fmt','yuv420p']},
  {name:'h264_qsv',label:'Intel GPU',args:['-preset','slower','-global_quality','19','-pix_fmt','nv12']},
  {name:'h264_videotoolbox',label:'Apple GPU',args:['-allow_sw','0','-q:v','65','-pix_fmt','yuv420p']},
];
const CPU={name:'libx264',label:'CPU',gpu:false,args:['-preset','medium','-crf','18','-pix_fmt','yuv420p']};

// FFmpeg lists encoders it was built with, not ones the computer has, so each one must encode a test clip.
export function pickEncoder(ffmpeg,forceCpu=false){
  if(forceCpu)return CPU;
  const listed=spawnSync(ffmpeg,['-hide_banner','-encoders'],{encoding:'utf8'}).stdout||'';
  for(const e of ENCODERS){
    if(!listed.includes(e.name))continue;
    const test=spawnSync(ffmpeg,['-hide_banner','-v','error','-f','lavfi','-i','color=black:s=320x240:r=30','-frames:v','5','-c:v',e.name,...e.args,'-f','null','-'],{timeout:20000});
    if(test.status===0)return {...e,gpu:true};
  }
  return CPU;
}

const ANGLE={win32:'d3d11',darwin:'metal',linux:'vulkan'}[process.platform]||'gl';
const GPU_ARGS=[`--use-angle=${ANGLE}`,'--ignore-gpu-blocklist','--enable-gpu-rasterization','--force_high_performance_gpu'];

// Asks Chromium what actually draws its graphics; empty means WebGL is unavailable.
async function drawnBy(browser){
  const page=await browser.newPage();
  try{
    return await page.evaluate(()=>{
      const gl=document.createElement('canvas').getContext('webgl');
      const info=gl&&gl.getExtension('WEBGL_debug_renderer_info');
      return info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):'';
    });
  }finally{await page.close();}
}

// Returns {browser,gpu,renderer}. launch(options) wraps chromium.launch with the project's settings.
export async function launchBrowser(launch,log,forceCpu=false){
  if(!forceCpu)for(const options of [{channel:'chromium'},{}]){
    let browser;
    try{
      browser=await launch({...options,args:GPU_ARGS});
      const renderer=await drawnBy(browser);
      if(renderer&&!/swiftshader|llvmpipe|software|basic render|warp/i.test(renderer))return {browser,gpu:true,renderer};
      log(`Chromium${options.channel?'':' headless shell'} has no GPU access (${renderer||'no WebGL'})`);
    }catch(e){log(`Chromium${options.channel?'':' headless shell'} GPU launch failed: ${e.message.split('\n')[0]}`);}
    if(browser)await browser.close();
  }
  return {browser:await launch({}),gpu:false,renderer:'software (CPU)'};
}
