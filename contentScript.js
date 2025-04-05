(() => {
  // 스크립트 중복 실행 방지 및 오버레이 참조 변수
  if (window.naverMapRandomClickExecuting) {
    console.log("이미 랜덤 우클릭 스크립트가 실행 중입니다.");
    return;
  }
  window.naverMapRandomClickExecuting = true; // 실행 중 플래그 설정
  const overlayId = 'naverMapRandomClickOverlay'; // 오버레이 식별 ID

  console.log("네이버 지도 랜덤 우클릭 스크립트 시작 (v4 - 보이는 지도 중앙 정렬).");

  // 이전 오버레이 제거 (있다면)
  const existingOverlay = document.getElementById(overlayId);
  if (existingOverlay) {
    existingOverlay.remove();
  }
  // 이전 클릭 리스너 제거 (안전장치)
  if (window.removeNaverMapOverlayOnClick) {
    document.removeEventListener('click', window.removeNaverMapOverlayOnClick, true);
    window.removeNaverMapOverlayOnClick = null;
  }

  const canvasSelector = "#app-layout > div.sc-1s2kvgn.gRrCqu > div.sc-6t4syl.lijNcU > div > div:nth-child(1) > div > div.mapboxgl-canvas-container.mapboxgl-interactive > canvas";
  const canvas = document.querySelector(canvasSelector);

  if (!canvas) {
    console.error("네이버 지도 캔버스를 찾을 수 없습니다.");
    alert("네이버 지도 캔버스를 찾을 수 없습니다.");
    delete window.naverMapRandomClickExecuting;
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const canvasWidth = Math.max(0, rect.width);
  const canvasHeight = Math.max(0, rect.height);

  if (canvasHeight <= 0) {
      console.error("캔버스 높이가 유효하지 않습니다.");
      delete window.naverMapRandomClickExecuting;
      return;
  }

  // --- 1. 보이는 지도 영역 계산 및 중앙 사각형 오버레이 생성 --- 
  // 왼쪽 패널 너비 계산 (패널이 없을 수도 있음을 고려)
  const leftPanelSelector = "#app-layout > div.sc-wli0gr.bNZoFo > div > div.sc-1wsjitl.jjlEdZ"; // 왼쪽 패널 선택자 (사용자 제공)
  const leftPanel = document.querySelector(leftPanelSelector);
  let leftPanelWidth = 0;
  if (leftPanel && getComputedStyle(leftPanel).display !== 'none') {
      leftPanelWidth = leftPanel.getBoundingClientRect().width;
  }
  console.log(`왼쪽 패널 너비 추정: ${leftPanelWidth.toFixed(0)}px`);

  const visibleMapWidth = canvasWidth - leftPanelWidth;
  const squareSize = Math.min(visibleMapWidth, canvasHeight); // 너비와 높이 중 작은 값으로 정사각형 크기 결정 (화면 왜곡 방지)
  
  // 정사각형 위치 계산 (보이는 지도 영역 기준 중앙)
  const squareTop = rect.top + (canvasHeight - squareSize) / 2; // 세로 중앙
  const squareLeft = rect.left + leftPanelWidth + (visibleMapWidth - squareSize) / 2; // 가로 중앙

  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.style.position = 'absolute';
  overlay.style.top = `${squareTop}px`;
  overlay.style.left = `${squareLeft}px`;
  overlay.style.width = `${squareSize}px`;
  overlay.style.height = `${squareSize}px`;
  overlay.style.border = '2px dashed rgba(255, 0, 0, 0.7)'; // 빨간 점선 테두리만
  // overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.05)'; // 배경색 제거
  overlay.style.zIndex = '10000';
  overlay.style.pointerEvents = 'none';

  document.body.appendChild(overlay);
  console.log(`중앙 사각형 표시 (보이는 지도 기준): top=${squareTop.toFixed(0)}, left=${squareLeft.toFixed(0)}, size=${squareSize.toFixed(0)}`);

  // --- 2. 랜덤 좌표를 사각형 내부로 제한 --- 
  // 사각형 내부의 랜덤 좌표 생성 (사각형 기준 0 ~ size)
  const randomXInSquare = Math.random() * squareSize;
  const randomYInSquare = Math.random() * squareSize;

  // 화면(Viewport) 기준 좌표 계산
  const clientX = squareLeft + randomXInSquare;
  const clientY = squareTop + randomYInSquare;

  console.log(`캔버스 크기: ${canvasWidth.toFixed(0)}x${canvasHeight.toFixed(0)}`);
  console.log(`보이는 지도 너비 추정: ${visibleMapWidth.toFixed(0)}px`);
  console.log(`사각형 내부 랜덤 좌표 (사각형 기준): (${randomXInSquare.toFixed(2)}, ${randomYInSquare.toFixed(2)})`);
  console.log(`뷰포트 기준 클릭 좌표 (Client): (${clientX.toFixed(2)}, ${clientY.toFixed(2)})`);

  // --- 3. 이벤트 발생 --- 
  const commonEventOptions = {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 2,
    buttons: 2,
    clientX: clientX,
    clientY: clientY
  };

  const mouseDownEvent = new MouseEvent('mousedown', commonEventOptions);
  canvas.dispatchEvent(mouseDownEvent);
  const mouseUpEvent = new MouseEvent('mouseup', commonEventOptions);
  canvas.dispatchEvent(mouseUpEvent);
  const contextMenuEvent = new MouseEvent('contextmenu', commonEventOptions);

  try {
    canvas.dispatchEvent(contextMenuEvent);
    console.log(`랜덤 좌표(${clientX.toFixed(0)}, ${clientY.toFixed(0)})에 이벤트 발생 완료.`);
    if (contextMenuEvent.defaultPrevented) {
        console.log("기본 contextmenu 동작 방지됨.");
    } else {
        console.warn("기본 contextmenu 동작 방지 안됨.");
    }
  } catch (error) {
    console.error("이벤트 발생 중 오류:", error);
    alert("지도에 이벤트를 발생시키는 중 오류가 발생했습니다.");
  }

  // --- 4. 오버레이 제거를 위한 클릭 리스너 추가 --- 
  window.removeNaverMapOverlayOnClick = (event) => {
    const overlayElement = document.getElementById(overlayId);
    if (!overlayElement) {
      document.removeEventListener('click', window.removeNaverMapOverlayOnClick, true);
      window.removeNaverMapOverlayOnClick = null;
      return;
    }
    const overlayRect = overlayElement.getBoundingClientRect();
    if (event.clientX < overlayRect.left || event.clientX > overlayRect.right ||
        event.clientY < overlayRect.top || event.clientY > overlayRect.bottom) {
      console.log("오버레이 외부 클릭 감지됨. 오버레이 제거.");
      overlayElement.remove();
      document.removeEventListener('click', window.removeNaverMapOverlayOnClick, true);
      window.removeNaverMapOverlayOnClick = null;
    } else {
       // console.log("오버레이 내부 클릭 감지됨. 오버레이 유지."); // 내부 클릭 로그는 제거
    }
  };
  document.addEventListener('click', window.removeNaverMapOverlayOnClick, true);

  // 스크립트 실행 완료 후 플래그 해제
  setTimeout(() => {
    delete window.naverMapRandomClickExecuting;
  }, 0);

})(); 