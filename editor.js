try{
 
function downloadCanvas(cnv, name){
	  cnv.toBlob(function(blob){
var reader = new FileReader();
 reader.onloadend=function(e){
var res=e.target.result,
a=document.createElement("a"),
event=new MouseEvent("click"); a.download=name;
a.href=res; 
a.dispatchEvent(event);
	   } 
reader.readAsDataURL(blob);
	  },"image/png");
}


function outputLocation(){
 var cnv= document.createElement("canvas"),
ctx=cnv.getContext("2d");
cnv.width=U2D.getLocationWidth();
cnv.height=U2D.getLocationHeight();
U2D.forEachTile(function(t,x,y){
ctx.fillStyle="rgb("+t.colorId.join(",")+")";
ctx.fillRect(x,y,1,1);
});
return cnv;
}

function tileSelector(page){
var t=U2D.getTilesList(); 
var pageLimit=Math.floor(t.length/8);
var cont=document.createElement("div");
cont.style.position="fixed";
cont.style.left="0%";
cont.style.top="0%";
cont.style.width="100%";
cont.style.height="20%";
cont.style.backgroundColor="white";
document.body.appendChild(cont);


var sel=document.createElement("div");
sel.innerHTML="page "+(page+1)+"/"+(pageLimit+1);
sel.style.width="15%";
sel.style.display="inline-block";
sel.style.verticalAlign="top";
sel.style.textAlign="center";
sel.style.fontSize="0.5em";
cont.appendChild(sel);

var btnPrev=document.createElement("button");
btnPrev.style.width="100%";
btnPrev.innerHTML="previous";
btnPrev.onclick=function(){
if(page>0){ 
cont.parentNode.removeChild(cont);
tileSelector(page-1); 
}}
sel.appendChild(btnPrev);

var btnNext=document.createElement("button");
btnNext.style.width="100%";
btnNext.innerHTML="next";
btnNext.onclick=function(){
cont.parentNode.removeChild(cont);
if(page<pageLimit){ 
cont.parentNode.removeChild(cont);
tileSelector(page+1); 
}}
sel.appendChild(btnNext);
     
var min=page*8, max=min+8;
 for(var i=min;i<max&&i<t.length;i++){
var d=document.createElement("div");
d.style.width="10%";
d.style.height="100%";
d.style.display="inline-block";
d.style.textAlign="center";
d.style.color="white";
d.style.fontSize="0.8em";
d.style.verticalAlign="top";
d.innerHTML=t[i].editorName||"";
if(t[i].image==null){
d.style.backgroundColor=t[i].color;
}else{
d.style.backgroundImage="url("+U2D.getSource(t[i].image).src+")";
d.style.backgroundSize="100% 100%";
}
d.style.border="solid 1px black";
d.onclick=function(i2){
return function(){
cont.parentNode.removeChild(cont);
selectedTile=t[i2];
}}(i);
cont.appendChild(d);
 }
    
}


var cord=document.createElement("div");
cord.style.position="fixed";
cord.style.left="40%";
cord.style.top="90%";
cord.style.width="20%";
cord.style.height="10%";
cord.style.textAlign="center";
cord.style.color="white";
cord.style.fontSize="1em";
document.body.appendChild(cord);


var lastOperations=[];
var selectedTile=U2D.getTilesList()[0];
var moveDirX=0, moveDirY=0;
 
U2D.setCameraPosition(0.5,0.5);
U2D.setCameraZoom(10);

var ln=new U2D.Entity()
.setDrawPriority(1000000000)
.setColor("rgb(255,0,0)")
.setSize(1,0.1);
var cursor=[
ln.show(),
ln.clone().setAngle(90).show(),
ln.clone().show(),
ln.clone().setAngle(90).show()
];

function putTile(){
var x=U2D.getCameraX(),
y=U2D.getCameraY();
lastOperations.push({
X:x, Y:y,
tile:U2D.getTile(x,y)
});
U2D.setTile(x,y,selectedTile);
}

setInterval(function(){ 
U2D.translateCamera(
moveDirX/30*zoom,moveDirY/30*zoom
); 
var x=Math.floor(U2D.getCameraX())+0.5,
y=Math.floor(U2D.getCameraY())+0.5;
if(x<0.5){ x=0.5; }
if(y<0.5){ y=0.5; }
cord.innerHTML="x:"+(x-0.5)+" y:"+(y-0.5);
cursor[0].setPosition(x,y-0.5);
cursor[1].setPosition(x+0.5,y);
cursor[2].setPosition(x,y+0.5);
cursor[3].setPosition(x-0.5,y);

},20);



function button(x,y,text){
var b=document.createElement("button");
b.style.position="fixed";
b.style.left=x+"%";
b.style.top=y+"%";
b.style.height="8%";
b.innerHTML=text;
document.body.appendChild(b);
return b;
}

button(80,80,"put").onclick=putTile;

button(80,60,"undo").onclick=function(){
var len=lastOperations.length-1, o=lastOperations[len];
 if(len>=0){
lastOperations.splice(len,1);
U2D.setTile(o.X,o.Y,o.tile);
}}


button(90,0,"export").onclick=function(){ try{
var img=outputLocation(),
dt=new Date(),
day=["вс","пн","вт","ср","чт","пт","сб"][dt.getDay()],
name="location_"+day+"_"+dt.getHours()+"_"+dt.getMinutes()+".png";
downloadCanvas(img,name);
 }catch(e){ alert(e); }
}

button(60,0,"select tile").onclick=function(){
tileSelector(0);
}
  
  var zoom=10;
button(10,0,"zoom-").onclick=function(){
if(zoom>1){ zoom--; }
U2D.setCameraZoom(zoom);
}

button(20,0,"zoom+").onclick=function(){
zoom++;
U2D.setCameraZoom(zoom);
}

var btnLeft=button(5,80,"left"),
btnRight=button(25,80,"right"),
btnUp=button(15,70,"up"),
btnDown=button(15,90,"down");
  if(U2D.isMobile()){
  
new U2D.Touch(btnLeft)
.setOnStart(function(){
moveDirX=-1;
})
.setOnEnd(function(){
moveDirX=0;
})

new U2D.Touch(btnRight)
.setOnStart(function(){
moveDirX=1;
})
.setOnEnd(function(){
moveDirX=0;
})

new U2D.Touch(btnUp)
.setOnStart(function(){
moveDirY=-1;
})
.setOnEnd(function(){
moveDirY=0;
})

new U2D.Touch(btnDown)
.setOnStart(function(){
moveDirY=1;
})
.setOnEnd(function(){
moveDirY=0;
})

}else{

btnLeft.onclick=function(){
U2D.translateCamera(-1,0); }

btnRight.onclick=function(){
U2D.translateCamera(1,0); }

btnUp.onclick=function(){
U2D.translateCamera(0,-1); }

btnDown.onclick=function(){
U2D.translateCamera(0,1); }

}

new U2D.Key("KeyF")
.setOnPress(function(){
putTile();
});

new U2D.Key("KeyQ")
.setOnPress(function(){
U2D.setCameraZoom(zoom-1);
});

new U2D.Key("KeyE")
.setOnPress(function(){
U2D.setCameraZoom(zoom+1);
});

new U2D.Key("KeyA")
.setOnPress(function(){
moveDirX=-1;
})
.setOnRelease(function(){
moveDirX=0;
});

new U2D.Key("KeyD")
.setOnPress(function(){
moveDirX=1;
})
.setOnRelease(function(){
moveDirX=0;
});

new U2D.Key("KeyW")
.setOnPress(function(){
moveDirY=-1;
})
.setOnRelease(function(){
moveDirY=0;
});

new U2D.Key("KeyS")
.setOnPress(function(){
moveDirY=1;
})
.setOnRelease(function(){
moveDirY=0;
});

}catch(e){ alert("editor:"+e); }

U2D.setFullscreen();
U2D.startRendering();
U2D.addOnLoad(function(){
 setTimeout(function(){
 if(!U2D.isMobile()){
alert("zoom - q,e \n camera - w,a,s,d \n put - f");
 }
 },1000);
});








