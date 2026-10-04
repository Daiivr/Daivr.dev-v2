import { fillSpriteTexture } from "./seasonalArtTextures";

const ellipse = (ctx, x, y, rx, ry, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
const polygon = (ctx, points, fill) => { ctx.beginPath(); points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.fillStyle=fill;ctx.fill(); };
const gold = (ctx, x, width) => { const g=ctx.createLinearGradient(x-width/2,0,x+width/2,0);[[0,"#65513d"],[.17,"#c4944e"],[.36,"#ffe6a3"],[.46,"#b8843e"],[.73,"#e6c987"],[1,"#725136"]].forEach(([at,color])=>g.addColorStop(at,color));return g; };

export function drawWrappedGift(ctx, baseY, s, body, ribbon) {
  ctx.save(); ctx.translate(0,baseY);
  const w=s*1.18, h=s*.95, depth=s*.23;
  ellipse(ctx,1,1,w*.65,2.2,"#0006");
  ctx.fillStyle=body;ctx.fillRect(-w/2,-h,w,h);
  const shade=ctx.createLinearGradient(-w/2,-h,w/2,0);shade.addColorStop(0,"#fff3");shade.addColorStop(.5,"#fff0");shade.addColorStop(1,"#1d102f66");
  ctx.fillStyle=shade;ctx.fillRect(-w/2,-h,w,h);
  fillSpriteTexture(ctx,"linen",-w/2,-h,w,h,.8);
  polygon(ctx,[[w/2,-h],[w/2+depth,-h-depth],[w/2+depth,-depth],[w/2,0]],body);
  polygon(ctx,[[w/2,-h],[w/2+depth,-h-depth],[w/2+depth,-depth],[w/2,0]],"#100d304d");
  polygon(ctx,[[-w/2,-h],[w/2,-h],[w/2+depth,-h-depth],[-w/2+depth,-h-depth]],body);
  polygon(ctx,[[-w/2,-h],[w/2,-h],[w/2+depth,-h-depth],[-w/2+depth,-h-depth]],"#fff2");
  ctx.strokeStyle="#fff3";ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(w/2,-h);ctx.lineTo(w/2,0);ctx.moveTo(w/2,-h*.3);ctx.lineTo(w/2+depth,-h*.48);ctx.stroke();
  // Foil print and a separate lid with a narrow shadow beneath its lip.
  ctx.fillStyle="#fce7b7b3";
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){const x=-w*.35+col*w*.35,y=-h*.75+row*h*.3;polygon(ctx,[[x,y-1],[x+.7,y],[x,y+1],[x-.7,y]],"#fce7b799");}
  ctx.fillStyle="#17102b55";ctx.fillRect(-w/2,-h+s*.14,w,s*.05);
  ctx.fillStyle=body;ctx.fillRect(-w/2-1,-h,w+2,s*.13);
  ctx.fillStyle="#fff3";ctx.fillRect(-w/2-1,-h,w+2,.7);
  ctx.fillStyle=ribbon;ctx.fillRect(-s*.1,-h,s*.2,h);ctx.fillRect(-w/2,-h*.48,w,s*.17);
  polygon(ctx,[[-s*.1,-h],[s*.1,-h],[s*.1+depth,-h-depth],[-s*.1+depth,-h-depth]],ribbon);
  ctx.fillStyle="#fff5";ctx.fillRect(-s*.09,-h,.6,h);ctx.fillRect(-w/2,-h*.48,w,.55);
  // Satin loops have dark hollow centers, rolled edges and forked tails.
  ctx.save();ctx.translate(depth*.5,-h-depth*.48);
  for(const side of [-1,1]){
    ctx.save();ctx.scale(side,1);
    const bow=new Path2D(`M0 0Q${-s*.5} ${-s*.48} ${-s*.43} ${-s*.12}Q${-s*.36} ${s*.09} 0 0Z`);
    ctx.fillStyle=ribbon;ctx.fill(bow);ctx.strokeStyle="#fff5";ctx.lineWidth=.6;ctx.stroke(bow);
    ctx.strokeStyle="#25123277";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-s*.32,-s*.18);ctx.quadraticCurveTo(-s*.2,-s*.22,0,0);ctx.stroke();
    polygon(ctx,[[0,0],[-s*.07,s*.38],[-s*.17,s*.29],[-s*.28,s*.35],[-s*.16,s*.02]],ribbon);
    ctx.restore();
  }
  ellipse(ctx,0,0,s*.095,s*.075,ribbon);
  ctx.restore();
  ctx.strokeStyle="#dac8a4";ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(s*.12,-h);ctx.quadraticCurveTo(s*.4,-h*.8,s*.34,-h*.62);ctx.stroke();
  polygon(ctx,[[s*.24,-h*.68],[s*.52,-h*.6],[s*.47,-h*.37],[s*.2,-h*.44]],"#e9d9b9");
  ctx.strokeStyle="#926f6880";ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(s*.27,-h*.55);ctx.lineTo(s*.43,-h*.51);ctx.stroke();
  ctx.restore();
}

export function drawFrostedTier(ctx,x,baseY,w,h,body,seed){
  const ry=Math.max(2,w*.075),top=baseY-h;
  ctx.save();
  const cream=ctx.createLinearGradient(x-w/2,0,x+w/2,0);cream.addColorStop(0,"#a88298");cream.addColorStop(.16,body);cream.addColorStop(.42,"#fff1e6");cream.addColorStop(.78,body);cream.addColorStop(1,"#ad829e");
  ctx.beginPath();ctx.moveTo(x-w/2,top);ctx.lineTo(x-w/2,baseY);ctx.ellipse(x,baseY,w/2,ry,0,Math.PI,0,true);ctx.lineTo(x+w/2,top);ctx.closePath();ctx.fillStyle=cream;ctx.fill();
  ctx.save();ctx.clip();fillSpriteTexture(ctx,"crumb",x-w/2,top,w,h+ry,.55);
  ctx.strokeStyle="#c69aab66";ctx.lineWidth=.6;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x,baseY-h*(.2+i*.23),w*.5,ry,0,0,Math.PI);ctx.stroke();}ctx.restore();
  ellipse(ctx,x,top,w/2,ry,"#fff1df");
  ctx.strokeStyle="#c99aa466";ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(x,top,w*.45,ry*.65,0,0,Math.PI*2);ctx.stroke();
  // Ganache folds follow the curved front, with individual piped rosettes.
  const dots=Math.max(6,Math.floor(w/4));
  for(let i=0;i<=dots;i++){
    const a=i/dots*Math.PI,px=x+Math.cos(a)*w*.48,py=top+Math.sin(a)*ry;
    const drip=h*(.12+.1*(.5+.5*Math.sin(seed+i*2.3)));
    ctx.strokeStyle="#f7e8d6";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py+drip);ctx.stroke();
    ellipse(ctx,px,baseY+Math.sin(a)*ry,1.3,1.1,"#c891a7");
    ellipse(ctx,px-.3,baseY+Math.sin(a)*ry-.5,1.1,.85,"#fff0dc");
    if(i%3===0){ellipse(ctx,x+(px-x)*.85,top+Math.sin(a)*ry*.5-1.3,1.25,1.1,"#b65272");ellipse(ctx,x+(px-x)*.85-.3,top+Math.sin(a)*ry*.5-1.7,.35,.3,"#fbd5c9");}
  }
  ctx.restore();
}

export function drawPipedCupcake(ctx,cup,x,y,colors){
  const s=cup.size;
  ctx.save();ctx.translate(x,y);
  ellipse(ctx,1,1,s*.8,1.8,"#0005");
  const wrap=new Path2D(`M${-s*.85} ${-s}L${s*.85} ${-s} ${s*.56} 0 ${-s*.56} 0Z`);
  ctx.fillStyle=colors[cup.wrap];ctx.fill(wrap);ctx.save();ctx.clip(wrap);
  fillSpriteTexture(ctx,"linen",-s,-s,s*2,s,.7);
  for(let fold=-3;fold<=3;fold++){ctx.strokeStyle=fold%2?"#fff5":"#30233d66";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fold*s*.23,-s);ctx.lineTo(fold*s*.15,0);ctx.stroke();}ctx.restore();
  for(let tier=0;tier<4;tier++){
    const width=s*(.82-tier*.18),cy=-s*(1+tier*.31);
    const icing=ctx.createLinearGradient(-width,cy-width*.4,width,cy+width*.3);icing.addColorStop(0,"#fff2dc");icing.addColorStop(.42,"#f8dbe5");icing.addColorStop(1,"#b8799e");
    ellipse(ctx,0,cy,width,width*.43,icing);
    ctx.strokeStyle="#fff4d7a6";ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(-.5,cy-.4,width*.85,width*.26,0,Math.PI,Math.PI*1.9);ctx.stroke();
  }
  ellipse(ctx,0,-s*2.1,2.1,2.3,"#be4564");ellipse(ctx,-.7,-s*2.1-.8,.65,.7,"#ffe3c7");
  ctx.strokeStyle="#717448";ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(0,-s*2.2);ctx.quadraticCurveTo(-2,-s*2.55,1,-s*2.5);ctx.stroke();
  for(let i=0;i<7;i++){ctx.save();ctx.translate(Math.sin(i*2.4)*s*.55,-s*(1.2+i*.09));ctx.rotate(i*1.7);ctx.fillStyle=colors[i%colors.length];ctx.fillRect(-1,-.35,2,.7);ctx.restore();}
  ctx.restore();
}

export function drawEngravedTrophy(ctx,trophy,x,y){
  const s=trophy.size/36;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ellipse(ctx,1,1,18,3,"#0006");
  const brass=gold(ctx,0,30);
  // Curved cast handles have their own dark recess and reflected rim.
  for(const side of [-1,1]){ctx.save();ctx.scale(side,1);ctx.beginPath();ctx.moveTo(10,-37);ctx.bezierCurveTo(30,-45,26,-16,10,-21);ctx.strokeStyle="#604632";ctx.lineWidth=4.4;ctx.stroke();ctx.strokeStyle=brass;ctx.lineWidth=2.6;ctx.stroke();ctx.restore();}
  const cup=new Path2D("M-15-42Q-15-19-5-16L-4-10 4-10 5-16Q15-19 15-42Z");
  ctx.fillStyle=brass;ctx.fill(cup);ctx.save();ctx.clip(cup);fillSpriteTexture(ctx,"metal",-16,-43,32,34,.65);ctx.restore();
  ellipse(ctx,0,-42,15,3.8,"#e8c88b");ellipse(ctx,0,-42.5,12.5,2.4,"#6d5537");ctx.strokeStyle="#ffe7afa6";ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(0,-42,14,3.4,0,0,Math.PI);ctx.stroke();
  ctx.fillStyle=brass;ctx.fillRect(-3,-16,6,9);ellipse(ctx,0,-8,10,2.2,brass);
  // A stamped medallion and individual laurel leaves on the bowl.
  ellipse(ctx,0,-29,5.5,7,"#b48b4f");ctx.strokeStyle="#ffe5a294";ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(0,-29,5.5,7,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#5a4334";ctx.font="bold 7px Georgia";ctx.textAlign="center";ctx.fillText("II",0,-26.5);
  for(const side of [-1,1])for(let leaf=0;leaf<4;leaf++){ctx.save();ctx.translate(side*(7+Math.sin(leaf*.8)*2),-23-leaf*3);ctx.rotate(side*(.5+leaf*.14));ellipse(ctx,0,0,1,2,"#fff0b3a6");ctx.restore();}
  polygon(ctx,[[-17,-6],[13,-6],[17,-3],[17,0],[-17,0]],"#302b30");ctx.fillStyle="#50454a";ctx.fillRect(-17,-6,30,2);
  ctx.fillStyle=brass;ctx.fillRect(-9,-4.5,18,3);ctx.fillStyle="#584430";ctx.font="2.4px monospace";ctx.fillText("ANNIVERSARY",0,-2.2);
  ctx.restore();
}

export function drawCelebrationBottle(ctx,bottle,x,y,now,reduced){
  const s=bottle.size/32;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ellipse(ctx,0,0,10,2,"#0007");
  const shape=new Path2D("M-8-1L-8-27Q-8-32-3-35L-3-46 3-46 3-35Q8-32 8-27L8-1Q0 2-8-1Z");
  const glass=ctx.createLinearGradient(-8,0,8,0);[[0,"#172722"],[.16,"#59765c"],[.3,"#244e3a"],[.7,"#152c26"],[.9,"#465b40"],[1,"#9db481"]].forEach(([a,c])=>glass.addColorStop(a,c));
  ctx.fillStyle=glass;ctx.fill(shape);ctx.save();ctx.clip(shape);fillSpriteTexture(ctx,"glass",-9,-47,18,49,.4);ctx.restore();
  ctx.strokeStyle="#c8e4b47a";ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-5,-3);ctx.lineTo(-5,-26);ctx.quadraticCurveTo(-5,-30,-1,-34);ctx.stroke();
  const foil=gold(ctx,0,7);ctx.fillStyle=foil;ctx.fillRect(-3.7,-44,7.4,10);
  ctx.strokeStyle="#765c3680";ctx.lineWidth=.5;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-3,-43+i*2);ctx.lineTo(3,-41+i*2);ctx.stroke();}
  polygon(ctx,[[-6.5,-26],[6.5,-26],[6.5,-13],[-6.5,-13]],"#e9dec0");fillSpriteTexture(ctx,"linen",-6.5,-26,13,13,.5);
  ctx.strokeStyle="#a5874d";ctx.lineWidth=.6;ctx.strokeRect(-5.5,-25,11,11);
  ellipse(ctx,0,-21,2.6,2.9,"#b99c60");ctx.fillStyle="#684d33";ctx.font="3.8px Georgia";ctx.textAlign="center";ctx.fillText("II",0,-19.8);ctx.font="2px monospace";ctx.fillText("CUVÉE DAI",0,-16);
  if(now<bottle.poppedUntil){ellipse(ctx,0,-46,2.8,.9,"#071610");}else{ctx.fillStyle=foil;ctx.fillRect(-3.8,-49,7.6,5);ctx.strokeStyle="#fff1b7ad";ctx.lineWidth=.6;ctx.strokeRect(-3.8,-49,7.6,5);}
  if(!reduced&&now<bottle.foamUntil){const age=1-(bottle.foamUntil-now)/900;for(let i=0;i<8;i++){ctx.globalAlpha=Math.max(0,1-age);ellipse(ctx,Math.sin(i*4.1)*age*11,-47-age*(15+i*3),.7+i%3*.3,1,"#fff0c3");}ctx.globalAlpha=1;}
  // A tiny stemmed glass beside the bottle, with a curved meniscus.
  ctx.translate(17,0);ctx.strokeStyle="#d2e6e3a6";ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(-4,-25);ctx.bezierCurveTo(-5,-10,-2,-10,0,-10);ctx.bezierCurveTo(2,-10,5,-10,4,-25);ctx.stroke();
  polygon(ctx,[[-3.7,-20],[3.7,-20],[2,-12],[0,-10],[-2,-12]],"#d8b46466");ellipse(ctx,0,-20,3.6,1,"#fae5aa6b");
  ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(0,-1);ctx.moveTo(-4,0);ctx.quadraticCurveTo(0,-2,4,0);ctx.stroke();
  ctx.fillStyle="#fff3bd";ctx.fillRect(-1,-17,.6,.7);ctx.fillRect(1,-14,.5,.6);
  ctx.restore();
}
