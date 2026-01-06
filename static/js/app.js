// API Base URL
const API_BASE = '/api';

// State
let birthdays = [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
const MAX_YEAR = 2100;

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBirthdays();
    setupEventListeners();
    renderCalendar();
    setupModal();
    setupSprinkleTrail();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('birthdayForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));
    document.getElementById('todayBtn').addEventListener('click', jumpToToday);
}

// API Functions
async function loadBirthdays() {
    try {
        const response = await fetch(`${API_BASE}/birthdays`);
        birthdays = await response.json();
        renderCalendar();
        renderBirthdaysList();
        renderUpcomingBirthdays();
    } catch (error) {
        console.error('Error loading birthdays:', error);
        showNotification('Error loading birthdays', 'error');
    }
}

async function addBirthday(name, month, day) {
    try {
        const response = await fetch(`${API_BASE}/birthdays`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, month, day }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add birthday');
        }

        const newBirthday = await response.json();
        birthdays.push(newBirthday);
        return newBirthday;
    } catch (error) {
        throw error;
    }
}

async function deleteBirthday(birthdayId) {
    try {
        const response = await fetch(`${API_BASE}/birthdays/${birthdayId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete birthday');
        }

        birthdays = birthdays.filter(b => b.id !== birthdayId);
        renderCalendar();
        renderBirthdaysList();
        renderUpcomingBirthdays();
        showNotification('Birthday deleted successfully', 'success');
    } catch (error) {
        showNotification('Error deleting birthday', 'error');
    }
}

// Form Handler
async function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('personName').value.trim();
    const month = parseInt(document.getElementById('month').value);
    const day = parseInt(document.getElementById('day').value);

    // Validate day for the selected month
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    if (day > daysInMonth) {
        showNotification(`${monthNames[month]} only has ${daysInMonth} days`, 'error');
        return;
    }

    try {
        await addBirthday(name, month, day);
        document.getElementById('birthdayForm').reset();
        renderCalendar();
        renderBirthdaysList();
        renderUpcomingBirthdays();
        showNotification('Birthday added successfully!', 'success');
        
        // Animate the form
        const form = document.getElementById('birthdayForm');
        form.style.transform = 'scale(0.98)';
        setTimeout(() => {
            form.style.transform = 'scale(1)';
        }, 200);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Helper Functions
function getNextBirthdayDate(month, day) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const birthdayThisYear = new Date(currentYear, month, day);
    
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    birthdayThisYear.setHours(0, 0, 0, 0);
    
    if (birthdayThisYear >= today) {
        return birthdayThisYear; // This year
    } else {
        return new Date(currentYear + 1, month, day); // Next year
    }
}

function getDaysUntilBirthday(month, day) {
    const nextBirthday = getNextBirthdayDate(month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = nextBirthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function isCurrentMonth() {
    const today = new Date();
    return currentMonth === today.getMonth() && currentYear === today.getFullYear();
}

function jumpToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
}

// Month Navigation
function navigateMonth(direction) {
    // Prevent going past 2100
    if (direction > 0 && currentYear >= MAX_YEAR) {
        showNotification(`Cannot navigate beyond ${MAX_YEAR}`, 'error');
        return;
    }
    
    // Prevent going to past months
    if (direction < 0 && isCurrentMonth()) {
        return; // Already at current month, don't go back
    }
    
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    // Don't allow going past current month in the past
    const today = new Date();
    if (currentYear < today.getFullYear() || 
        (currentYear === today.getFullYear() && currentMonth < today.getMonth())) {
        // Reset to current month if we went too far back
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
    }
    
    renderCalendar();
}

// Render Calendar
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    // Add day headers
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        const isToday = today.getDate() === day && 
                       today.getMonth() === currentMonth && 
                       today.getFullYear() === currentYear;
        
        if (isToday) {
            dayCell.className = 'calendar-day today';
        } else {
            dayCell.className = 'calendar-day';
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);

        // Check for birthdays on this day
        const dayBirthdays = birthdays.filter(b => 
            b.month === currentMonth && b.day === day
        );

        dayBirthdays.forEach(birthday => {
            const badge = document.createElement('span');
            badge.className = 'birthday-badge';
            badge.textContent = birthday.name;
            dayCell.appendChild(badge);
        });

        // Add click handler to show day details
        dayCell.addEventListener('click', () => {
            showDayModal(day, currentMonth, currentYear, dayBirthdays);
        });

        // Add animation delay
        dayCell.style.animationDelay = `${(day - 1) * 0.01}s`;
        grid.appendChild(dayCell);
    }

    // Update month display
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentMonth]} ${currentYear}`;
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevMonth');
    const isCurrent = isCurrentMonth();
    
    if (isCurrent) {
        prevBtn.disabled = true;
        prevBtn.classList.add('disabled');
    } else {
        prevBtn.disabled = false;
        prevBtn.classList.remove('disabled');
    }
    
    // Add current month indicator
    const monthDisplay = document.getElementById('currentMonth');
    if (isCurrent) {
        monthDisplay.classList.add('current-month-active');
    } else {
        monthDisplay.classList.remove('current-month-active');
    }
}

// Get Upcoming Birthdays
function getUpcomingBirthdays() {
    return birthdays.map(birthday => {
        const daysUntil = getDaysUntilBirthday(birthday.month, birthday.day);
        return {
            ...birthday,
            daysUntil,
            nextDate: getNextBirthdayDate(birthday.month, birthday.day)
        };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
}

// Render Upcoming Birthdays Widget
function renderUpcomingBirthdays() {
    const widget = document.getElementById('upcomingBirthdays');
    if (!widget) return;
    
    widget.innerHTML = '';

    if (birthdays.length === 0) {
        widget.innerHTML = '<div class="empty-state">No birthdays added yet</div>';
        return;
    }

    const upcoming = getUpcomingBirthdays().slice(0, 7);
    
    upcoming.forEach((birthday, index) => {
        const item = document.createElement('div');
        item.className = 'upcoming-item';
        
        const today = new Date();
        const nextBirthdayDate = getNextBirthdayDate(birthday.month, birthday.day);
        const isInCurrentMonth = nextBirthdayDate.getMonth() === today.getMonth() && 
                                 nextBirthdayDate.getFullYear() === today.getFullYear();
        
        let timeText = '';
        if (birthday.daysUntil === 0) {
            timeText = 'Today!! 🎂';
            item.classList.add('upcoming-today');
        } else if (birthday.daysUntil === 1) {
            timeText = 'Tomorrow';
            item.classList.add('upcoming-tomorrow');
        } else if (birthday.daysUntil <= 7) {
            timeText = `in ${birthday.daysUntil} days`;
            item.classList.add('upcoming-week');
        } else if (isInCurrentMonth) {
            timeText = `in ${birthday.daysUntil} days`;
            item.classList.add('upcoming-month');
        } else {
            timeText = `in ${birthday.daysUntil} days`;
        }
        
        item.style.animationDelay = `${index * 0.05}s`;
        item.innerHTML = `
            <div class="upcoming-info">
                <span class="upcoming-name">${birthday.name}</span>
                <span class="upcoming-date">${monthNames[birthday.month]} ${birthday.day}</span>
            </div>
            <span class="upcoming-countdown">${timeText}</span>
        `;
        widget.appendChild(item);
    });
}

// Render Birthdays List
function renderBirthdaysList() {
    const list = document.getElementById('birthdaysList');
    list.innerHTML = '';

    if (birthdays.length === 0) {
        list.innerHTML = '<div class="empty-state">No birthdays added yet. Add one above!</div>';
        return;
    }

    // Sort by next occurrence (upcoming first)
    const sorted = getUpcomingBirthdays();

    sorted.forEach((birthday, index) => {
        const item = document.createElement('div');
        item.className = 'birthday-item';
        item.style.animationDelay = `${index * 0.05}s`;
        
        item.innerHTML = `
            <span>${birthday.name} - ${monthNames[birthday.month]} ${birthday.day}</span>
            <button class="delete-btn" onclick="deleteBirthday(${birthday.id})">Delete</button>
        `;
        list.appendChild(item);
    });
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Calendar Day Modal
function showDayModal(day, month, year, dayBirthdays) {
    const modal = document.getElementById('dayModal');
    const modalTitle = document.getElementById('dayModalTitle');
    const modalBody = document.getElementById('dayModalBody');
    
    const dateStr = `${monthNames[month]} ${day}, ${year}`;
    modalTitle.textContent = dateStr;
    
    modalBody.innerHTML = '';
    
    if (dayBirthdays.length === 0) {
        modalBody.innerHTML = `
            <div class="day-modal-empty">
                <div class="day-modal-empty-icon">🎂</div>
                <p>No birthdays on this day</p>
            </div>
        `;
    } else {
        dayBirthdays.forEach(birthday => {
            const birthdayItem = document.createElement('div');
            birthdayItem.className = 'day-modal-birthday';
            birthdayItem.innerHTML = `
                <span class="day-modal-birthday-name">${birthday.name}</span>
            `;
            modalBody.appendChild(birthdayItem);
        });
    }
    
    modal.classList.add('show');
}

function closeDayModal() {
    const modal = document.getElementById('dayModal');
    modal.classList.remove('show');
}

// Setup modal event listeners
function setupModal() {
    const modal = document.getElementById('dayModal');
    const modalClose = document.getElementById('dayModalClose');
    const modalOverlay = modal?.querySelector('.day-modal-overlay');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeDayModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeDayModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) {
            closeDayModal();
        }
    });
}

// Sprinkle Trail
const sprinkleColors = ['#ff6b9d', '#c44569', '#f8b500', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff6348'];
let lastMouseTime = 0;
const sprinkleInterval = 50; // ms between sprinkles

function createSprinkle(x, y) {
    const sprinkle = document.createElement('div');
    sprinkle.className = 'sprinkle';
    
    // Random color from sprinkle palette
    const color = sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)];
    sprinkle.style.backgroundColor = color;
    
    // Random size
    const size = Math.random() * 4 + 2; // 2-6px
    sprinkle.style.width = `${size}px`;
    sprinkle.style.height = `${size}px`;
    
    // Random rotation
    const rotation = Math.random() * 360;
    sprinkle.style.transform = `rotate(${rotation}deg)`;
    
    // Position
    sprinkle.style.left = `${x}px`;
    sprinkle.style.top = `${y}px`;
    
    document.body.appendChild(sprinkle);
    
    // Animate fade out
    setTimeout(() => {
        sprinkle.style.opacity = '0';
        sprinkle.style.transform = `rotate(${rotation}deg) scale(0)`;
        setTimeout(() => {
            if (sprinkle.parentNode) {
                sprinkle.parentNode.removeChild(sprinkle);
            }
        }, 500);
    }, 100);
    
    return sprinkle;
}

function handleMouseMove(e) {
    const now = Date.now();
    if (now - lastMouseTime < sprinkleInterval) {
        return; // Throttle sprinkles
    }
    lastMouseTime = now;
    
    createSprinkle(e.clientX, e.clientY);
}

// Initialize sprinkle trail
function setupSprinkleTrail() {
    document.addEventListener('mousemove', handleMouseMove);
}

// Make deleteBirthday available globally
window.deleteBirthday = deleteBirthday;

