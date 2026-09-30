// 미리 정해진 메뉴 목록
let myMenus = ["짜장면", "치킨", "피자", "돈가스", "떡볶이"];

// 사다리 게임 관련 변수
let ladderCanvas, ladderCtx;
let ladderStructure = [];
let isGameRunning = false;
let selectedMenuIndex = -1;
let pathHistory = []; // 궤적 효과를 위한 경로 기록

// 페이지가 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    // 버튼 이벤트 연결
    document.getElementById('start-game').addEventListener('click', startLadderGame);
    document.getElementById('edit-menus').addEventListener('click', toggleEditSection);
    document.getElementById('add-new-menu').addEventListener('click', addNewMenu);
    document.getElementById('save-menus').addEventListener('click', saveMenuChanges);
    
    // 저장된 메뉴 불러오기
    loadMenus();
    
    // 엔터키로 새 메뉴 추가
    document.getElementById('new-menu-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewMenu();
        }
    });
    
    // Canvas 초기화
    ladderCanvas = document.getElementById('ladder-canvas');
    ladderCtx = ladderCanvas.getContext('2d');
});



// 사다리 게임 시작
function startLadderGame() {
    if (myMenus.length < 2) {
        alert("최소 2개 이상의 메뉴가 필요합니다!");
        return;
    }
    
    if (isGameRunning) return;
    
    isGameRunning = true;
    selectedMenuIndex = -1;
    
    const gameArea = document.getElementById('game-area');
    const gameResult = document.getElementById('game-result');
    const startSelection = document.getElementById('start-selection');
    const menuButtons = document.getElementById('menu-buttons');
    
    gameArea.classList.add('active');
    gameResult.classList.remove('active');
    startSelection.style.display = 'block';
    
    // 메뉴 선택 버튼 생성
    menuButtons.innerHTML = '';
    myMenus.forEach((menu, index) => {
        const button = document.createElement('button');
        button.className = 'menu-button';
        button.textContent = (index + 1).toString(); // 번호로 표시
        button.onclick = () => selectMenu(index);
        menuButtons.appendChild(button);
    });
    
    // 사다리 구조 생성
    createLadderStructure();
    
    // 사다리 그리기 (메뉴 숨김)
    drawLadder(false);
}

// 메뉴 선택
function selectMenu(index) {
    selectedMenuIndex = index;
    
    // 선택한 버튼 하이라이트
    const buttons = document.querySelectorAll('.menu-button');
    buttons.forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    
    // 선택 화면 숨기고 게임 시작
    setTimeout(() => {
        document.getElementById('start-selection').style.display = 'none';
        playLadderGame();
    }, 500);
}

// 메뉴 수정 섹션 토글
function toggleEditSection() {
    const editSection = document.getElementById('edit-section');
    const isHidden = editSection.style.display === 'none' || editSection.style.display === '';
    
    if (isHidden) {
        editSection.classList.add('active');
        editSection.style.display = 'block';
        loadEditMenus();
    } else {
        editSection.classList.remove('active');
        editSection.style.display = 'none';
    }
}

// 수정할 메뉴 목록 로드
function loadEditMenus() {
    const editMenuList = document.getElementById('edit-menu-list');
    editMenuList.innerHTML = '';
    
    myMenus.forEach((menu, index) => {
        const div = document.createElement('div');
        div.className = 'edit-menu-item';
        div.innerHTML = `
            <input type="text" value="${menu}" data-index="${index}">
            <button onclick="removeMenu(${index})">삭제</button>
        `;
        editMenuList.appendChild(div);
    });
}

// 새 메뉴 추가
function addNewMenu() {
    const input = document.getElementById('new-menu-input');
    const menuName = input.value.trim();
    
    if (menuName === "") {
        alert("메뉴 이름을 입력해주세요!");
        return;
    }
    
    if (myMenus.includes(menuName)) {
        alert("이미 있는 메뉴입니다!");
        return;
    }
    
    myMenus.push(menuName);
    input.value = "";
    loadEditMenus();
}

// 메뉴 삭제
function removeMenu(index) {
    if (myMenus.length <= 2) {
        alert("최소 2개 이상의 메뉴가 필요합니다!");
        return;
    }
    
    myMenus.splice(index, 1);
    loadEditMenus();
}

// 메뉴 변경 저장
function saveMenuChanges() {
    const editMenuList = document.getElementById('edit-menu-list');
    const inputs = editMenuList.querySelectorAll('input');
    
    const newMenus = [];
    inputs.forEach(input => {
        const menuName = input.value.trim();
        if (menuName !== "") {
            newMenus.push(menuName);
        }
    });
    
    if (newMenus.length < 2) {
        alert("최소 2개 이상의 메뉴가 필요합니다!");
        return;
    }
    
    myMenus = newMenus;
    saveMenus();
    
    // 수정 섹션 닫기
    document.getElementById('edit-section').classList.remove('active');
    document.getElementById('edit-section').style.display = 'none';
    
    alert("메뉴가 저장되었습니다! 이제 게임을 시작할 수 있습니다.");
}

// 메뉴 저장 (localStorage 사용)
function saveMenus() {
    localStorage.setItem('myMenus', JSON.stringify(myMenus));
}

// 메뉴 불러오기
function loadMenus() {
    const savedMenus = localStorage.getItem('myMenus');
    if (savedMenus) {
        myMenus = JSON.parse(savedMenus);
    }
}

// 사다리 구조 생성
function createLadderStructure() {
    const numParticipants = myMenus.length;
    const numLines = 8; // 가로줄 개수
    
    ladderStructure = [];
    
    // 세로줄 초기화
    for (let i = 0; i < numParticipants; i++) {
        ladderStructure.push({
            vertical: true,
            horizontalConnections: [] // 연결된 가로줄 정보
        });
    }
    
    // 사용된 행 추적 (가로줄 겹침 방지)
    const usedRows = new Set();
    
    // 각 인접한 세로줄 쌍에 최소 하나의 가로줄 보장
    for (let col = 0; col < numParticipants - 1; col++) {
        let foundConnection = false;
        let attempts = 0;
        
        while (!foundConnection && attempts < numLines) {
            const randomRow = Math.floor(Math.random() * numLines);
            
            // 해당 행이 이미 사용되었는지 확인
            if (!usedRows.has(randomRow)) {
                // 해당 세로줄들에 이미 이 행에 가로줄이 있는지 확인
                const hasConnectionInRow = ladderStructure[col].horizontalConnections.some(c => c.row === randomRow) ||
                                         ladderStructure[col + 1].horizontalConnections.some(c => c.row === randomRow);
                
                if (!hasConnectionInRow) {
                    // 인접한 세로줄 연결
                    ladderStructure[col].horizontalConnections.push({
                        row: randomRow,
                        connectedTo: col + 1
                    });
                    ladderStructure[col + 1].horizontalConnections.push({
                        row: randomRow,
                        connectedTo: col
                    });
                    
                    usedRows.add(randomRow);
                    foundConnection = true;
                }
            }
            attempts++;
        }
    }
    
    // 추가 가로줄 생성 (최대 개수까지)
    const maxAdditionalLines = Math.floor(numLines / 2);
    let additionalLines = 0;
    
    while (additionalLines < maxAdditionalLines) {
        const randomRow = Math.floor(Math.random() * numLines);
        const randomCol = Math.floor(Math.random() * (numParticipants - 1));
        
        // 해당 행이 이미 사용되었는지 확인
        if (!usedRows.has(randomRow)) {
            // 해당 세로줄들에 이미 이 행에 가로줄이 있는지 확인
            const hasConnectionInRow = ladderStructure[randomCol].horizontalConnections.some(c => c.row === randomRow) ||
                                     ladderStructure[randomCol + 1].horizontalConnections.some(c => c.row === randomRow);
            
            if (!hasConnectionInRow) {
                // 인접한 세로줄 연결
                ladderStructure[randomCol].horizontalConnections.push({
                    row: randomRow,
                    connectedTo: randomCol + 1
                });
                ladderStructure[randomCol + 1].horizontalConnections.push({
                    row: randomRow,
                    connectedTo: randomCol
                });
                
                usedRows.add(randomRow);
                additionalLines++;
            }
        }
    }
}

// 사다리 그리기
function drawLadder(showMenus = false) {
    const canvas = ladderCanvas;
    const ctx = ladderCtx;
    
    // Canvas 크기 설정
    const width = 600;
    const height = 400;
    canvas.width = width;
    canvas.height = height;
    
    // 배경 지우기
    ctx.clearRect(0, 0, width, height);
    
    const numParticipants = myMenus.length;
    const colWidth = width / (numParticipants + 1);
    const rowHeight = height / 10;
    
    // 세로줄 그리기
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < numParticipants; i++) {
        const x = colWidth * (i + 1);
        ctx.beginPath();
        ctx.moveTo(x, rowHeight);
        ctx.lineTo(x, height - rowHeight);
        ctx.stroke();
        
        // 상단 번호 표시
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText((i + 1).toString(), x, rowHeight - 10);
        
        // 하단 메뉴 이름 표시 (showMenus가 true일 때만)
        if (showMenus) {
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.fillText(myMenus[i], x, height - rowHeight + 25);
        } else {
            ctx.fillStyle = '#999';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('?', x, height - rowHeight + 25);
        }
    }
    
    // 가로줄 그리기
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < ladderStructure.length; i++) {
        const connections = ladderStructure[i].horizontalConnections;
        
        connections.forEach(conn => {
            const x1 = colWidth * (i + 1);
            const x2 = colWidth * (conn.connectedTo + 1);
            const y = rowHeight * (conn.row + 2);
            
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();
        });
    }
}

// 사다리 게임 실행
function playLadderGame() {
    const numParticipants = myMenus.length;
    const colWidth = ladderCanvas.width / (numParticipants + 1);
    const rowHeight = ladderCanvas.height / 10;
    const ctx = ladderCtx;
    
    // 선택한 메뉴에서 시작
    let currentCol = selectedMenuIndex;
    let currentRow = 0; // 시작 행을 0으로 변경
    
    // 경로 기록 초기화
    pathHistory = [];
    
    // 시작 위치 기록
    const startX = colWidth * (currentCol + 1);
    const startY = rowHeight * (currentRow + 1);
    pathHistory.push({ x: startX, y: startY });
    
    // 애니메이션으로 사다리 따라가기
    function animateLadder() {
        // 다음 위치 계산
        const connections = ladderStructure[currentCol].horizontalConnections;
        const currentConnection = connections.find(c => c.row === currentRow);
        
        // 현재 위치
        const currentX = colWidth * (currentCol + 1);
        const currentY = rowHeight * (currentRow + 1);
        
        if (currentConnection) {
            // 가로줄이 있으면 먼저 세로로 가로줄 높이까지 내려감
            const ladderY = rowHeight * (currentRow + 2);
            moveVertical(ctx, colWidth, rowHeight, currentX, currentY, currentX, ladderY, () => {
                // 가로줄 따라 좌/우 이동
                const targetX = colWidth * (currentConnection.connectedTo + 1);
                moveHorizontal(ctx, colWidth, rowHeight, currentX, ladderY, targetX, ladderY, () => {
                    // 다시 세로로 내려감
                    currentCol = currentConnection.connectedTo;
                    currentRow++;
                    animateLadder();
                });
            });
        } else if (currentRow < 7) { // 7로 변경 (numLines - 1)
            // 가로줄이 없으면 수직 이동
            const nextY = rowHeight * (currentRow + 2);
            moveVertical(ctx, colWidth, rowHeight, currentX, currentY, currentX, nextY, () => {
                currentRow++;
                animateLadder();
            });
        } else {
            // 도착
            showResult(currentCol);
        }
    }
    
    // 수직 이동 함수
    function moveVertical(ctx, colWidth, rowHeight, fromX, fromY, toX, toY, callback) {
        let progress = 0;
        const totalFrames = 20; // 전체 프레임 수 고정
        let currentFrame = 0;
        
        function animate() {
            currentFrame++;
            progress = currentFrame / totalFrames; // 선형 프로그레스
            
            if (progress >= 1) {
                pathHistory.push({ x: toX, y: toY });
                callback();
                return;
            }
            
            // 선형 이동
            const newX = fromX + (toX - fromX) * progress;
            const newY = fromY + (toY - fromY) * progress;
            
            drawLadder(false);
            drawTrail(ctx);
            
            // 현재 이동 경로 표시
            ctx.strokeStyle = 'rgba(51, 51, 51, 0.6)';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(newX, newY);
            ctx.stroke();
            
            // 현재 위치에 공 그리기
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(newX, newY, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(51, 51, 51, 0.2)';
            ctx.beginPath();
            ctx.arc(newX, newY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    // 수평 이동 함수
    function moveHorizontal(ctx, colWidth, rowHeight, fromX, fromY, toX, toY, callback) {
        let progress = 0;
        const totalFrames = 20; // 전체 프레임 수 고정
        let currentFrame = 0;
        
        function animate() {
            currentFrame++;
            progress = currentFrame / totalFrames; // 선형 프로그레스
            
            if (progress >= 1) {
                pathHistory.push({ x: toX, y: toY });
                callback();
                return;
            }
            
            // 선형 이동
            const newX = fromX + (toX - fromX) * progress;
            const newY = fromY; // Y축 고정
            
            drawLadder(false);
            drawTrail(ctx);
            
            // 현재 이동 경로 표시
            ctx.strokeStyle = 'rgba(51, 51, 51, 0.6)';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(newX, newY);
            ctx.stroke();
            
            // 현재 위치에 공 그리기
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(newX, newY, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(51, 51, 51, 0.2)';
            ctx.beginPath();
            ctx.arc(newX, newY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    animateLadder();
}

// 부드러운 이동을 위한 이징 함수
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// 궤적 그리기
function drawTrail(ctx) {
    if (pathHistory.length < 2) return;
    
    // 궤적 스타일 설정
    ctx.strokeStyle = 'rgba(51, 51, 51, 0.4)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 궤적 그리기
    ctx.beginPath();
    ctx.moveTo(pathHistory[0].x, pathHistory[0].y);
    
    for (let i = 1; i < pathHistory.length; i++) {
        ctx.lineTo(pathHistory[i].x, pathHistory[i].y);
    }
    
    ctx.stroke();
}

// 결과 표시
function showResult(finalCol) {
    const gameResult = document.getElementById('game-result');
    const selectedMenu = myMenus[finalCol];
    
    // 사다리 다시 그리기 (메뉴 보이기)
    drawLadder(true);
    
    // 랜덤 이모지 선택
    const emojis = ['🎉', '🍕', '🍜', '🍔', '🍣', '🥗', '🍿', '🎵', '✨', '🌟'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    gameResult.innerHTML = `
        <div class="result-title">${randomEmoji} 오늘의 추천 메뉴</div>
        <div class="result-menu">${selectedMenu}</div>
        <div class="result-note">사다리 게임 결과</div>
    `;
    
    gameResult.classList.add('active');
    isGameRunning = false;
}


