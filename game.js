let p1_pos=1,p2_pos=1,p3_pos=1,p4_pos=1,p5_pos=1,p6_pos=1,p7_pos=1,p8_pos=1,currentPlayer=1,totalPlayers=4,gameActive=false,isAnimating=false;
const mapRules={3:22,5:8,11:26,20:29,36:55,50:67,57:74,69:93,79:98,27:7,34:12,43:18,54:31,62:41,71:42,88:63,95:56,99:1};
let names={1:"玩家 1",2:"玩家 2",3:"玩家 3",4:"玩家 4",5:"玩家 5",6:"玩家 6",7:"玩家 7",8:"玩家 8"};
const colors={1:"#007bff",2:"#dc3545",3:"#ffc107",4:"#28a745",5:"#9c27b0",6:"#ff7f50",7:"#00ffff",8:"#e91e63"},colorChinese={1:"藍",2:"紅",3:"黃",4:"綠",5:"紫",6:"橘",7:"青",8:"粉"};
let inverseRules={};Object.keys(mapRules).forEach(s=>{inverseRules[mapRules[s]]=s;});

function playSound(type){
    try{
        const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC(),now=ctx.currentTime;
        if(type==='ladder'){
            const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);
            osc.type='triangle';osc.frequency.setValueAtTime(300,now);osc.frequency.exponentialRampToValueAtTime(1200,now+0.6);
            gain.gain.setValueAtTime(0.3,now);gain.gain.linearRampToValueAtTime(0.01,now+0.6);osc.start(now);osc.stop(now+0.6);
        }else if(type==='snake'){
            const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);
            osc.type='sawtooth';osc.frequency.setValueAtTime(600,now);osc.frequency.linearRampToValueAtTime(120,now+0.8);
            gain.gain.setValueAtTime(0.2,now);gain.gain.linearRampToValueAtTime(0.01,now+0.8);osc.start(now);osc.stop(now+0.8);
        }else if(type==='win'){
            const notes = new Array(523, 523, 523, 523, 659, 587, 523, 659, 587, 523, 659, 784, 784, 698, 659, 587, 523);
            const durations = new Array(0.2, 0.2, 0.2, 0.5, 0.4, 0.2, 0.2, 0.2, 0.5, 0.2, 0.2, 0.4, 0.2, 0.2, 0.2, 0.2, 0.8);
            let timeCursor = now;
            notes.forEach(function(freq, i) {
                const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);
                osc.type='square';osc.frequency.setValueAtTime(freq, timeCursor);
                let dur = durations.slice(i, i + 1).pop();
                gain.gain.setValueAtTime(0.15, timeCursor);gain.gain.linearRampToValueAtTime(0.001, timeCursor + dur - 0.02);
                osc.start(timeCursor);osc.stop(timeCursor + dur);
                timeCursor += dur;
            });
        }
    }catch(e){}
}

function buildBoardHtml(){
    let html="";
    for(let r=9;r!==-1;r--){
        for(let c=0;c!==10;c++){
            let id=(r%2===1)?(r*10)+(10-c):(r*10)+(c+1),extraClass="",style="";
            
            // 💡 核心優化：如果這一格在 mapRules 裡面（是蛇或梯子的起點），強制將詞彙清空
            let hasWord = (customLabels[id] && !mapRules[id]) ? true : false;
            let cText = hasWord ? `<div style='font-size:12px; font-weight:bold; color:#333; margin-top:2px;'>${customLabels[id]}</div>` : "";
            
            let label = `<div style='font-size:11px; position:absolute; top:2px; left:4px; color:#888;'>${id}</div>${cText}`;
            if(id===1) label=`<div style='font-size:11px; position:absolute; top:2px; left:4px; font-weight:bold;'>1 起點</div>${cText}`;
            if(id===100) label=`<div style='font-size:11px; position:absolute; top:2px; left:4px; font-weight:bold;'>100 終點</div><div style='font-size:20px; margin-top:6px;'>🏆</div>`;
            
            if(mapRules[id]){
                if(mapRules[id]>id){extraClass=" ladder";label=`<div style='font-size:11px; color:#137333; font-weight:bold; margin-top:-14px;'>${id}➔${mapRules[id]}</div><div style='font-size:16px;'>🧗</div>`;}
                else{extraClass=" snake";label=`<div style='font-size:11px; color:#c5221f; font-weight:bold; margin-top:-14px;'>${id}➔${mapRules[id]}</div><div style='font-size:16px;'>🐍</div>`;}
            }
            if(inverseRules[id]){
                let s=inverseRules[id];if(id>s){style="border:2px dashed #137333;box-sizing:border-box;";label+=`<div style='font-size:9px; color:#137333; position:absolute; bottom:2px; width:100%; text-align:center;'>終點(自${s})</div>`;}
                else{style="border:2px dashed #c5221f;box-sizing:border-box;";label+=`<div style='font-size:9px; color:#c5221f; position:absolute; bottom:2px; width:100%; text-align:center;'>蛇尾(自${s})</div>`;}
            }
            html+=`<div class="cell${extraClass}" id="cell-${id}" style="${style}">${label}<div class="token-container" id="container-${id}"></div></div>`;
        }
    }
    document.getElementById('board').innerHTML=html;
}
buildBoardHtml();

function updateNameInputs(){
    let count=parseInt(document.getElementById('player-count').value),html="";
    for(let i=1;i<=count;i++)html+=`<div class="name-input-group"><span class="color-dot" style="background-color:${colors[i]}"></span><label>玩家 ${i} 名字：</label><input type="text" id="input-name-${i}" placeholder="玩家 ${i} (${colorChinese[i]})"></div>`;
    document.getElementById('name-inputs-area').innerHTML=html;
}
document.getElementById('player-count').addEventListener('change',updateNameInputs);updateNameInputs();

function clearAllTokens(){document.querySelectorAll('.token').forEach(el=>el.remove());}
function placeToken(pNum,posNum){const c=document.getElementById('container-'+posNum);if(c){const t=document.createElement('div');t.className='token';t.style.backgroundColor=colors[pNum];c.appendChild(t);}}
function renderTokens() {
    clearAllTokens();
    if(totalPlayers>=1)placeToken(1,p1_pos);if(totalPlayers>=2)placeToken(2,p2_pos);if(totalPlayers>=3)placeToken(3,p3_pos);if(totalPlayers>=4)placeToken(4,p4_pos);
    if(totalPlayers>=5)placeToken(5,p5_pos);if(totalPlayers>=6)placeToken(6,p6_pos);if(totalPlayers>=7)placeToken(7,p7_pos);if(totalPlayers>=8)placeToken(8,p8_pos);
}
function updateStatusText(){document.getElementById('status').innerHTML=`⏳ 輪到 <span class="player-tag" style="background-color:${colors[currentPlayer]};">${names[currentPlayer]}</span> 擲骰子`;}

function startGame(){
    if(isAnimating)return;totalPlayers=parseInt(document.getElementById('player-count').value);
    for(let i=1;i<=totalPlayers;i++){let v=document.getElementById('input-name-'+i).value.trim();names[i]=v!==""?`${v}(${colorChinese[i]})`:`玩家 ${i}(${colorChinese[i]})`;}
    p1_pos=1;p2_pos=1;p3_pos=1;p4_pos=1;p5_pos=1;p6_pos=1;p7_pos=1;p8_pos=1;currentPlayer=1;gameActive=true;isAnimating=false;
    document.getElementById('btn-roll').disabled=false;document.getElementById('btn-roll').style.opacity="1";document.getElementById('dice-result').innerText='點數：-';renderTokens();updateStatusText();
}

function savePos(p,n){
    if(p===1)p1_pos=n;if(p===2)p2_pos=n;if(p===3)p3_pos=n;if(p===4)p4_pos=n;
    if(p===5)p5_pos=n;if(p===6)p6_pos=n;if(p===7)p7_pos=n;if(p===8)p8_pos=n;
}
function getPos(p){
    if(p===1)return p1_pos;if(p===2)return p2_pos;if(p===3)return p3_pos;if(p===4)return p4_pos;
    if(p===5)return p5_pos;if(p===6)return p6_pos;if(p===7)return p7_pos;if(p===8)return p8_pos;return 1;
}

function rollDice(){
    if(!gameActive||isAnimating)return;isAnimating=true;
    document.getElementById('btn-roll').disabled=true;document.getElementById('btn-roll').style.opacity="0.5";
    const dice=Math.floor(Math.random()*6)+1;document.getElementById('dice-result').innerText='🎲 點數：'+dice;
    let sPos=getPos(currentPlayer),name=names[currentPlayer],rawTarget=sPos+dice,finalTarget=rawTarget>100?100:rawTarget,actualSteps=finalTarget-sPos;
    let step=1,walk=setInterval(()=>{
        let cur=sPos+step;savePos(currentPlayer,cur);renderTokens();
        document.getElementById('status').innerHTML=`🏃 ${name} 前進中... (${cur}/100)`;
        if(step>=actualSteps){clearInterval(walk);if(cur===100){setTimeout(endTurn,300);}else{setTimeout(()=>checkSpecial(finalTarget),300);}}
        step++;
    },250);
}

function checkSpecial(cur){
    let name=names[currentPlayer];
    if(mapRules[cur]){
        let tel=mapRules[cur];
        if(tel>cur){
            playSound('ladder');document.getElementById('status').innerHTML=`🧗 <strong>發現梯子！</strong> ${name} 停在第 ${cur} 格... (2 秒後開始往上爬)`;
            setTimeout(()=>{
                let anim=cur,climb=setInterval(()=>{
                    anim++;savePos(currentPlayer,anim);renderTokens();document.getElementById('status').innerHTML=`🧗 ${name} 爬梯子中... (${anim}/${tel})`;
                    if(anim===tel){clearInterval(climb);document.getElementById('status').innerHTML=`🧗 ${name} 到達第 ${tel} 格！`;setTimeout(endTurn,1000);}
                },100);
            },2000);
        }else{
            playSound('snake');document.getElementById('status').innerHTML=`🐍 <strong>被大蛇咬到！</strong> ${name} 停在第 ${cur} 格... (2 秒後開始向下滑落)`;
            setTimeout(()=>{
                let anim=cur,slide=setInterval(()=>{
                    anim--;savePos(currentPlayer,anim);renderTokens();document.getElementById('status').innerHTML=`🐍 ${name} 向下滑落中... (${anim}/${tel})`;
                    if(anim===tel){clearInterval(slide);document.getElementById('status').innerHTML=`🐍 ${name} 跌回了第 ${tel} 格...`;setTimeout(endTurn,1000);}
                },100);
            },2000);
        }
    }else{endTurn();}
}

function endTurn(){
    if(getPos(currentPlayer)===100){playSound('win');document.getElementById('status').innerHTML=`🎉 🎉 🎉 🎉<br>恭喜 <span class="player-tag" style="background-color:${colors[currentPlayer]};">${names[currentPlayer]}</span> 獲勝！`;gameActive=false;isAnimating=false;return;}
    currentPlayer=currentPlayer+1;if(currentPlayer>totalPlayers)currentPlayer=1;
    updateStatusText();isAnimating=false;document.getElementById('btn-roll').disabled=false;document.getElementById('btn-roll').style.opacity="1";
}
renderTokens();
