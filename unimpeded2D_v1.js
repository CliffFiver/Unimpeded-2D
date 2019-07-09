/* ||
Библиотека "unimpeded2D". 
Версия 1. 
Автор - Дима Горин.

 */
"use strict"

//meta tags. May be its do something
document.head.innerHTML+='<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />'+
'<meta name="Cache-Control" content="no-cache,no-store,must-revalidate,max-age=0"/>';

window.U2D={};

(function(){ 
window.AudioContext=window.AudioContext||window.webkitAudioContext; 
window.onorientationchange=function(){ }

var camera={
X:0,
zoom:10,
Y:0,
angle:0
}
var setting={
fps:60,
resolution:400,
}


 try{ 
var isRunning=false,
sourceCache={},
loadedStatus={},
animData={},
sourceToLoad=0,
maxSourceToLoad=0,
onLoadCallbacks=[],
canvas,ctx,lastResolution=-1,
ctxWidth=0,ctxHeight=0,
emptyTile,
entityesList=[],
tilesList=[],
collidePairs=[],
globalRunPeriod=0,
renderStack=0,
reportsCount=3,
onPause=false,
locationSizeX=0,
locationSizeY=0,
miniMap,
icons=[],
soundsToUpdate=[],
cloneMode=false;

function Canvas(){
return document.createElement("canvas");
}


function updateSounds(){
for(var i=0;i<soundsToUpdate.length;i++){
var ent=soundsToUpdate[i].entity;
if(!ent){ ent={X:-100,Y:-100}; }
var volume,
snd=soundsToUpdate[i].sound,
maxDist=soundsToUpdate[i].distance,
dist=distance(ent.X,ent.Y,camera.X,camera.Y);

volume=100-dist/(maxDist/100);

if(dist>maxDist){ volume=0; }
ctx.fillText(""+volume,800,50);
snd.setVolume(volume);
}
}

function drawMiniMap(fisX,fisY,size){
var c=miniMap.elem.getContext("2d"),
width=miniMap.elem.width,
height=miniMap.elem.height;
 
if(miniMap.rotating&&miniMap.lastAngle!=camera.angle){
 var e=miniMap.elem,
 rot="rotate("+camera.angle+"deg)";
 e.style.transform=rot;
 e.style.webkitTransform=rot;
 e.style.mozTransform=rot;
 e.style.oTransform=rot;
 e.style.msTransform=rot;
miniMap.lastAngle=camera.angle; 
 }
 //location
var num=0,
data=c.createImageData(size*2+1,size*2+1);
for(var y=-size;y<=size;y++){
for(var x=-size;x<=size;x++){
var col= getTile(fisX+x,fisY+y).miniMapColor;
data.data[num]=col[0];
data.data[num+1]=col[1];
data.data[num+2]=col[2];
data.data[num+3]=255;
num+=4;
 }}
 
var c2=new Canvas();
c2.width=size*2+1;
c2.height=size*2+1;
c2.getContext("2d").putImageData(data,0,0);
c.drawImage(c2,0,0,width,height);
 //icons
 var first;
for(var i=0;i<icons.length;i++){
var ic=icons[i], 
pos=ic.flowing?calcIconPos(ic.referal,size):ic.referal,
pt=projectMMPoint(pos.X,pos.Y),
img=U2D.getSource(ic.image);
 if(!img){ return; }
c.save();
c.translate(pt.left,pt.top);
c.rotate(-camera.angle*Math.PI/180);
var sz=width/6;
c.drawImage(img,-sz/2,-sz/2,sz,sz);
c.restore();
}

}

function calcIconPos(ref,sz){
var angle=angleToPoint(camera.X,camera.Y,ref.X,ref.Y), dist=distance(ref.X,ref.Y,camera.X,camera.Y),
pos={
X:camera.X+SIN(angle)*(sz*0.9),
Y:camera.Y-COS(angle)*(sz*0.9),
};
return dist<sz*0.9?ref:pos;
}


U2D.setMiniMap=function(obj){
obj.zoom=obj.zoom||camera.zoom;
obj.rotating=obj.rotating||false;
obj.marginLeft=obj.marginLeft||0;
obj.marginTop=obj.marginTop||0;
obj.size=obj.size||20;
obj.resolution=obj.resolution||400;
obj.lastAngle=0;
 var elem=new Canvas();
elem.width=obj.resolution;
elem.height=obj.resolution;
elem.style.border="solid 1px black";
elem.style.borderRadius="100%";
elem.style.position="fixed";
elem.style.left=obj.marginLeft+"%";
elem.style.top=obj.marginTop+"%";
elem.style.width=obj.size/2+"%";
elem.style.height=obj.size+"%";
elem.style.zIndex="-998";
obj.elem=elem;
document.body.appendChild(elem);
miniMap=obj;
}

U2D.removeMiniMap=function(){
miniMap.elem.parentNode.removeChild(miniMap.elem);
miniMap=null;
}


function intersection(p1,p2,p3,p4) {
    if (p2.x < p1.x) {
       var tmp = p1;
        p1 = p2;
        p2 = tmp;
    }

    if (p4.x < p3.x) {
        var tmp = p3;
        p3 = p4;
        p4 = tmp;
    }

if (p2.x < p3.x) { return false; }
    if((p1.x - p2.x == 0) && (p3.x - p4.x == 0)) {
 if(p1.x == p3.x) {
  if (!((Math.max(p1.y, p2.y) < Math.min(p3.y, p4.y)) ||
 (Math.min(p1.y, p2.y) > Math.max(p3.y, p4.y)))) {
 return true;
   }
 }
 return false;
    }
    if (p1.x - p2.x == 0) {
        var Xa = p1.x;
var A2 = (p3.y - p4.y) / (p3.x - p4.x);
var b2 = p3.y - A2 * p3.x;
var Ya = A2 * Xa + b2;

if (p3.x <= Xa && p4.x >= Xa && Math.min(p1.y, p2.y) <= Ya && Math.max(p1.y, p2.y) >= Ya) {
 return true;
}
return false;
    }
    if (p3.x - p4.x == 0) {
     var Xa = p3.x;
var A1 = (p1.y - p2.y) / (p1.x - p2.x);
     var b1 = p1.y - A1 * p1.x;
     var Ya = A1 * Xa + b1;
if (p1.x <= Xa && p2.x >= Xa && Math.min(p3.y, p4.y) <= Ya &&
 Math.max(p3.y, p4.y) >= Ya) {
return true;
        }
 return false;
    }

var A1 = (p1.y - p2.y) / (p1.x - p2.x);
var A2 = (p3.y - p4.y) / (p3.x - p4.x);
var b1 = p1.y - A1 * p1.x;
var b2 = p3.y - A2 * p3.x;
if (A1 == A2) { return false; }
var Xa = (b2 - b1) / (A1 - A2);
if ((Xa < Math.max(p1.x, p3.x)) || (Xa > Math.min( p2.x, p4.x))) {
 return false;  } else { return true;}
}




function collide(a,b){
var d=Math.max(a.width,a.height,b.width,b.height);
 if(distance(a.X,a.Y,b.X)>d*2){
 return false;  }
var pt=function(obj,ox,oy){
var oX=SIN(obj.angle+90)*ox +SIN(obj.angle)*oy;
var oY=-COS(obj.angle+90)*ox 
-COS(obj.angle)*oy;
return {X:obj.X+oX, Y:obj.Y+oY}
},
aw=a.width/2, ah=a.height/2,
bw=b.width/2, bh=b.height/2,
aLines=[
[pt(a,-aw,-ah).X,pt(a,-aw,-ah).Y,
 pt(a,aw,-ah).X,pt(a,aw,-ah).Y],
[pt(a,aw,-ah).X,pt(a,aw,-ah).Y,
 pt(a,aw,ah).X,pt(a,aw,ah).Y],
[pt(a,aw,ah).X,pt(a,aw,ah).Y,
 pt(a,-aw,ah).X,pt(a,-aw,ah).Y],
[pt(a,-aw,ah).X,pt(a,-aw,ah).Y,
 pt(a,-aw,-ah).X,pt(a,-aw,-ah).Y]
],
bLines=[
[pt(b,-bw,-bh).X,pt(b,-bw,-bh).Y,
 pt(b,bw,-bh).X,pt(b,bw,-bh).Y],
[pt(b,bw,-bh).X,pt(b,bw,-bh).Y,
 pt(b,bw,bh).X,pt(b,bw,bh).Y],
[pt(b,bw,bh).X,pt(b,bw,bh).Y,
 pt(b,-bw,bh).X,pt(b,-bw,bh).Y],
[pt(b,-bw,bh).X,pt(b,-bw,bh).Y,
 pt(b,-bw,-bh).X,pt(b,-bw,-bh).Y]
];

for(var i=0;i<aLines.length;i++){
for(var j=0;j<bLines.length;j++){
var A=aLines[i], B=bLines[j];
if(intersection(
{x:A[0],y:A[1]},{x:A[2],y:A[3]},
{x:B[0],y:B[1]},{x:B[2],y:B[3]},
)){ 
return true; }
}}
return false;
}


U2D.setOnCollide=function(typeA,typeB){
var arr=[typeA,typeB,function(){}];
collidePairs.push(arr);
 return function(f){ arr[2]=f; }
}

function finalyOnCollide(a,b,p){
if(a.collideType==p[0]&&b.collideType==p[1]&&a!=b){ 
if(collide(a,b)){ p[2](a,b); 
  }}
if(a.collideType==p[1]&&b.collideType==p[0]&&a!=b){ 
if(collide(b,a)){ p[2](b,a); 
  }}
}

function scanAllCollides(){
collidePairs.forEach(function(p){
entityesList.forEach(function(a){
 var size=Math.max(a.width,a.height);
 for(var x=-size;x<=size;x++){
 for(var y=-size;y<=size;y++){
 var t=getTile(a.X+x,a.Y+y).clone();
 t.X=Math.floor(a.X+x)+0.5;
 t.Y=Math.floor(a.Y+y)+0.5;
finalyOnCollide(a,t,p);
 }}
entityesList.forEach(function(b){
 finalyOnCollide(a,b,p);
});
});
});
}



function lockOrientation(){ 
 if(U2D.isMobile()){
var s=window.screen;
 if(s.lockOrientation){
s.lockOrientation("landscape-primary");
}
if(s.orientation.lock){
s.orientation.lock("landscape-primary");
}
 if(s.mozLockOrientation){
s.mozLockOrientation("landscape-primary");
}
 if(s.webkitLockOrientation){
s.webkitLockOrientation("landscape-primary");
}
 if(s.oLockOrientation){
s.oLockOrientation("landscape-primary");
}
 if(s.msLockOrientation){
s.msLockOrientation("landscape-primary");
} 
 }
 }


function ObjectCopy(obj){
for(var i in obj){
this[i]=obj[i];
}}

function report(text,func){
try{ func(); }catch(e){
if(reportsCount>0){
reportsCount-=1;
alert(text+" : "+e);
console.log(text+" : "+e);
}
}}

function SIN(a){
return Math.sin(a*Math.PI/180);
}
function COS(a){
return Math.cos(a*Math.PI/180);
} 

function projectPoint(x,y){ 
var ofsX=x-camera.X,
ofsY=y-camera.Y,
halfX=ctxWidth/2,
halfY=ctxHeight/2; 
var pt={
left:halfX+(ofsX*halfX)/camera.zoom,
top:halfY+(ofsY*halfX)/camera.zoom, 
  }
pt.left=Math.round(pt.left);
pt.top=Math.round(pt.top);
return pt;
}

function projectMMPoint(x,y){ 
var ofsX=x-camera.X,
ofsY=y-camera.Y,
halfX=miniMap.elem.width/2,
halfY=miniMap.elem.height/2; 
var pt={
left:halfX+(ofsX*halfX)/miniMap.zoom,
top:halfY+(ofsY*halfX)/miniMap.zoom, 
  }
pt.left=Math.floor(pt.left);
pt.top=Math.floor(pt.top);
return pt;
}



function Matrix(){
var arr=[];
this.setPart=function(x,z,value){
if(x<0||z<0){ return; }
x=Math.floor(x);
z=Math.floor(z); 
if(!arr[x]){ arr[x]=[]; }
arr[x][z]=value;
}
this.getPart=function(x,z){
x=Math.floor(x);
z=Math.floor(z); 
if(x<0||z<0){ return; } 
if(arr[x]==null){ return; } 
return arr[x][z];
}

}

var matrix=new Matrix();

function rotateCtx(left,top,angle){
ctx.translate(left,top);
ctx.rotate(angle*Math.PI/180); 
ctx.translate(-left,-top); 
}

function distance(x,y,X,Y){
var dX=x-X, dY=y-Y;
return Math.sqrt(dX*dX+dY*dY);
}


function drawUnit(s,x,y){ 
 report("unit",function(){
if(s.X!=null){ x=s.X; }
if(s.Y!=null){ y=s.Y; }  
ctx.save();
var a=s.angle/180*Math.PI,
halfW=s.width/2, 
halfH=s.height/2,
cntr=projectPoint(x,y), 
LT=projectPoint(x-halfW,y-halfH),
RB=projectPoint(x+halfW,y+halfH),
projWidth=RB.left-LT.left, 
projHeight=RB.top-LT.top;
ctx.translate(cntr.left,cntr.top);
ctx.rotate(a); 
if(s.image){
var img=typeof(s.image)=="string"?
U2D.getSource(s.image):s.image;
if(!s.cut){
s.cut=[0,0,img.width,img.height];
} 
var aDt=animData[s.image];
if(aDt){
s.animationStep++;
 if(s.animationStep>aDt.cadresAmount){ s.animationStep=0; }
s.cut=aDt.animationCuts[s.animationStep];
} 
ctx.drawImage(img,
s.cut[0], s.cut[1],
s.cut[2], s.cut[3],
-projWidth/2, -projHeight/2, 
projWidth, projHeight
); 
}
if(s.color){
ctx.fillStyle=s.color;
ctx.fillRect(
-projWidth/2, -projHeight/2,
projWidth, projHeight );
}
ctx.restore();
  });
    
}



function drawLoadingBar(progress){
 function w(p){
return ctxWidth/100*p;
 }
 function h(p){
return ctxHeight/100*p;
 }
ctx.fillStyle="black";
ctx.fillRect(0,0,ctxWidth,ctxHeight);
ctx.fillStyle="white";
ctx.fillRect(w(20),h(60),w(60),h(20));
ctx.fillStyle="black";
ctx.fillRect(w(22),h(62),w(56),h(16));
ctx.fillStyle="white";
ctx.font="bold 1em arial";
ctx.fillText("ЗАГРУЗКА ДАННЫХ",w(30),h(40));
var pg=progress||maxSourceToLoad-sourceToLoad;
pg=pg/(maxSourceToLoad/100)*0.56;
ctx.fillRect(w(22),h(62),w(pg),h(16));
}


function angleToPoint(x,y,X,Y){
var a=Math.atan2(X-x,(Y-y)*-1)*180/Math.PI;
return a<0?360+a:a;
} 

U2D.angleToPoint=angleToPoint;


function setTile(x,y,t){
var p=cloneMode?t.clone():t;
matrix.setPart(x,y,p);
if(x>locationSizeX){
locationSizeX=x; }
if(y>locationSizeY){
locationSizeY=y; }
}

function getTile(x,y){
var p=matrix.getPart(x,y);
return !p?emptyTile:p;
}

U2D.setTile=setTile;
U2D.getTile=getTile;

U2D.setCloneMode=function(m){
cloneMode=m;
}

function loadSource(folder,name){ 
var n=name;
var onLoad=function(){
sourceToLoad-=1;
loadedStatus["_"+n]=true;
if(sourceToLoad<=0){ 
onLoadCallbacks.forEach(function(f){f();});
onPause=false; }}
var onError=function(){
alert("Source "+folder+" not found or access denied");
}
var file=folder.split("/");
file=file[file.length-1];
var extension=file.split(".")[1];
name=name||file.split(".")[0];
name="_"+name;
if(extension=="png"||extension=="jpg"){
sourceCache[name]=new Image();
sourceCache[name].src=folder;
sourceCache[name].onload=onLoad;
sourceCache[name].onerror=onError;
loadedStatus[name]=false;
  }else if(["mp3","ogg","wav"].indexOf(extension)!=-1){ 
  try{
var a=U2D.ajax(folder,function(resp){
new AudioContext().decodeAudioData(
resp,function(buffer){
sourceCache[name]=buffer;
onLoad();
});
},onError); 
a.responseType="arraybuffer"; 
}catch(e){ onLoad(); }
  }else{
U2D.ajax(folder,function(resp){
sourceCache[name]=resp;
onLoad();
},onError); 
 }
}


U2D.addOnLoad=function(f){
onLoadCallbacks.push(f);
}


U2D.inputSource=function(a,b){
onPause=true;
sourceToLoad++;
maxSourceToLoad++;
loadSource(a,b);
return U2D.inputSource;
}


U2D.getSource=function(name){
if(!loadedStatus["_"+name]){
return null; }
return sourceCache["_"+name];
}


U2D.setSpritesheet=function(img){
animData[img]={};
var src=animData[img],
image=U2D.getSource(img);
 
return function(obj){
 /*{widthSteps,heightSteps,playTime,cadresAmount} */
 if(!image){
 U2D.addOnLoad(function(){
 U2D.setSpritesheet(img)(obj);
 });
 return;
 }
if(!obj.cadresAmount){
obj.cadresAmount=obj.widthSteps*obj.heightSteps;
}
if(!obj.playMultipler){ 
obj.playMultipler=1; }
src.cadresAmount=obj.cadresAmount*obj.playMultipler;
 var cuts=[],
sW=image.width/obj.widthSteps,
sH=image.height/obj.heightSteps;
for(var w=1;w<=obj.widthSteps;w++){
for(var h=1;h<=obj.heightSteps;h++){
cuts.push([
sW*(w-1), sH*(h-1),
sW,sH
]);
}}
var cuts2=[];
for(var j=0;j<cuts.length;j++){
for(var i=1;i<=obj.playMultipler;i++){
cuts2.push(cuts[j]);
}}
src.animationCuts=cuts2;
 }
}

U2D.setResolution=function(n){
setting.resolution=n;
}

U2D.setFps=function(n){
setting.fps=n;
}

U2D.startRendering=function(callback){ 
if(isRunning){ return; }
isRunning=true;
callback=callback||function(){};
(function() { 
var request =
 window.requestAnimationFrame||
  window.mozRequestAnimationFrame||
window.webkitRequestAnimationFrame|| window.msRequestAnimationFrame||
function(f){ setTimeout(f,16); };
 window.requestAnimationFrame = request; })();
var run,
lastTime=0;
run=function(){
canvas.style.width="120vw";
canvas.style.height="120vw"; 
canvas.style.left="-10vw"; 
canvas.style.top="-30vw";
   report("loop",function(){ 
var time=new Date().getTime();
 for(var i=0; i<entityesList.length;i++){
 var e=entityesList[i];
 e.action(e);
 if(time>=e.removeTime){ e.hide(); }
 }
lockOrientation();
callback();
scanAllCollides();
if(time-lastTime<1000/setting.fps){
return; } 
lastTime=time;
U2D.render();
updateSounds();
   }); 
requestAnimationFrame(run);
}
requestAnimationFrame(run);
}


U2D.render=function(){ 
 report("render",function(){
if(sourceToLoad>0){
 drawLoadingBar(); 
}
if(setting.resolution!=lastResolution){
var resl=setting.resolution;
lastResolution=resl;
canvas.width=resl;
canvas.height=resl; 
ctxWidth=resl;
ctxHeight=resl;
 }
  if(onPause){ return; }
renderStack++
if(renderStack>1){return;}

var rot="rotate("+camera.angle+"deg)";
canvas.style.transform=rot;
canvas.style.webkitTransform=rot;
canvas.style.mozTransform=rot;
canvas.style.oTransform=rot;
canvas.style.msTransform=rot;

 var toDraw=[];
var X=Math.floor(camera.X)+0.5,
 sz=Math.floor(camera.zoom)+1, 
 Y=Math.floor(camera.Y)+0.5;
for(var x=-sz;x<=sz;x++){
for(var y=-sz;y<=sz;y++){ 
var part=getTile(X+x,Y+y);
toDraw.push([part,X+x,Y+y]);
}} 
for(var i=0; i<entityesList.length;i++){
 var e=entityesList[i];
toDraw.push([e]);
}
toDraw.sort(function(a,b){
return a[0].drawPriority>b[0].drawPriority?1:-1;
});

for(var i=0;i<toDraw.length;i++){
var u=toDraw[i];
drawUnit(u[0],u[1],u[2]);
}

globalRunPeriod++

if(miniMap!=null){
drawMiniMap(camera.X,camera.Y,miniMap.zoom,camera.angle);
}

renderStack--;
 });
}
 
U2D.locationFromImage=function(imag){
report("location parse",function(){
var img=U2D.getSource(imag);
 if(!img){
U2D.addOnLoad(function(){
U2D.locationFromImage(imag);
});
return;
 }
var cn=document.createElement("canvas"),
ct=cn.getContext("2d");
cn.width=img.width;
cn.height=img.height;
ct.drawImage(img,0,0,img.width,img.height);
for(var w=0;w<img.width;w++){
for(var h=0;h<img.height;h++){ 
var data=ct.getImageData(w,h,1,1);
data=data.data;
var str=data[0]+","+data[1]+","+data[2];
for(var i=0;i<tilesList.length;i++){
var col=tilesList[i].colorId;
if(data[0]==col[0]&&data[1]==col[1]&&data[2]==col[2]){
setTile(w,h,tilesList[i]);
}}
 }}
}); }


U2D.getLocationWidth=function(){
return locationSizeX;
}

U2D.getLocationHeight=function(){
return locationSizeY;
}

U2D.waySearch=function(){
var checked=[],
startX=0.5, startY=0.5,
endX=0.5, endY=0.5,
whiteList=[],
blackList=[],
result,
limit=1000,
wayFound=false,

 check=function(x,y){
var t=getTile(x,y);
if(whiteList[0]){
return whiteList.indexOf(t)!=-1;
}
if(blackList[0]){
return blackList.indexOf(t)==-1;
}
 },
 
 iterate=function(x,y,way){
var pos=x+":"+y;
if(checked.indexOf(pos)!=-1||
wayFound||limit<=0){ return; }
limit--;
checked.push(pos);
way.push({X:x, Y:y});
if(x==endX&&y==endY){
result=way;
wayFound=true;
return;
}
 var dirs=[
 [1,0],[-1,0],[0,1],[0,-1]
 ];
for(var i=0;i<dirs.length;i++){
var dist=distance(x+dirs[i][0],y+dirs[i][1],endX,endY);
dirs[i].push(dist);
}
dirs.sort(function(a,b){
return a[2]<b[2]?-1:1;
});
 
step(x+dirs[0][0],y+dirs[0][1],way);  
step(x+dirs[1][0],y+dirs[1][1],way);
step(x+dirs[2][0],y+dirs[2][1],way);
step(x+dirs[3][0],y+dirs[3][1],way);
 },
 
step=function(x,y,way){
if(check(x,y)){ iterate(x,y,way);  }
},
 
obj={};
 obj.start=function(x,y){
startX=Math.floor(x)+0.5;
startY=Math.floor(y)+0.5;
return obj;
 }
 obj.end=function(x,y){
endX=Math.floor(x)+0.5;
endY=Math.floor(y)+0.5;
return obj;
 }
 obj.whiteList=function(a){
whiteList=a;
return obj;
 }
 obj.blackList=function(a){
blackList=a;
return obj;
 }
 obj.search=function(){
 iterate(startX,startY,[]);
 return result;
 }
return obj;
}



U2D.marginateArea=function(x,z,sizeX,sizeZ,main,topMargin,rightMargin,bottomMargin,leftMargin,LTcorner,RTcorner,RBcorner,LBcorner){
var is=function(v){
return v==main||v==topMargin||v==rightMargin||v==bottomMargin||v==leftMargin||v==LTcorner||v==RTcorner||v==RBcorner||v==LBcorner; 
}
for(var X=x;X<=sizeX;X++){
for(var Z=z;Z<=sizeZ;Z++){ 
var part=main,
CENTER=is(getPart(X,Z)),
TOP=is(getPart(X,Z-1)), 
RIGHT=is(getPart(X+1,Z)), 
BOTTOM=is(getPart(X,Z+1)), 
LEFT=is(getPart(X-1,Z)); 
 if(CENTER){
 
if(!TOP&&!LEFT){ part=LTcorner; }
if(!TOP&&!RIGHT){ part=RTcorner; } 
if(!BOTTOM&&!RIGHT){ part=RBcorner; } 
if(!BOTTOM&&!LEFT){ part=LBcorner; }

if(!TOP&&LEFT&&RIGHT){
part=topMargin; } 
if(!RIGHT&&TOP&&BOTTOM){
part=rightMargin; } 
if(!BOTTOM&&LEFT&&RIGHT){
part=bottomMargin; } 
if(!LEFT&&TOP&&BOTTOM){
part=leftMargin; } 

setPart(X,Z,part);
 }
}}
};

U2D.forEachTile=function(f){
for(var x=0;x<=locationSizeX;x++){
for(var y=0;y<=locationSizeY;y++){
f(getTile(x,y),x,y);
}}
}


U2D.setBackgroundTile=function(t){
emptyTile=t;
}

U2D.resetLocation=function(){
matrix=new Matrix();
}

U2D.resetEntityes=function(){
entityesList=[];
}

U2D.distance=distance;

U2D.pause=function(value){
if(value==null){
onPause=onPause?false:true;
}else{
onPause=value;
}
}

U2D.setCameraPosition=function(x,y){
camera.X=x;
camera.Y=y;
}

U2D.translateCamera=function(x,y){
camera.X+=x;
camera.Y+=y;
}

U2D.setCameraAngle=function(a){
camera.angle=a;
}

U2D.setCameraZoom=function(v){
camera.zoom=v;
}

U2D.getCameraX=function(){
return camera.X;
}

U2D.getCameraY=function(){
return camera.Y;
}

U2D.ajax=function(url,callback,err){
err=err||function(){};
var r=new XMLHttpRequest();
r.open("GET",url);
r.onreadystatechange=function(){
if(r.readyState==4){ 
if(r.status!=200){ 
err(); }
callback(r.response||r.responseText);
}}
r.send();
return r;
} 
 
U2D.Sound=function(name){ 
 try{
this.name=name;
var aCtx=new AudioContext(),
buffer=U2D.getSource(name),
gain=aCtx.createGain(),
panner=aCtx.createPanner(),
source=aCtx.createBufferSource(); 
source.buffer=buffer; 
gain.gain.value=1;
panner.panningModel="equalpower"; 
source.connect(gain);
gain.connect(panner);
panner.connect(aCtx.destination); 
 this.gain=gain;
 this.panner=panner;
this.source=source; 
 }catch(e){}
} 

U2D.Sound.prototype={
 play:function(time){
if(!this.source){ return this; }
this.source.start(time);
return this;
 },
 stop:function(){
if(!this.source){ return this; }
this.source.stop();
return this;
 },
 setVolume:function(perc){
if(!this.gain){ return this; }
this.gain.gain.value=perc/100;
return this;
 },
 setBalance:function(value){
if(!this.panner){ return this; }
this.panner.setPosition(value,0,1,-Math.abs(value));
return this;
 },
 addEndCallback:function(f){
if(!this.source){ return this; }
this.source.addEventListener("ended",f);
return this;
 },
 playOnEntity:function(ent,dist){
this.setVolume(0);
this.play();
soundsToUpdate.push({
sound:this,
entity:ent,
distance:dist||camera.zoom,
});
var self=this;
this.addEndCallback(function(){
var ind=soundsToUpdate.indexOf(self);
soundsToUpdate.splice(ind);
});
return this;
 },
}


U2D.isMobile=function(){
return navigator.userAgent.match(new RegExp("IEMobile/Android/iPhone/iPod/iPad/BlackBerry","i"))!=-1; 
}


U2D.setFullscreen=function(){ 
if(document.fullscreenEnabled){

 function fullscreen(e){
    try{
if(e.requestFullscreen){
e.requestFullscreen();
}
if(e.mozRequestFullscreen){
e.mozRequestFullscreen();
}
if(e.webkitRequestFullscreen){
e.webkitRequestFullscreen();
}
if(e.oRequestFullscreen){
e.oRequestFullscreen();
}
if(e.msRequestFullscreen){
e.msRequestFullscreen();
}
if(sourceToLoad<=0){
loadingBarEnabled=false;
}
   }catch(e){ }
 }

//fullscreen(document.body);
document.addEventListener("click",function(){
fullscreen(document.body);
 }); 
document.addEventListener("touchstart",function(){
fullscreen(document.body);
 }); 
document.addEventListener("touchend",function(){
fullscreen(document.body);
 }); 
document.addEventListener("keydown",function(){
fullscreen(document.body);
 }); 
}
}

U2D.setCookie=function(key,value){
if(!navigator.cookieEnabled){
return; }
report("cookie save",function(){
document.cookie=key+"="+JSON.stringify(value)+"; expires=Fri, 10 Feb 9999 00:00:00 GMT";
});
}

U2D.getCookie=function(key){
if(!navigator.cookieEnabled||document.cookie==""){
return; } 
report("cookie load",function(){
var cok=document.cookie.split(";");
for(var i=0;i<cok.length;i++){
var pair=cok[i].split("=");
 if(pair[0]==key){ return pair[1]; }
}
});
}

U2D.getTilesList=function(){
return tilesList;
}


 //both
 
function setTexture(txr,cut){
this.image=txr;
this.color=null;
this.animationStep=0;
return this;
} 

function setColor(col){
this.color=col; 
this.image=null;
return this;
} 

function setDrawPriority(p){
this.drawPriority=p;
return this;
}


function setAngle(angle){
this.angle=angle; 
return this; 
}

function getOffsetPoint(ofsX,ofsY){
var pt={};
pt.X=this.X+SIN(this.angle+90)*ofsX;
pt.Y=this.Y-COS(this.angle+90)*ofsX;
pt.X+=SIN(this.angle)*ofsY;
pt.Y-=COS(this.angle)*ofsY;
 return pt;
}

function setCollideType(type){
this.collideType=type;
return this;
}

U2D.Entity=function(){
this.X=0;
this.Y=0;
this.angle=0;
this.width=1;
this.height=1;
this.drawPriority=1;
this.lights=[];
this.action=function(){};
}

U2D.Entity.prototype={
setTexture:setTexture,
setColor:setColor,
setDrawPriority:setDrawPriority,
getOffsetPoint:getOffsetPoint,
setAngle:setAngle,
setCollideType:setCollideType,

setPosition:function(x,y){
this.X=x;
this.Y=y;
return this;
},


translatePosition:function(x,y){
this.X+=x; 
this.Y+=y; 
return this;
},

polaricTranslate:function(angle,value){
this.X+=SIN(angle)*value;
this.Y-=COS(angle)*value; 
return this;
},

show:function(){
entityesList.push(this);
return this;
},

hide:function(){
entityesList.splice(entityesList.indexOf(this),1);
this.removeMiniMapIcon();
return this;
},

setSize:function(w,h){
this.width=w;
this.height=h;
return this;
},

bindCamera:function(ofsX,ofsY){
camera.X=this.X+(ofsX||0);
camera.Y=this.Y+(ofsY||0);
return this;
},

clone:function(){
return new ObjectCopy(this);
},

setAction:function(f){
this.action=f;
return this;
},

setMiniMapIcon:function(img,flow){
var ic={
image:img,
flowing:flow||false,
referal:this
};
this.icon=ic;
icons.push(ic);
return this;
},

removeMiniMapIcon:function(){
var ind=icons.indexOf(this.icon);
if(ind==-1){ return; }
icons.splice(ind,1);
},

setRemoveDelay:function(sec){
this.removeTime=new Date().getTime()+sec*1000;
return this;
},

getX:function(){
return this.X;
},

getY:function(){
return this.Y;
},

getAngle:function(){
return this.angle;
},

 }
 
U2D.Tile=function(){
this.angle=0;
this.width=1;
this.height=1;
this.colorToken=[-1,-1,-1];
this.drawPriority=0;
this.colorId=[];
tilesList.push(this);
this.miniMapColor="black";
}

U2D.Tile.prototype={
setTexture:setTexture,
setColor:setColor,
setDrawPriority:setDrawPriority,
getOffsetPoint:getOffsetPoint,
setAngle:setAngle,
setCollideType:setCollideType,

setMiniMapColor:function(r,g,b){
this.miniMapColor=[r,g,b];
return this;
},

setColorId:function(r,g,b){
this.colorId=[r,g,b];
return this;
},

clone:function(){
return new ObjectCopy(this);
},

setEditorName:function(n){
this.editorName=n;
return this;
},

} 

emptyTile=new U2D.Tile()
.setColor("black");

//keyboard

var keyUpFunctions1={},
keyUpFunctions2=[],
keyDownFunctions1={},
keyDownFunctions2=[],
keyCodes={ArrowLeft:37, ArrowUp:38, ArrowRight:39, ArrowDown:40, Space:32, Digit0:48, Digit1:49, Digit2:50, Digit3:51, Digit4:52, Digit5:53, Digit6:54, Digit7:55, Digit8:56, Digit9:57, KeyA:65, KeyB:66, KeyC:67, KeyD:68, KeyE:69, KeyF:70, KeyG:71, KeyH:72, KeyI:73, KeyJ:74, KeyK:75, KeyL:76, KeyM:77, KeyN:78, KeyO:79, KeyP:80, KeyQ:81, KeyR:82, KeyS:83, KeyT:84, KeyU:85, KeyV:86, KeyW:87, KeyX:88, KeyY:89, KeyZ:90};

U2D.Key=function(key){
var cd;
 for(var i in keyCodes){
 if(i==key){ cd=keyCodes[i]; }
 }
this.key1=key;
this.key2=cd;
}

U2D.Key.prototype.setOnPress=function(f){
keyDownFunctions1[this.key1]=f;
keyDownFunctions2[this.key2]=f;
return this;
}

U2D.Key.prototype.setOnRelease=function(f){
keyUpFunctions1[this.key1]=f;
keyUpFunctions2[this.key2]=f;
return this;
}

document.onkeydown=function(e){
var a;
 if(e.code){
 a=keyDownFunctions1[e.code];
 } 
if(!a&&e.keyCode){
a=keyDownFunctions2[e.keyCode];
 }
if(typeof(a)=="function"){ a(); }
}

document.onkeyup=function(e){
var a;
 if(e.code){
 a=keyUpFunctions1[e.code];
 } 
if(!a&& e.keyCode){
a=keyUpFunctions2[e.keyCode];
 }
if(typeof(a)=="function"){ a(); }
}

//touch listeners

U2D.Touch=function(elem){
// startX,lastX,endX,event
this.startCallback=function(){};
this.moveCallback=function(){};
this.endCallback=function(){};
var self=this;

elem.addEventListener("touchstart",function(e){
self.event=e;
var x=e.touches[0].screenX;
var y=e.touches[0].screenY;
self.startX=x;
self.startY=y;
self.lastX=x;
self.lastY=y;
e.preventDefault();
self.startCallback(x,y);
});

elem.addEventListener("touchmove",function(e){
self.event=e;
var x=e.touches[0].screenX;
var y=e.touches[0].screenY;
self.moveCallback(x,y);
self.lastX=x;
self.lastY=y;
e.preventDefault();
});

elem.addEventListener("touchend",function(e){ 
self.event=e;
var x=e.changedTouches[0].screenX;
var y=e.changedTouches[0].screenY;
self.endX=x;
self.endY=y;
e.preventDefault();
self.endCallback(x,y); 
});

}

U2D.Touch.prototype={

setOnStart:function(cb){
this.startCallback=cb;  
return this;
},
setOnMove:function(cb){
this.moveCallback=cb;  
return this;
},
setOnEnd:function(cb){
this.endCallback=cb;  
return this;
},
getTouchCoordinates:function(ind){
return {
X:this.event.touches[ind].screenX,
Y:this.event.touches[ind].screenY,
 }
},
 }

var preventDrag=false;
 
U2D.setCameraDraggable=function(lx,hx,ly,hy){
new U2D.Touch(canvas)
.setOnMove(function(x,y){
if(preventDrag){ 
preventDrag=false; return; }
if(!this.event.touches[1]){
camera.X+=(this.lastX-x)/200*camera.zoom;
camera.Y+=(this.lastY-y)/200*camera.zoom;
}
if(lx!=null){ if(camera.X<lx){
camera.X=lx; }}
if(ly!=null){ if(camera.Y<ly){ 
camera.Y=ly; }}
if(hx!=null){ if(camera.X>hx){
camera.X=hx; }}
if(hy!=null){ if(camera.Y>hy){ 
camera.Y=hy; }}
});
}

U2D.setPinchZooming=function(min,max){ 
var initialDist,
initialZoom,
scale=Math.abs(min-max)*10;
new U2D.Touch(canvas)
.setOnMove(function(x,y){
var e=this.event;
if(e.touches.length!=2){ 
initialDist=null;
initialZoom=null;
return;
}
preventDrag=true;
var x1=e.touches[1].screenX,
y1=e.touches[1].screenY,
dist=distance(x,y,x1,y1);
 if(initialDist==null){
 initialDist=dist;
 initialZoom=camera.zoom;
 }
var z=initialZoom+(initialDist-dist)/scale;
if(z<min){ z=min; }
 if(z>max){ z=max; }
camera.zoom=z;
});
}

//scene

canvas=document.createElement("canvas");
document.body.appendChild(canvas);
ctx=canvas.getContext("2d");
canvas.style.position="absolute";
canvas.style.zIndex="-999";
 canvas.style.width="120vw";
canvas.style.height="120vw"; 
canvas.style.left="-10vw"; 
canvas.style.top="-30vw";
document.body.style.position="relative";
document.body.style.marginLeft="0px";
document.body.style.marginTop="0px";
document.body.style.zIndex="1";

 }catch(e){
alert("Engine Start: "+e); } 
})();


