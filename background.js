// 확장 프로그램 아이콘 클릭 시 실행될 리스너 등록
chrome.action.onClicked.addListener((tab) => {
  // 현재 활성화된 탭의 URL이 네이버 지도로 시작하는지 확인
  if (tab.id && tab.url && tab.url.startsWith("https://map.naver.com")) {
    // 네이버 지도 탭이라면 contentScript.js 파일을 해당 탭에서 실행
    chrome.scripting.executeScript({
      target: { tabId: tab.id }, // 스크립트를 실행할 탭 ID 지정
      files: ["contentScript.js"] // 실행할 스크립트 파일 지정
    }).then(() => {
      console.log("네이버 지도 랜덤 우클릭 스크립트 실행 요청 완료.");
    }).catch(err => {
      console.error("스크립트 실행 요청 실패:", err);
    });
  } else {
    // 네이버 지도 탭이 아닐 경우 콘솔에 메시지 출력
    console.log("현재 탭은 네이버 지도가 아닙니다:", tab.url);
    // 필요하다면 사용자에게 알림을 표시할 수도 있습니다. (예: alert 또는 chrome.notifications API 사용)
  }
}); 