const gameboard = document.getElementById('gameboard');
const control = document.getElementById('control');

const ROW_NUMBER = 12
const COL_NUMBER = 15
const STATES = ["vertical","rowHorizontal","colHorizontal"]
const AUTO_PATH_BUILD_DELAY  = 500
const MAX_PATH_LEN = 12

let isMouseDown= false;
let brushMode = 1
let minPath = [];
let wrongPathsCalculations = 0
let inaccessableCells = 0

const figure = {
  rootCoords:{row:0,col:0}, //coors on the board
  properties:{row:0,col:0}, //+1/-1/0
  state : STATES[0]
}

let gameboardContainer = []
// Math.random() * (max - min) + min;
const finish = {
  row:0,
  col:0,
}

function deepCopyObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepCopyObject);
  }

  const copy = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepCopyObject(obj[key]);
    }
  }

  return copy;
}
function countInaccessableCells() {
  let count = 0
  for (let row = 0; row < ROW_NUMBER; row++) {
    for (let col = 0; col < COL_NUMBER; col++) {
      if (!gameboardContainer[row][col].isAccessible) {
        count++
      }
    }
    
  }
  return count
}

function pickRandomFinish() {
  finish.row = Math.floor(Math.random()*5)+4,
  finish.col = Math.floor(Math.random()*4)+6
}

function pickRandomStartCell(){
    const randomRow = Math.floor(Math.random()*10)<5?0:ROW_NUMBER-1;
    const randomCol = Math.floor(Math.random()*10)<5?0:COL_NUMBER-1;
    const startingCell = gameboardContainer[randomRow][randomCol];
    startingCell.style.backgroundColor = "black"
    figure.rootCoords.row = randomRow
    figure.rootCoords.col = randomCol
    figure.state = STATES[0]
}

function generateBoard(){
    gameboardContainer=[]
    gameboard.innerHTML=""
    for (let row = 0; row < ROW_NUMBER; row++) {
        gameboardContainer.push([])
      for (let col = 0; col < COL_NUMBER; col++) {
        const cell = document.createElement('div');
        cell.isAccessible = true
        cell.classList.add('cell');
        cell.addEventListener('mousedown',()=>{
          isMouseDown = true
        })
        cell.addEventListener('mouseup',()=>{
          isMouseDown = false
        })
        cell.addEventListener('mouseenter',e=>{
          if(isMouseDown){
            if (brushMode) {
              e.currentTarget.isAccessible = false
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.border = "solid transparent 1px"
            }
            else{
              e.currentTarget.isAccessible = true
              e.currentTarget.style.backgroundColor = "#b9b9c9"
              e.currentTarget.style.border = "solid bisque 1px"
            }
          }
        })

        gameboardContainer[row].push(cell)
        gameboard.appendChild(cell);
      }
    }
    gameboardContainer[finish.row][finish.col].style.backgroundColor = "beige"
    gameboardContainer[finish.row][finish.col].style.border = "solid gold 1px"
}

function isFigureDuplicated(figureArray,figureToCheck) {
  return figureArray.some(prevFigureState => (
    prevFigureState.rootCoords.row === figureToCheck.rootCoords.row &&
    prevFigureState.rootCoords.col === figureToCheck.rootCoords.col &&
    prevFigureState.state === figureToCheck.state
  ));
}

function handleBoardRerender() {
  for (let row = 0; row < gameboardContainer.length; row++) {
    for (let col = 0; col < gameboardContainer[row].length; col++) {
      if(gameboardContainer[row][col].isAccessible){
        gameboardContainer[row][col].style.backgroundColor = "#b9b9c9"
      }
    }
  }
  gameboardContainer[finish.row][finish.col].style.backgroundColor = "beige"
  gameboardContainer[figure.rootCoords.row][figure.rootCoords.col].style.backgroundColor = "black"
  gameboardContainer[figure.rootCoords.row+figure.properties.row][figure.rootCoords.col+figure.properties.col].style.backgroundColor = " black"

}

function checkFall() {
  if (!gameboardContainer[figure.rootCoords.row][figure.rootCoords.col].isAccessible||
    !gameboardContainer[figure.rootCoords.row+figure.properties.row][figure.rootCoords.col+figure.properties.col].isAccessible) 
  {
    handleLose()
  }
}

function getPseudoFall(pseudoFigure) {
  return (!gameboardContainer[pseudoFigure.rootCoords.row][pseudoFigure.rootCoords.col].isAccessible||
    !gameboardContainer[pseudoFigure.rootCoords.row+pseudoFigure.properties.row][pseudoFigure.rootCoords.col+pseudoFigure.properties.col].isAccessible) 
}

function startGame() {
  wrongPathsCalculations = 0
  //confirm() if players wants to play on the same field
  pickRandomFinish()
  generateBoard()
  pickRandomStartCell()
}

function handleAutoMod(){
  console.log("Initiating autoPath finding mod...\nOriginal position: ",figure)
  inaccessableCells = countInaccessableCells()
  console.log(inaccessableCells)
  let autoPath = handlePathFinding([],deepCopyObject(figure),[])
  console.error("Wasted Paths: " + wrongPathsCalculations)
  if (autoPath.length === 0) {
    console.error("Path is not found")
    alert("Path is not found")
    return
  }
  console.log(autoPath,figure)
  for (let step = 0; step < autoPath.length; step++) {
    setTimeout(()=>{
      handleMove(autoPath[step],figure)
      handleBoardRerender()
    },AUTO_PATH_BUILD_DELAY*step);
  }
  setTimeout(()=>{
    if (getIsWin(figure)) {
      alert("Embrace the Power of the Machine!")
      setTimeout(()=>{
        startGame()
      },1200)
    }
    else{
      alert("Machine has failed")
    }
  },autoPath.length*AUTO_PATH_BUILD_DELAY)  
}

function handlePathFinding(prevPath,pseudoFigure,prevStates){
  if(getIsWin(pseudoFigure)){
    if (minPath.length>prevPath.length) {
      minPath = prevPath
    }
    return prevPath
  }
  if (getPseudoFall(pseudoFigure)) {
    wrongPathsCalculations++
    return []
  }
  if ((prevPath.length > MAX_PATH_LEN+(Math.floor(inaccessableCells/10))) || (prevPath.length >= minPath.length && minPath.length != 0)) {
    wrongPathsCalculations++
    return []
  }
  if (isFigureDuplicated(prevStates,pseudoFigure)) {
    wrongPathsCalculations++
    return []
  }
  else{
    prevStates.push(pseudoFigure)
  }
  let potentialPath = [
    {to:"KeyW",figure:deepCopyObject(pseudoFigure)},
    {to:"KeyS",figure:deepCopyObject(pseudoFigure)},
    {to:"KeyA",figure:deepCopyObject(pseudoFigure)},
    {to:"KeyD",figure:deepCopyObject(pseudoFigure)}
  ]
  let localMinPath = []
  for (let path = 0; path < 4; path++) {
    try{
      handleMove(potentialPath[path].to,potentialPath[path].figure)
      let newPrevPath = prevPath.concat([potentialPath[path].to])
      let newPath = handlePathFinding(newPrevPath,potentialPath[path].figure,[].concat(prevStates))
      if (newPath.length > 0) {
        if (localMinPath.length > 0) {
          if (localMinPath.length > newPath.length) {
            localMinPath = newPath
          }
        }
        else {
          localMinPath = newPath
        }
      }
    }catch(err){
      wrongPathsCalculations++
      continue
    }
  }
  return localMinPath
}

function handleMove(move,handledFigure) {
  switch (move) {
    case 'KeyW':
      switch (handledFigure.state) {
        case STATES[0]:
          handledFigure.properties.row++
          handledFigure.rootCoords.row-=2
          handledFigure.state = STATES[2]
          break;
        case STATES[1]:
          handledFigure.rootCoords.row--
          break;
        case STATES[2]:
          if (handledFigure.properties.row<0) {
            handledFigure.rootCoords.row-=2
          }
          else{
            handledFigure.rootCoords.row--
          }
          handledFigure.properties.row=0
          handledFigure.state = STATES[0]
          break;
      }
      break;
    case 'KeyA':
      switch (handledFigure.state) {
        case STATES[0]:
          handledFigure.properties.col++
          handledFigure.rootCoords.col-=2
          handledFigure.state = STATES[1]
          break
        case STATES[1]:
          if (handledFigure.properties.col<0) {
            handledFigure.rootCoords.col-=2
          }
          else{
            handledFigure.rootCoords.col--
          }
          handledFigure.properties.col=0
          handledFigure.state = STATES[0]
          break
        case STATES[2]:
          handledFigure.rootCoords.col--
          break
      }
      break;
    case 'KeyS':
      switch (handledFigure.state) {
        case STATES[0]:
          handledFigure.properties.row--
          handledFigure.rootCoords.row+=2
          handledFigure.state = STATES[2]
          break
        case STATES[1]:
          handledFigure.rootCoords.row++
          break
        case STATES[2]:
          if (handledFigure.properties.row>0) {
            handledFigure.rootCoords.row+=2
          }
          else{
            handledFigure.rootCoords.row++
          }
          handledFigure.properties.row=0
          handledFigure.state = STATES[0]
          break
      }
      break;
    case 'KeyD':
      switch (handledFigure.state) {
        case STATES[0]:
          handledFigure.properties.col--
          handledFigure.rootCoords.col+=2
          handledFigure.state = STATES[1]
          break
        case STATES[1]:
          if (handledFigure.properties.col>0) {
            handledFigure.rootCoords.col+=2
          }
          else{
            handledFigure.rootCoords.col++
          }
          handledFigure.properties.col=0
          handledFigure.state = STATES[0]
          break
        case STATES[2]:
          handledFigure.rootCoords.col++
          break
      }
      break;
      case 'Space':
        brushMode = brushMode?0:1 
        console.log("brush mode changed to: "+ (brushMode?"CLEAR":"PAINT"))
        break
    }
}

function handleLose(){
  alert("Sorry, you have fallen :(")
  startGame()
}

function getIsWin(figureToCheck){
  return figureToCheck.rootCoords.row === finish.row && figureToCheck.rootCoords.col === finish.col && figureToCheck.state === STATES[0] 
}

control.addEventListener('keydown', e => {
  console.log(figure.state)
  try{
      handleMove(e.code,figure)
      checkFall()
      handleBoardRerender()
    }
    catch(err){
      console.log("Handled error: "+err)
      handleLose()
    }
    if (getIsWin(figure)) {
      alert("Gratz! It's a win :)")
      startGame()
    }
});

startGame()
