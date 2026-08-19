/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas1") //£ Top
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d")

const canvasWidth = 1280;
const canvasHeight = 720;
let screenScale;
function resizeCanvas(){
    screenScale = Math.min(window.innerWidth / canvasWidth,window.innerHeight/canvasHeight);
    canvas.width = canvasWidth * screenScale;
    canvas.height = canvasHeight * screenScale;
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    ctx.setTransform(screenScale,0,0,screenScale,0,0)
    ctx.imageSmoothingEnabled = false
}
window.addEventListener("resize",resizeCanvas);
resizeCanvas()

let previousTime = 0;

let mouseScrX = canvasWidth / 2;
let mouseScrY = canvasHeight / 2;
let mouseCoords = {x:0, y:0}
let mouseDown = false;

const isMobile = navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches  

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    mouseScrX = (event.clientX - rect.left)/screenScale
    mouseScrY = (event.clientY - rect.top)/screenScale
}
function mouseUp(){
    if (stage === 0 && atlasLoaded && audioLoaded){
        start()
    }else if(stage === 2){
        stage = 0
        loseAu.pause()
    }else if(stage === 1){
        if (choosing){
            skillChooser.click()
        }else{
            Player.shoot()
        }
    }
}
if (isMobile){
    canvas.addEventListener("touchstart",function(e){
        e.preventDefault()

        getMousePos(e.touches[0])
        mouseDown = true
    }, {passive: false})
    canvas.addEventListener("touchmove",function(e){
        e.preventDefault()

        getMousePos(e.touches[0])
    }, {passive: false})
    canvas.addEventListener("touchend",function(e){
        e.preventDefault()

        mouseDown = false
        mouseUp()
    }, {passive: false})
}else{
    canvas.addEventListener("mousemove", function (e) {
        getMousePos(e)
    })
    canvas.addEventListener("mousedown", function (e) {
        mouseDown = true;
    })
    canvas.addEventListener("mouseup", function (e) {
        mouseDown = false;
        mouseUp()
    })
}


//£Varibles
const SKILLCHOICESAMO = 3
let score
let scoreGoal = 5
let scoreGoalChange = 5
let choosing = false
let stage = 0

const Cam = { //£ cam
    x: 0,
    y: 0,
    SPEED: 3,
    getScr(x,y){
        const scrX = (x-this.x) * a.unitsize + canvasWidth/2
        const scrY = (y-this.y) * a.unitsize + canvasHeight/2
        return {x:Math.round(scrX),y:Math.round(scrY)}
    },
    getWorld(x,y){
        return {x: (x-canvasWidth/2)/a.unitsize+this.x, y: (y-canvasHeight/2)/a.unitsize+this.y}
    },
    update(delta){
        const targetX = Player.x
        const targetY = Player.y 

        const xDif = targetX - this.x
        const yDif = targetY - this.y

        this.x +=  xDif * delta * this.SPEED
        this.y +=  yDif * delta * this.SPEED
    }
}
class Img{
    constructor(x,y,w,h){
        this.sx = x
        this.sy = y
        this.sw = w
        this.sh = h
        this.wToH = h/w
    }
    draw(turnScr,x,y,w,h=undefined,centred=false){
        if (h===undefined) h = w * this.wToH

        if (turnScr){
            ({x,y} = Cam.getScr(x,y))
            w *= a.unitsize
            h *= a.unitsize
        }
        if (centred) {
            x -= w/2
            y -= h/2
        }
        ctx.drawImage(ATLAS,this.sx,this.sy,this.sw,this.sh,
            x,y,w,h
        )
    }
    drawSpec(turnScr,x,y,w,h=undefined,angle,centred=true,hFlip=false,vFlip=false){
        if (h===undefined) h = w * this.wToH

        if (turnScr){
            ({x,y} = Cam.getScr(x,y))
            w *= a.unitsize
            h *= a.unitsize
        }
        if (!centred){
            x += w/2
            y += h/2
        }
        ctx.save()
        ctx.translate(x,y)

        if (angle !== 0) ctx.rotate(angle)
        
        if (hFlip || vFlip) ctx.scale(hFlip? -1:1, vFlip? -1:1)
        
        ctx.drawImage(ATLAS,this.sx,this.sy,this.sw,this.sh,
            -w/2,-h/2,w,h
        )
        ctx.restore()
    }
}
//£ images
const introImg = new Image()
introImg.src = "images/intro.png"

let atlasLoaded = false
const ATLAS = new Image()
ATLAS.src = "images/atlas.png"
ATLAS.onload = () =>{atlasLoaded = true}

const boomAni = [
    new Img(144,176,16,16),
    new Img(150,28,16,16),
    new Img(160,176,16,16) 
]
const ammoImg = new Img(118,48,16,8) 
const carImg = new Img(166,28,16,16) 
const deathImg = new Img(0,0,102,58) 
const grassImg = new Img(144,144,32,32) 
const gunImg = new Img(150,0,32,28) 
const heartImg = new Img(176,144,16,16) 
const missileImg = new Img(102,48,16,10) 
const shooterImg = new Img(144,192,16,8) 


const gunShotAu = new Audio("audio/gunShot.mp3")
const reloadAu = new Audio("audio/reload.mp3") 
const boomAu = new Audio("audio/boom.mp3")
const levelUpAu = new Audio("audio/levelUp.mp3")
const loseAu = new Audio("audio/lose.mp3")
const hitAu = new Audio("audio/hit.mp3")

const audios = [gunShotAu,reloadAu,boomAu,levelUpAu,loseAu,hitAu]
let audLoadedAmo = 0
let audioLoaded = false

audios.forEach(audio =>
    audio.addEventListener("canplay", () => {
        audLoadedAmo++

        audioLoaded = audLoadedAmo === audios.length
    }, { once: true })
)
const myFont = new FontFace('myFont', 'url(medodica.regular.otf)')
myFont.load().then(font => {
    document.fonts.add(font)
})

function drawRotatedCirImg(obj,img){//£Helpers
    const scrCoords = Cam.getScr(obj.x,obj.y)
    ctx.save();
    ctx.translate(scrCoords.x,scrCoords.y)
    ctx.rotate(obj.angle)
    ctx.drawImage(img,-obj.r*a.unitsize,-obj.r*a.unitsize,obj.r*a.unitsize*2,obj.r*a.unitsize*2)
    ctx.restore()
}
function drawCircle(x,y,r,colour){
    const scrCoords = Cam.getScr(x,y)
    ctx.fillStyle = colour
    ctx.beginPath()
    ctx.arc(scrCoords.x,scrCoords.y,r*a.unitsize,0,2*Math.PI)
    ctx.fill()
}
function drawText(text,x,y,h,font,colour,baseLine="middle",align="center",maxW=null){
    ctx.font = `${h}px ${font}`
    ctx.fillStyle = colour

    ctx.textBaseline = baseLine
    ctx.textAlign = align

    if (maxW === null) ctx.fillText(text,x,y)
    else ctx.fillText(text,x,y,maxW)
}
function drawLine(toScr,x1,y1,x2,y2,thickness,colour,cap="butt"){

    if (toScr) {
        const p1 = Cam.getScr(x1, y1)
        const p2 = Cam.getScr(x2, y2)

        x1 = p1.x
        y1 = p1.y
        x2 = p2.x
        y2 = p2.y

        thickness *= a.unitsize
    }

    ctx.lineWidth = thickness
    ctx.strokeStyle = colour
    ctx.lineCap = cap

    ctx.beginPath()
    ctx.moveTo(x1,y1)
    ctx.lineTo(x2,y2)
    ctx.stroke()
}
function updateAndFilter(arr,delta){
    arr.forEach(obj => obj.update(delta))
    return arr.filter(obj => obj.alive)
}
function angleTo(looked, looking){
    return Math.atan2(looked.y - looking.y, looked.x-looking.x)
}
function angleDif(a, b) {
    let dif = a - b;
    while (dif > Math.PI) dif -= Math.PI * 2
    while (dif < -Math.PI) dif += Math.PI * 2
    return dif
}
function mod(n, m) {
    return ((n % m) + m) % m;
}
function randFloat(min,max){
    return Math.random()*(max-min)+min
}
function randint(min,max){
    return Math.floor(Math.random()*(max-min+1))+min
}
const randomItems = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n)
function pointDist(x1,y1,x2,y2){
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}
function cirCirColi(a,b){
    const dist = pointDist(a.x,a.y,b.x,b.y)
    return dist <= a.r + b.r
}
function pointRectColi(x,y,rect){
    return x >= rect.x && x <= rect.x + rect.w &&
        y >= rect.y && y <= rect.y + rect.h;
}
function cirThickLineColi(circle, line) {
    const { x: cx, y: cy, r:radius } = circle;
    const { x1, y1, x2, y2, thickness } = line;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const lengthSq = dx * dx + dy * dy;

    let t = 0;
    if (lengthSq > 0) {
        t = ((cx - x1) * dx + (cy - y1) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));
    }

    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    const distX = cx - closestX;
    const distY = cy - closestY;

    const distanceSq = distX * distX + distY * distY;
    const collisionRadius = radius + thickness / 2;

    return distanceSq <= collisionRadius * collisionRadius;
}
class Skill{
    constructor(type, key, val, isInt=false){
        this.type = type
        this.key = key
        this.val = val
        this.isInt = isInt
        this.alive = true
        this.desc = `${type}${val}`
    }
    use(){
        if (this.type === "?"){
            a[this.key] = this.val
            this.alive = false
            return
        }
        if (this.type === "+"){
            addA[this.key] += this.val
        }else if(this.type === "*"){
            multiA[this.key] *= this.val
        }
        a[this.key] = (defaultA[this.key] + addA[this.key]) * multiA[this.key]
        if (this.isInt) a[this.key] = Math.round(a[this.key])
        if (this.key === "unitsize"){
            worCanvasW = canvasWidth / a.unitsize
            worCanvasH = canvasHeight / a.unitsize
        }
    }
}
const SKILLS = [
    new Skill("+","magSize",2,true),
    new Skill("*","magSize",1.3,true),
    new Skill("*", "bulletRadius", 1.5),
    new Skill("+", "bulletRadius",.3),
    new Skill("+","recoil",5),
    new Skill("*","recoil",1.2),
    new Skill("*","bulletPen",1.5,true),
    new Skill("+","bulletPen",1,true),
    new Skill("*","playerFriction",.7),
    new Skill("+","maxSpeed",50),
    new Skill("*","bulletSpeed",1.5),
    new Skill("+","bulletSpeed",20),
    new Skill("*","reloadTime",.7),
    new Skill("*","unitsize",.9),
    new Skill("+","maxHp",3,true),
    new Skill("*","maxHp",1.3,true),
    new Skill("+","regen",1,true),
    new Skill("*","regen",1.2,true),
    new Skill("+","bulletAmo",1,true),
    new Skill("*","bulletAmo",1.5,true)
]

const SKILLIMGS = {
    recoil: new Img(96,106,48,48) ,
    playerFriction: new Img(0,154,48,48) ,
    maxSpeed: new Img(48,154,48,48) ,
    bulletSpeed: new Img(0,106,48,48) ,
    bulletRadius: new Img(0,58,48,48),
    magSize: new Img(48,58,48,48) ,
    reloadTime: new Img(102,0,48,48) ,
    bulletPen: new Img(96,58,48,48) ,
    unitsize: new Img(144,96,48,48) ,
    maxHp: new Img(48,106,48,48) ,
    regen: new Img(96,154,48,48),
    bulletAmo: new Img(144,48,48,48) 
}
const defaultA = { //£ a
    recoil: 15,
    playerFriction: 1,
    maxSpeed: 100,
    bulletSpeed: 30,
    bulletRadius: .3,
    magSize: 6,
    reloadTime: 1,
    bulletPen: 2,
    unitsize: 30,
    maxHp: 10,
    regen: 1,
    bulletAmo: 1,
}
let multiA = {}
let addA = {}
let a = {...defaultA}
let worCanvasW = canvasWidth / a.unitsize
let worCanvasH = canvasHeight / a.unitsize
function start(){
    for (const key of Object.keys(defaultA)){
        multiA[key] = 1
        addA[key] = 0
    }
    a = {...defaultA}
    score = 0
    foes = []
    bullets = []
    Player = new PlayerClass()
    Cam.x = 0
    Cam.y = 0
    scoreGoal = 5
    scoreGoalChange = 5
    spawnTimeLeft = 0
    stage = 1
}
let booms = []
class Boom{
    constructor(x,y){
        this.x = x
        this.y = y
        this.r = .5
        this.alive = true

        this.frame = 0
        this.FRAMETIME = .2
        this.FRAMEAMO = 3
        this.frameTimeLeft = this.FRAMETIME

        const noise = boomAu.cloneNode()
        noise.play()
    }
    update(delta){
        this.frameTimeLeft -= delta
        while(this.frameTimeLeft<=0){
            this.frame ++
            this.frameTimeLeft += this.FRAMETIME
            if (this.frame >= this.FRAMEAMO){
                this.alive = false
            }
        }
    }
    draw(){
        boomAni[this.frame].draw(true,this.x,this.y,this.r*2)
    }
}
let foes = []
class Shooter{ //£ Shooter
    constructor(x,y){
        this.x = x
        this.y = y
        this.angle = 0
        this.r = .5
        this.alive = true
        this.SPEED = 3
        this.shootTimeLeft = 0
    }
    update(delta){
        this.angle = angleTo(Player,this)

        this.x += Math.cos(this.angle) * delta * this.SPEED
        this.y += Math.sin(this.angle) * delta * this.SPEED

        if (pointDist(this.x,this.y,Cam.x,Cam.y) > worCanvasW*2) this.alive = false

        if (pointDist(this.x,this.y,Cam.x,Cam.y) > worCanvasH) return
        if (this.shootTimeLeft <= 0){
            this.shootTimeLeft = 1
            bullets.push(new Bullet(this.x,this.y, this.angle,false))
        }else this.shootTimeLeft -= delta
    }
    draw(){
        shooterImg.drawSpec(true,this.x,this.y,this.r*2,undefined,this.angle)
    }
    die(){
        if (!this.alive) return
        this.alive = false 
        score ++
        booms.push(new Boom(this.x,this.y))
    }
}
class Runner{//£ Runner
    constructor(x,y){
        this.x = x
        this.y = y
        this.angle = 0
        this.r = .5
        this.alive = true
        this.SPEED = 5
    }
    update(delta){
        this.angle = angleTo(Player,this)

        this.x += Math.cos(this.angle) * this.SPEED * delta
        this.y += Math.sin(this.angle) * this.SPEED * delta

        if (cirCirColi(this,Player)) {
            this.alive = false
            Player.hurt()
            booms.push(new Boom(this.x,this.y))
        }
        if (pointDist(this.x,this.y,Cam.x,Cam.y) > worCanvasW*2) this.alive = false
    }
    draw(){
        carImg.drawSpec(true,this.x,this.y,this.r*2,undefined,this.angle)
    }
    die(){
        if (!this.alive) return
        this.alive = false
        score ++
        booms.push(new Boom(this.x,this.y))
    }
}
class Missile{//£ Missile
    constructor(x,y){
        this.x = x
        this.y = y
        this.angle = angleTo(Player,this)
        this.r = .5
        this.TURNSPEED = 2
        this.SPEED = 10
        this.alive = true
    }
    update(delta){
        const angTo = angleTo(Player,this)
        const angDif = angleDif(this.angle,angTo)
        this.angle += -Math.sign(angDif) * this.TURNSPEED * delta

        this.x += Math.cos(this.angle) * this.SPEED * delta
        this.y += Math.sin(this.angle) * this.SPEED * delta

        if (pointDist(this.x,this.y,Cam.x,Cam.y) > worCanvasW*2) this.alive = false
        if (cirCirColi(this,Player)) {
            this.alive = false
            Player.hurt()
            booms.push(new Boom(this.x,this.y))
        }

    }
    draw(){
        missileImg.drawSpec(true,this.x,this.y,this.r*2, undefined, this.angle)
    }
    die(){
        if (!this.alive) return
        this.alive = false 
        score ++
        booms.push(new Boom(this.x,this.y))
    }
}
const FOECLASSES = [Runner,Missile,Shooter]
let spawnTimeLeft = 0
function spawnFoes(delta){
    while (foes.length < (score+10)/2){
        spawnFoe()
    }
    if (spawnTimeLeft>0) spawnTimeLeft -= delta
    else{
        while (spawnTimeLeft <= 0){
            spawnFoe()
            spawnTimeLeft += 5
        }
    }
}
function spawnFoe(){
    const foeClass = FOECLASSES[randint(0,FOECLASSES.length-1)]
    const angle = randFloat(0,2*Math.PI)
    const x = Player.x + Math.cos(angle) * worCanvasH 
    const y = Player.y + Math.sin(angle) * worCanvasH 
    foes.push(new foeClass(x,y))
}

let bullets = []
class Bullet{ //£ Bullet
    constructor(x,y,angle, good){
        this.x = x
        this.y = y
        this.good = good
        this.lastX = x
        this.lastY = y

        let speed
        if (this.good){
            this.r = a.bulletRadius
            speed = a.bulletSpeed
            this.penLeft = a.bulletPen
        }else{
            this.r = .2
            speed = 20
        }

        this.xVel = Math.cos(angle) * speed
        this.yVel = Math.sin(angle) * speed

        this.trailWaitLeft =  .1
        this.trailX = this.x
        this.trailY = this.y

        this.alive = true
    }
    update(delta){
        this.x += this.xVel * delta
        this.y += this.yVel * delta
        
        if (pointDist(this.x,this.y,Cam.x,Cam.y) > worCanvasW*2) this.alive = false

        const thickLine = {x1: this.lastX, y1: this.lastY, 
            x2: this.x, y2: this.y, thickness: this.r*2
        }

        if (this.good){
            for (let foe of foes){
                if (cirThickLineColi(foe,thickLine)){
                    foe.die()
                    this.penLeft --
                    if (this.penLeft <= 0){
                        this.alive = false
                        break
                    }
                }
            }
        }else if(cirThickLineColi(Player,thickLine)){
            this.alive = false
            Player.hurt()
        }
            
        this.lastX = this.x
        this.lastY = this.y

        if (this.trailWaitLeft>0) this.trailWaitLeft -= delta
        else{
            this.trailX += this.xVel * delta
            this.trailY += this.yVel * delta
        }
    }
    draw(){
        drawLine(true,this.trailX,this.trailY,this.x,this.y,.1,"yellow")

        const scrC = Cam.getScr(this.x,this.y)
        const grad = ctx.createRadialGradient(scrC.x,scrC.y,0,scrC.x,scrC.y,this.r * a.unitsize)
        grad.addColorStop(0,"rgb(82, 82, 82)")
        grad.addColorStop(1,"rgb(65, 65, 65)")
        drawCircle(this.x,this.y,this.r,grad)
    }
}
class PlayerClass{ //£ Player
    constructor(){
        this.x = 0
        this.y = 0
        this.angle = 0
        this.r = 1
        this.xVel = 0
        this.yVel = 0
        this.canClick = false
        this.mag = a.magSize
        this.reloadTimeLeft = 0
        this.reloading = false
        this.hp = a.maxHp
        this.shottySpread = 1
    }
    update(delta){
        if (!this.reloading){
            this.angle = angleTo(mouseCoords,this)
        }else{
            this.reloadTimeLeft -= delta
            this.angle += (delta/a.reloadTime)*2*Math.PI
            if (this.reloadTimeLeft <= 0){
                this.mag = a.magSize
                this.reloading = false
            }
        }
        


        this.x += this.xVel * delta
        this.y += this.yVel * delta

        const dampening = Math.exp(-a.playerFriction * delta)
        this.xVel *= dampening
        this.yVel *= dampening
    }
    draw(){
        gunImg.drawSpec(true,this.x,this.y,this.r*2,undefined,this.angle)
    }
    shoot(){
        if (this.reloading) return
        if (this.mag > 0){
            this.canClick = false

            const speed = Math.hypot(this.xVel,this.yVel)
            if (speed < a.maxSpeed){
                this.xVel += Math.cos(this.angle) * -a.recoil
                this.yVel += Math.sin(this.angle) * -a.recoil
            }
            const noise = gunShotAu.cloneNode()
            noise.play()
            this.mag --
            bullets.push(new Bullet(this.x,this.y,this.angle,true))
            if (a.bulletAmo !== 1) {
                for(let i=1; i<a.bulletAmo; i++){
                    const shotAngle = this.angle + randFloat(-this.shottySpread/2,this.shottySpread/2)
                    bullets.push(new Bullet(this.x,this.y,shotAngle,true))
                }
            }
            
        }
        else{
            this.reloadTimeLeft = a.reloadTime
            this.reloading = true

            reloadAu.playbackRate = .4/a.reloadTime 
            reloadAu.currentTime = 0
            reloadAu.play()
        }
    }
    hurt(){
        this.hp --
        if (this.hp <= 0) {
            stage = 2
            loseAu.currentTime = 0
            loseAu.play()
        }else{
            const noise = hitAu.cloneNode()
            noise.play()
        }
    }
}
let Player = new PlayerClass()

function drawBg(){
    const w = 2 * a.unitsize //w = h
    const xOffset = mod(Cam.x*a.unitsize, w)
    const yOffset = mod(Cam.y*a.unitsize, w)

    for (let x = -xOffset; x< canvasWidth+w; x += w){
        for (let y = -yOffset; y< canvasHeight+w; y += w){
            grassImg.draw(false,x-1,y-1,w+2,w+2,false)
        }
    }
}
const heartW = 100
const ammoW = 100
function drawHud(){
    drawText(score,canvasWidth/2,0,100,"myFont","black","hanging")
    drawText(`${scoreGoal-score} left`,canvasWidth/2,70,40,"myFont","black","hanging")

    heartImg.draw(false,0,0,100)
    drawText(`${Player.hp}/${a.maxHp}`, heartW/2,heartW/4,40,"myFont","black","hanging","center",heartW)

    ammoImg.draw(false,canvasWidth-ammoW,0,ammoW)
    drawText(`${Player.mag}/${a.magSize}`,canvasWidth - ammoW/2, ammoW/4,40,"myFont","black","middle","center",ammoW)
}


const skillChooser = {
    boxW: 300,
    boxH: 300,
    boxY: canvasHeight/2 - 150,
    init(){
        this.stage = 0
        this.stageTimeLeft = .5
        scoreGoal += scoreGoalChange
        scoreGoalChange += 10
        this.skillChoices = randomItems(SKILLS.filter(skill => skill.alive),SKILLCHOICESAMO)
        const middleDist = canvasWidth/SKILLCHOICESAMO
        this.xPosis = []
        for (let cx= middleDist/2; cx<canvasWidth; cx += middleDist ){
            this.xPosis.push(cx - this.boxW/2)
        }

        Player.hp += a.regen
        Player.hp = Math.min(Player.hp,a.maxHp)

        levelUpAu.currentTime = 0
        levelUpAu.play()

        choosing = true
    },
    update(delta){
        if (this.stage === 0){
            if (this.stageTimeLeft>0) this.stageTimeLeft -= delta
            else this.stage = 1
        }else if (this.stage === 2){
            if (this.stageTimeLeft>0)this.stageTimeLeft -= delta
            else {
                choosing = false
                levelUpAu.pause()
            }
        }
    },
    click(){
        if (this.stage !== 1) return

        for (let i=0;i<SKILLCHOICESAMO; i++){
            if (pointRectColi(mouseScrX,mouseScrY,{
                x: this.xPosis[i], y: this.boxY, w: this.boxW, h: this.boxH
            })){
                this.skillChoices[i].use()
                this.stage = 2
                this.stageTimeLeft = .5
                return
            }
        }
    },
    draw(){
        if (!choosing || this.stage !== 1) return
        for (let i=0;i<SKILLCHOICESAMO; i++){
            const nowSkill = this.skillChoices[i]
            SKILLIMGS[nowSkill.key].draw(false,this.xPosis[i], this.boxY,this.boxW)

            if (nowSkill.type === "?") continue

            drawText(nowSkill.desc,this.xPosis[i]+this.boxW/2,this.boxY + this.boxH,50,
                "myFont","black","bottom","center",this.boxW)
        }
    }
}
function drawIntro(){
    ctx.drawImage(introImg,0,0,canvasWidth,canvasHeight)

    if (!(atlasLoaded && audioLoaded))  drawText("Loading...",canvasWidth/2,canvasHeight,
        50,"myFont","black","bottom","center")
}
function drawDeath(){
    deathImg.draw(false,0,0,canvasWidth,canvasHeight)

    drawText(`Score: ${score}`,canvasWidth/2,canvasHeight,200,"myFont","black","bottom","center")
}
function main(delta){//£ main
    mouseCoords = Cam.getWorld(mouseScrX,mouseScrY)
    if (!choosing){
        Player.update(delta)
        Cam.update(delta)
        bullets = updateAndFilter(bullets,delta)
        foes = updateAndFilter(foes,delta)
        booms = updateAndFilter(booms,delta)
        spawnFoes(delta)
        if (scoreGoal <= score){
            skillChooser.init()
        }
    }else skillChooser.update(delta)

    drawBg()
    booms.forEach(boom => boom.draw())
    bullets.forEach(bullet => bullet.draw())
    foes.forEach(foe => foe.draw())
    Player.draw()
    drawHud()
    skillChooser.draw()

}
function animate(timestamp) { //£ animate
    const delta = Math.min((timestamp - previousTime) / 1000,.05)
    previousTime = timestamp
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if(stage === 0) drawIntro()
    else if (stage === 1) main(delta)
    else if (stage === 2) drawDeath()
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

