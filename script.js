// Helper function to format numbers with leading zeros
function formatTime(unit) {
    return unit < 10 ? '0' + unit : unit;
}

// Function to get current KST time
function getKstNow() {
    const now = new Date();
    // Get the UTC time
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // Create a new Date object for KST (UTC+9)
    const kstOffset = 9 * 60 * 60 * 1000;
    return new Date(utc + kstOffset);
}

// Countdown function (similar to your Streamlit JS, but integrated for multiple timers)
function setupCountdown(elementId, targetHour, targetMinute) {
    const kstNow = getKstNow();
    let targetTime = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate(), targetHour, targetMinute, 0, 0);

    // If target time has already passed today, set it for tomorrow
    if (kstNow.getTime() > targetTime.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    const countDownDate = targetTime.getTime();

    // Clear any existing interval for this element to prevent multiple timers
    if (window.countdownIntervals && window.countdownIntervals[elementId]) {
        clearInterval(window.countdownIntervals[elementId]);
    }

    function updateCountdown() {
        const now = getKstNow().getTime();
        const distance = countDownDate - now;

        const countdownElement = document.getElementById(elementId);
        if (!countdownElement) {
            clearInterval(window.countdownIntervals[elementId]); // Stop if element no longer exists
            return;
        }

        if (distance < 0) {
            countdownElement.innerHTML = "시간 종료";
            clearInterval(window.countdownIntervals[elementId]);
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `${formatTime(hours)}시간 ${formatTime(minutes)}분 ${formatTime(seconds)}초`;
    }

    updateCountdown(); // Initial call
    const interval = setInterval(updateCountdown, 1000);
    // Store interval ID to clear it later if needed
    window.countdownIntervals = window.countdownIntervals || {};
    window.countdownIntervals[elementId] = interval;
}

// Function to render page content based on selection
function renderPage(pageName) {
    const pageContentDiv = document.getElementById('page-content');
    pageContentDiv.innerHTML = ''; // Clear previous content

    // Clear all existing countdown intervals when changing pages
    if (window.countdownIntervals) {
        for (const key in window.countdownIntervals) {
            clearInterval(window.countdownIntervals[key]);
        }
        window.countdownIntervals = {}; // Reset the storage
    }

    const kstNow = getKstNow();
    const year = kstNow.getFullYear();
    // JavaScript getDay() returns 0 for Sunday, 1 for Monday... 6 for Saturday
    const weekday = kstNow.getDay(); // 0 (Sunday) to 6 (Saturday)
    // 연초부터 현재까지의 주차 계산 (단순화된 방식)
    const firstDayOfYear = new Date(kstNow.getFullYear(), 0, 1);
    const daysSinceYearStart = (kstNow.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24);
    const week_num = Math.ceil((daysSinceYearStart + firstDayOfYear.getDay() + 1) / 7); // 첫주의 시작 요일 고려


    const WEEKDAY_STR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekday_str = WEEKDAY_STR[weekday];

    let contentHTML = '';

    switch (pageName) {
        case 'home':
            contentHTML = `
                <div class="countdown-section">
                    <h2 class="countdown-title">점심 식사 11:50까지 남은 시간</h2>
                    <div id="lunchCountdown" class="countdown">Loading...</div>
                </div>
                <div class="countdown-section">
                    <h2 class="countdown-title">저녁 식사 16:50까지 남은 시간</h2>
                    <div id="dinnerCountdown" class="countdown">Loading...</div>
                </div>
                <div class="countdown-section">
                    <h2 class="countdown-title">핸드폰 반납 20:50까지 남은 시간</h2>
                    <div id="phoneReturnCountdown" class="countdown">Loading...</div>
                </div>
            `;
            pageContentDiv.innerHTML = contentHTML;
            setupCountdown('lunchCountdown', 11, 50);
            setupCountdown('dinnerCountdown', 16, 50);
            setupCountdown('phoneReturnCountdown', 20, 50);
            break;
        case 'weekday':
            const isTodayWeekday = (weekday >= 1 && weekday <= 5); // Monday to Friday
            contentHTML = `
                <h2>${weekday_str}, Week ${week_num} of the year ${year}</h2>
                <p>${isTodayWeekday ? 'Today is a Weekday!' : 'Today is not a Weekday.'}</p>
                <p>평일에는 주로 규칙적인 일과를 수행합니다.</p>
                <ul>
                    <li>오전 9시: 업무 시작</li>
                    <li>오후 12시: 점심 시간</li>
                    <li>오후 6시: 업무 종료</li>
                </ul>
            `;
            pageContentDiv.innerHTML = contentHTML;
            break;
        case 'weekend':
            const isTodayWeekend = (weekday === 0 || weekday === 6); // Sunday or Saturday
            contentHTML = `
                <h2>${weekday_str}, Week ${week_num} of the year ${year}</h2>
                <p>${isTodayWeekend ? 'Enjoy your Weekend!' : 'It\'s not the weekend yet.'}</p>
                <p>주말에는 휴식과 취미 활동을 즐깁니다.</p>
                <ul>
                    <li>늦잠 자기</li>
                    <li>영화 감상</li>
                    <li>친구들과의 만남</li>
                </ul>
            `;
            pageContentDiv.innerHTML = contentHTML;
            break;
        case 'saturday-brunch':
            const isBrunchWeek = (week_num % 2 !== 0); // Odd week numbers for brunch (홀수 주차)
            const isSaturday = (weekday === 6); // Saturday
            contentHTML = `
                <h2>${weekday_str}, Week ${week_num} of the year ${year}</h2>
                <p>Is it Saturday? ${isSaturday ? 'Yes!' : 'No.'}</p>
                <p>Is it a Brunch Week (Odd week number)? ${isBrunchWeek ? 'Yes!' : 'No.'}</p>
                <p>${isSaturday && isBrunchWeek ? 'It\'s Saturday Brunch time! 🥞' : 'No Saturday Brunch today. 😔'}</p>
                ${isSaturday && isBrunchWeek ? '<p>맛있는 브런치를 즐길 시간입니다!</p>' : '<p>이번 주 토요일은 브런치 주간이 아닙니다. 다음 기회를 노려보세요!</p>'}
            `;
            pageContentDiv.innerHTML = contentHTML;
            break;
        default:
            contentHTML = `<p>Page not found.</p>`;
            pageContentDiv.innerHTML = contentHTML;
    }

    // 페이지 렌더링 후 사이드바 닫기 (모바일에서 유용)
    closeSidebar();
}

// -------------------- 사이드바 제어 함수 --------------------
function openSidebar() {
    document.getElementById("mySidebar").classList.add("active");
    document.body.classList.add("sidebar-open"); // 콘텐츠 마진 조정을 위한 클래스
}

function closeSidebar() {
    document.getElementById("mySidebar").classList.remove("active");
    document.body.classList.remove("sidebar-open"); // 콘텐츠 마진 조정 클래스 제거
}

// -------------------- 초기화 및 이벤트 리스너 --------------------
document.addEventListener('DOMContentLoaded', () => {
    // 사이드바 버튼 요소 가져오기
    const openSidebarBtn = document.getElementById("openSidebarBtn");
    const closeSidebarBtn = document.getElementById("closeSidebarBtn");
    const menuItems = document.querySelectorAll('.option-menu .menu-item');

    // 이벤트 리스너 연결
    openSidebarBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);

    menuItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior
            // Remove 'active' class from all items
            menuItems.forEach(i => i.classList.remove('active'));
            // Add 'active' class to the clicked item
            this.classList.add('active');
            // Render the corresponding page
            const page = this.dataset.page;
            renderPage(page);
        });
    });

    // Render the home page by default on load
    renderPage('home');
});