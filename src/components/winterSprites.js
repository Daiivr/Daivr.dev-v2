import { fillSpriteTexture } from "./seasonalArtTextures";

const random = n => { const v=Math.sin(n*127.1+37)*43758.54;return v-Math.floor(v); };
const ellipse = (ctx,x,y,rx,ry,fill) => {ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};

export function drawSnowCrystal(ctx,flake){
  const radius=Math.min(8.5,flake.radius*3.3);
  ctx.save();ctx.translate(flake.x,flake.y);ctx.rotate(flake.rot);ctx.globalAlpha=flake.opacity;
  ctx.lineCap="round";
  for(let arm=0;arm<6;arm++){
    ctx.save();ctx.rotate(arm*Math.PI/3);
    ctx.strokeStyle="#a2cadab3";ctx.lineWidth=1.25;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-radius);ctx.stroke();
    ctx.strokeStyle="#f0fcff";ctx.lineWidth=.6;
    ctx.beginPath();ctx.moveTo(-.2,0);ctx.lineTo(-.2,-radius);ctx.stroke();
    for(const at of [.42,.72]){
      const y=-radius*at,length=radius*(at<.5?.26:.22);
      ctx.beginPath();ctx.moveTo(-length,y-length*.6);ctx.lineTo(0,y);ctx.lineTo(length,y-length*.6);ctx.stroke();
    }
    if(radius>5){ctx.fillStyle="#edfcffbf";ctx.beginPath();ctx.moveTo(0,-radius);ctx.lineTo(.65,-radius*.82);ctx.lineTo(0,-radius*.7);ctx.lineTo(-.65,-radius*.82);ctx.fill();}
    ctx.restore();
  }
  ctx.beginPath();
  for(let i=0;i<6;i++){const a=i*Math.PI/3,px=Math.sin(a)*radius*.25,py=Math.cos(a)*radius*.25;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
  ctx.closePath();ctx.fillStyle="#d1edf052";ctx.fill();ctx.strokeStyle="#f5ffffc4";ctx.lineWidth=.55;ctx.stroke();
  ellipse(ctx,-.35,-.35,.65,.65,"#fff");
  ctx.restore();
}

export function drawWinterLedge(ctx,surface,now,ox,oy,reduced){
  const seed=surface.pile.seed;
  if(surface.width<240||random(seed*7.3)>.42)return;
  const x=surface.left+surface.width*(.18+random(seed*4.1)*.6)+ox;
  const y=surface.top+oy-2;
  ctx.save();ctx.translate(x,y);
  const lantern=random(seed*9.7)>.48;
  // Evergreen sprig: individual lit needles, a woody stem, and a scaly cone.
  ctx.save();ctx.translate(lantern?-15:0,0);ctx.rotate(-.1);
  ctx.strokeStyle="#635d43";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(-23,0);ctx.quadraticCurveTo(0,-7,27,-2);ctx.stroke();
  for(let leaf=0;leaf<15;leaf++){
    const lx=-21+leaf*3.1,ly=-4-Math.sin(leaf/15*Math.PI)*2;
    for(const side of [-1,1]){
      const length=6+random(seed+leaf*3)*5;
      ctx.strokeStyle=leaf%3?"#507d70":"#83aa99";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx-4,ly+side*length*.65);ctx.stroke();
      ctx.strokeStyle="#c4d9c261";ctx.lineWidth=.45;ctx.stroke();
    }
  }
  ctx.save();ctx.translate(-3,-10);ctx.rotate(.4);
  ellipse(ctx,0,0,5,9,"#5c4b3e");
  for(let row=0;row<5;row++)for(let col=0;col<3;col++){
    const cx=(col-1)*3+(row%2)*1.2,cy=-6+row*3;
    ctx.fillStyle=row%2?"#ab8a62":"#806047";ctx.beginPath();ctx.moveTo(cx-2,cy);ctx.quadraticCurveTo(cx,cy+4,cx+2,cy);ctx.fill();
    ctx.strokeStyle="#d2b18b8c";ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(cx-1.6,cy+.3);ctx.quadraticCurveTo(cx,cy+2,cx+1.6,cy+.3);ctx.stroke();
  }
  ellipse(ctx,-1,-6,3.7,1.4,"#e0edf0");ctx.restore();
  ctx.strokeStyle="#e0f1f0d9";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-22,-7);ctx.quadraticCurveTo(-13,-11,-9,-8);ctx.moveTo(8,-9);ctx.quadraticCurveTo(17,-11,23,-6);ctx.stroke();
  ctx.restore();
  if(lantern){
    ctx.translate(14,0);
    const flick=reduced ? .75 : .72+Math.sin(now/330+seed)*.12+Math.sin(now/110+seed)*.06;
    const glow=ctx.createRadialGradient(0,-16,2,0,-16,32);glow.addColorStop(0,`rgba(255,201,119,${.2*flick})`);glow.addColorStop(1,"#ffc96b00");
    ellipse(ctx,0,-16,32,32,glow);
    ctx.strokeStyle="#849b9b";ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,-35,4,Math.PI,0);ctx.stroke();
    const iron=ctx.createLinearGradient(-9,0,9,0);iron.addColorStop(0,"#334b52");iron.addColorStop(.35,"#8da9ac");iron.addColorStop(.55,"#45666a");iron.addColorStop(1,"#213a43");
    ctx.fillStyle=iron;ctx.beginPath();ctx.moveTo(-11,-29);ctx.lineTo(-5,-35);ctx.lineTo(5,-35);ctx.lineTo(11,-29);ctx.closePath();ctx.fill();
    const glass=ctx.createLinearGradient(-7,-25,8,-3);glass.addColorStop(0,"#d7f8f14d");glass.addColorStop(.45,"#a7783d73");glass.addColorStop(.6,"#ffe2a19c");glass.addColorStop(1,"#728d9833");
    ctx.fillStyle=glass;ctx.fillRect(-8,-27,16,24);
    ctx.save();ctx.beginPath();ctx.rect(-8,-27,16,24);ctx.clip();fillSpriteTexture(ctx,"frost",-8,-27,16,24,.5);ctx.restore();
    ctx.fillStyle="#d1c2a2";ctx.fillRect(-2,-13,4,10);ellipse(ctx,0,-16,1.6,3.4*flick,"#ffc367");ellipse(ctx,-.3,-15.6,.65,1.7,"#fff1c6");
    ctx.fillStyle=iron;ctx.fillRect(-10,-3,20,3);ctx.fillRect(-10,-29,20,2);ctx.fillRect(-8,-27,1.6,24);ctx.fillRect(6.4,-27,1.6,24);
    ctx.strokeStyle="#8fa9a4";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-7,-26);ctx.lineTo(7,-3);ctx.moveTo(7,-26);ctx.lineTo(-7,-3);ctx.stroke();
    ctx.strokeStyle="#edfafa9c";ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(-4,-24);ctx.lineTo(-4,-16);ctx.stroke();
    ctx.fillStyle="#e5f1f0";ctx.beginPath();ctx.moveTo(-11,-30);ctx.quadraticCurveTo(-6,-38,0,-35);ctx.quadraticCurveTo(6,-38,11,-30);ctx.quadraticCurveTo(4,-28,-1,-30);ctx.quadraticCurveTo(-5,-28,-11,-30);ctx.fill();
    ellipse(ctx,0,0,12,1.5,"#cae6ea");
  }
  ctx.restore();
}
