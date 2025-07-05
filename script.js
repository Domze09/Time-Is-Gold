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



/**

 * 한국 시간(KST) 기준으로 현재 주차(ISO 8601 방식: 월요일 시작, 첫 목요일이 있는 주가 Week 1)를 계산합니다.

 * @param {Date} date KST 기준 Date 객체

 * @returns {number} 주차 (1부터 시작)

 */

function getIsoWeekNumberKST(date) {

    // Create a new Date object from the input date to avoid modifying the original

    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));



    // Set to Thursday of the current week (ISO 8601 week starts on Monday)

    // getUTCDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday

    // (d.getUTCDay() || 7) converts Sunday (0) to 7 for consistent calculation

    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));



    // January 4th of the current year is always in Week 1

    const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 1));

    const firstThursday = new Date(Date.UTC(yearStart.getFullYear(), 0, 1 + 4 - (yearStart.getUTCDay() || 7)));



    // Calculate the number of weeks between the two Thursdays

    // Add 1 to the day difference before dividing by 7 to correctly include the current week.

    return Math.ceil(((d - firstThursday) / 86400000 + 1) / 7);

}



// 2025년 한국 공휴일 목록 (YYYY-MM-DD 형식)

// 근로자의 날(5월 1일)은 법정 공휴일이 아니므로 제외했습니다.

const KOREA_PUBLIC_HOLIDAYS_2025 = new Set([

    "2025-01-01", // 신정

    "2025-01-28", // 설날 연휴

    "2025-01-29", // 설날

    "2025-01-30", // 설날 연휴

    "2025-03-03", // 삼일절 대체공휴일 (3월 1일 토요일의 대체)

    "2025-05-05", // 어린이날 & 부처님 오신 날

    "2025-05-06", // 어린이날 & 부처님 오신 날 대체공휴일

    "2025-06-06", // 현충일

    "2025-08-15", // 광복절

    "2025-10-03", // 개천절

    "2025-10-05", // 추석 연휴 (일요일)

    "2025-10-06", // 추석

    "2025-10-07", // 추석 연휴

    "2025-10-08", // 추석 대체공휴일 (10월 5일 일요일의 대체)

    "2025-10-09", // 한글날

    "2025-12-25"  // 크리스마스

]);



/**

 * 주어진 KST 날짜가 한국 공휴일인지 확인합니다.

 * @param {Date} date KST 기준 Date 객체

 * @returns {boolean} 공휴일이면 true, 아니면 false

 */

function isPublicHolidayKST(date) {

    const year = date.getFullYear();

    const month = formatTime(date.getMonth() + 1); // getMonth() is 0-indexed

    const day = formatTime(date.getDate());

    const dateString = `${year}-${month}-${day}`;

    return KOREA_PUBLIC_HOLIDAYS_2025.has(dateString); // Use Set.has() for O(1) average time complexity

}



// Store countdown interval IDs to manage them

const countdownIntervals = {};



// Countdown function

function setupCountdown(elementId, targetHour, targetMinute) {

    // Clear any existing interval for this element to prevent multiple timers

    if (countdownIntervals[elementId]) {

        clearInterval(countdownIntervals[elementId]);

    }



    function updateCountdown() {

        const kstNow = getKstNow(); // Get current KST time inside the loop

        let targetTime = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate(), targetHour, targetMinute, 0, 0);



// 의미 없는 계산

/**     // If the target time for today has already passed, set it for tomorrow

*        if (kstNow.getTime() > targetTime.getTime()) {

*            targetTime.setDate(targetTime.getDate());

*        }

*/

        const countDownDate = targetTime.getTime(); // Recalculate countDownDate each time

        const now = kstNow.getTime(); // Use the current kstNow for comparison

        const distance = countDownDate - now;



        const countdownElement = document.getElementById(elementId);

        if (!countdownElement) {

            clearInterval(countdownIntervals[elementId]); // Stop if element no longer exists

            delete countdownIntervals[elementId];

            return;

        }



        // If the countdown is finished

        if (distance <= 0) {

            countdownElement.innerHTML ="<span style='font-size: 0.6em; color: #888;'>Past time does not wait for you.</span>";

            clearInterval(countdownIntervals[elementId]);

            delete countdownIntervals[elementId];

            return;

        }



        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        const seconds = Math.floor((distance % (1000 * 60)) / 1000);



        countdownElement.innerHTML = `${formatTime(hours)}시간 ${formatTime(minutes)}분 ${formatTime(seconds)}초`;

    }



    updateCountdown(); // Initial call to display immediately

    const interval = setInterval(updateCountdown, 1000);

    countdownIntervals[elementId] = interval; // Store the interval ID

}



/**

 * 날짜와 조건에 따라 적절한 카운트다운 HTML 콘텐츠를 생성하고 타이머를 설정합니다.

 * @param {Date} kstNow 현재 KST 날짜 객체

 * @param {number} weekday 현재 요일 (0=일, 6=토)

 * @param {number} week_num ISO 주차

 * @param {boolean} isHoliday 공휴일 여부

 * @param {object} forceTypeFlags 객체로 강제 타입 플래그 전달 { forceWeekdayType, forceWeekendType, forceBrunchType }

 * @returns {string} 생성된 HTML 콘텐츠

 */

function getCountdownContent(kstNow, weekday, week_num, isHoliday, { forceWeekdayType = false, forceWeekendType = false, forceBrunchType = false } = {}) {

    const isTodayWeekday = (weekday >= 1 && weekday <= 5); // 월요일(1) ~ 금요일(5)

    const isSaturday = (weekday === 6); // 토요일

    let contentHTML = '';



    // Clear all existing timers before setting up new ones

    for (const key in countdownIntervals) {

        clearInterval(countdownIntervals[key]);

        delete countdownIntervals[key];

    }



    // Determine the content based on forced types or current date conditions

    if (forceWeekdayType) { // 평일 페이지

        contentHTML = `

            <div class="countdown-section">

                <h2 class="countdown-title">저녁 식사 16:50까지 남은 시간</h2>

                <div id="dinnerCountdown" class="countdown">Loading...</div>

            </div>

            <div class="countdown-section">

                <h2 class="countdown-title">핸드폰 반납 20:50까지 남은 시간</h2>

                <div id="phoneReturnCountdown" class="countdown">Loading...</div>

            </div>

        `;

        // Use a small timeout to ensure DOM elements are rendered before setupCountdown runs

        setTimeout(() => {

            setupCountdown('dinnerCountdown', 16, 50);

            setupCountdown('phoneReturnCountdown', 20, 50);

        }, 0);

    } else if (forceBrunchType) { // Saturday Brunch 페이지 (토요일 브런치 O 고정)

        contentHTML = `

            <div class="countdown-section">

                <h2 class="countdown-title">브런치 식사 10:20까지 남은 시간</h2>

                <div id="brunchCountdown" class="countdown">Loading...</div>

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

        setTimeout(() => {

            setupCountdown('brunchCountdown', 10, 20);

            setupCountdown('dinnerCountdown', 16, 50);

            setupCountdown('phoneReturnCountdown', 20, 50);

        }, 0);

    } else if (forceWeekendType) { // Weekend 페이지 (토요일, 일요일 기준)

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

        setTimeout(() => {

            setupCountdown('lunchCountdown', 11, 50);

            setupCountdown('dinnerCountdown', 16, 50);

            setupCountdown('phoneReturnCountdown', 20, 50);

        }, 0);

    }

    // Home page or other conditional content (original logic maintained)

    else if (isTodayWeekday && !isHoliday) {

        // 평일 (공휴일 아님)

        contentHTML = `

            <div class="countdown-section">

                <h2 class="countdown-title">저녁 식사 16:50까지 남은 시간</h2>

                <div id="dinnerCountdown" class="countdown">Loading...</div>

            </div>

            <div class="countdown-section">

                <h2 class="countdown-title">핸드폰 반납 20:50까지 남은 시간</h2>

                <div id="phoneReturnCountdown" class="countdown">Loading...</div>

            </div>

        `;

        setTimeout(() => {

            setupCountdown('dinnerCountdown', 16, 50);

            setupCountdown('phoneReturnCountdown', 20, 50);

        }, 0);

    } else if (isSaturday && (week_num % 2 !== 0) && !isHoliday) {

        // 토요일 & 브런치 주간 (홀수 주차) & 공휴일 아님

        contentHTML = `

            <div class="countdown-section">

                <h2 class="countdown-title">브런치 식사 10:20까지 남은 시간</h2>

                <div id="brunchCountdown" class="countdown">Loading...</div>

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

        setTimeout(() => {

            setupCountdown('brunchCountdown', 10, 20);

            setupCountdown('dinnerCountdown', 16, 50);

            setupCountdown('phoneReturnCountdown', 20, 50);

        }, 0);

    } else {

        // 토요일 (브런치 X) / 일요일 / 공휴일 (평일이든 주말이든)

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

        setTimeout(() => {

            setupCountdown('lunchCountdown', 11, 50);

            setupCountdown('dinnerCountdown', 16, 50);

            setupCountdown('phoneReturnCountdown', 20, 50);

        }, 0);

    }

    return contentHTML;

}





// Function to render page content based on selection

function renderPage(pageName) {

    const pageContentDiv = document.getElementById('page-content');

    if (!pageContentDiv) {

        console.error("Element with ID 'page-content' not found.");

        return;

    }

    pageContentDiv.innerHTML = ''; // Clear previous content



    // Clear all existing countdown intervals when changing pages

    for (const key in countdownIntervals) {

        clearInterval(countdownIntervals[key]);

        delete countdownIntervals[key];

    }



    const kstNow = getKstNow();

    const year = kstNow.getFullYear();

    const weekday = kstNow.getDay(); // 0 (Sunday) to 6 (Saturday)

    const week_num = getIsoWeekNumberKST(kstNow); // ISO 8601 week number calculation

    const isHoliday = isPublicHolidayKST(kstNow); // Public holiday check



    const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const weekday_str = WEEKDAY_NAMES[weekday];



    let contentHTML = '';



    switch (pageName) {

        case 'home':
            const isTodayWeekday = (weekday >= 1 && weekday <= 5); // Monday to Friday
            const isSaturday = (weekday === 6); // Saturday
            const isTodayBrunchDay = isSaturday && (week_num % 2 !== 0) && !isHoliday; // Saturday, odd week, and not a holiday

            let statusMessage = '';
                   if (isHoliday) {statusMessage = 'Today is a public holiday! 🥳';} 
                   else if (isTodayWeekday) {statusMessage = 'Today is a weekday. 💼';}
                   else if (isTodayBrunchDay) {statusMessage = 'Today is Saturday with brunch! 🥞';}
                   else if (isSaturday) {statusMessage = 'Today is Saturday (No brunch). ☕';}
                   else { SundaystatusMessage = 'Today is Sunday. Relax!! 🏖️'; }

            contentHTML = `

                <h2>${weekday_str}, Week ${week_num} of the year ${year}</h2>
                <p>${statusMessage}</p>

            `;

           

            contentHTML += getCountdownContent(kstNow, weekday, week_num, isHoliday);

            pageContentDiv.innerHTML = contentHTML;

            break;



        case 'weekday':

            const isTodayWeekdayPage = (weekday >= 1 && weekday <= 5);

            contentHTML = `

                <h2>${weekday_str}, Week ${week_num} of the year ${year}</h2>

                <p>${isTodayWeekdayPage ? 'Today is a Weekday!' : 'Today is not a Weekday.'}</p>

                <p>평일에는 주로 규칙적인 일과를 수행합니다.</p>

                <ul>

                    <li>오전 8시 30분 ~ 11시 45분: 오전 일과</li>

                    <li>오전 11시 45분 ~ 오후 13시: 점심 시간</li>

                    <li>오후 13시 ~ 16시: 오후 일과 </li>

                </ul>

                <hr>

                <h3>평일 시간표:</h3>

            `;

            // Weekday page always displays weekday countdowns regardless of current day

            contentHTML += getCountdownContent(kstNow, weekday, week_num, isHoliday, { forceWeekdayType: true });

            pageContentDiv.innerHTML = contentHTML;

            break;



        case 'weekend':

            const isTodayWeekendPage = (weekday === 0 || weekday === 6);

            contentHTML = `

                <h2>${weekday_str}, Week ${week_num} of the year ${year}</h2>

                <p>${isTodayWeekendPage ? 'Enjoy your Weekend!' : 'It\'s not the weekend yet.'}</p>

                <p>주말에는 휴식과 취미 활동을 즐깁니다.</p>

                <ul>

                    <li>늦잠 자기</li>

                    <li>영화 감상</li>

                    <li>친구들과의 만남</li>

                </ul>

                <hr>

                <h3>주말 시간표:</h3>

            `;

            // Weekend page always displays weekend countdowns regardless of current day

            contentHTML += getCountdownContent(kstNow, weekday, week_num, isHoliday, { forceWeekendType: true });

            pageContentDiv.innerHTML = contentHTML;

            break;



        case 'saturday-brunch':

            const isSaturdayPage = (weekday === 6);

            const isBrunchWeek = (week_num % 2 !== 0); // Odd week number

            contentHTML = `

                <h2>${weekday_str}, Week ${week_num} of the year ${year}</h2>

                <p>Is it Saturday? ${isSaturdayPage ? 'Yes!' : 'No.'}</p>

                <p>Is it a Brunch Week (Odd week number)? ${isBrunchWeek ? 'Yes!' : 'No.'}</p>

                <p>${isSaturdayPage && isBrunchWeek ? 'It\'s Saturday Brunch time! 🥞' : 'No Saturday Brunch today. 😔'}</p>

                ${isSaturdayPage && isBrunchWeek ? '<p>맛있는 브런치를 즐길 시간입니다!</p>' : '<p>이번 주 토요일은 브런치 주간이 아닙니다. 다음 기회를 노려보세요!</p>'}

                <hr>

                <h3>토요일 브런치 시간표:</h3>

            `;

            // Saturday Brunch page always displays Saturday brunch countdowns

            contentHTML += getCountdownContent(kstNow, weekday, week_num, isHoliday, { forceBrunchType: true });

            pageContentDiv.innerHTML = contentHTML;

            break;



        default:

            contentHTML = `<p>Page not found.</p>`;

            pageContentDiv.innerHTML = contentHTML;

    }



    // Close sidebar after page rendering (useful for mobile)

    closeSidebar();

}



// -------------------- Sidebar Control Functions --------------------

function openSidebar() {

    document.getElementById("mySidebar").classList.add("active");

    document.body.classList.add("sidebar-open");

}



function closeSidebar() {

    document.getElementById("mySidebar").classList.remove("active");

    document.body.classList.remove("sidebar-open");

}



// -------------------- Initialization and Event Listeners --------------------

document.addEventListener('DOMContentLoaded', () => {

    const openSidebarBtn = document.getElementById("openSidebarBtn");

    const closeSidebarBtn = document.getElementById("closeSidebarBtn");

    const menuItems = document.querySelectorAll('.option-menu .menu-item');



    if (openSidebarBtn) {

        openSidebarBtn.addEventListener('click', openSidebar);

    }

    if (closeSidebarBtn) {

        closeSidebarBtn.addEventListener('click', closeSidebar);

    }



    menuItems.forEach(item => {

        item.addEventListener('click', function(event) {

            event.preventDefault();

            // Remove 'active' class from all menu items

            menuItems.forEach(i => i.classList.remove('active'));

            // Add 'active' class to the clicked menu item

            this.classList.add('active');

            const page = this.dataset.page;

            renderPage(page);

        });

    });



    renderPage('home'); // Render home page on initial load

});