// Λήψη των στοιχείων από την HTML
const workTimeInput = document.getElementById('work-time');
const breakTimeInput = document.getElementById('break-time');
const statusLabel = document.getElementById('status-label');
const timerDisplay = document.getElementById('timer-display');
const lumberjackImg = document.getElementById('lumberjack-img');
const actionText = document.getElementById('action-text');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const giveUpBtn = document.getElementById('giveup-btn');
const cyclesCountSpan = document.getElementById('cycles-count');

// Στοιχεία για το Custom Modal
const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Μεταβλητές κατάστασης του χρονομέτρου
let timeLeft;
let timerId = null;
let isWorkSession = true;
let completedCycles = 0;

// Καθολικές μεταβλητές για τον ήχο και το ξυπνητήρι
let audioCtx = null;
let alarmIntervalId = null; 

// Αρχική ρύθμιση χρόνου με βάση την τιμή του input
timeLeft = parseInt(workTimeInput.value) * 60;

// 1. Ενημέρωση της οθόνης του χρονομέτρου (Μορφή MM:SS)
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Προσθήκη μηδενικού μπροστά αν ο αριθμός είναι μονοψήφιος
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
    
    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

// Λειτουργία αρχικοποίησης και ξεκλειδώματος του ήχου
function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch (e) {
        console.error("Αποτυχία ενεργοποίησης ήχου:", e);
    }
}

// Έναρξη του επαναλαμβανόμενου ήχου (Alarm Loop)
function startAlarm() {
    initAudio();
    if (!audioCtx) return;

    // Παίζει το πρώτο μπιπ αμέσως
    playAlarmBeep();

    // Επαναλαμβάνει τον ήχο κάθε 1.2 δευτερόλεπτα μέχρι να τον σταματήσουμε
    alarmIntervalId = setInterval(() => {
        playAlarmBeep();
    }, 1200);
}

// Διακοπή του ήχου
function stopAlarm() {
    if (alarmIntervalId) {
        clearInterval(alarmIntervalId);
        alarmIntervalId = null;
    }
}

// Παραγωγή ενός μόνο μπιπ
function playAlarmBeep() {
    try {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 660; // Ήπιος, ευχάριστος τόνος
        
        // Ομαλό σβήσιμο
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.6); // Διάρκεια μπιπ 0.6 δευτερόλεπτα
    } catch (e) {
        console.error(e);
    }
}

// Εμφάνιση του Custom Παραθύρου (Modal)
function showModal(title, message, callback) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    customModal.classList.remove('hidden');
    
    // Όταν ο χρήστης κάνει κλικ στο OK
    modalCloseBtn.onclick = () => {
        customModal.classList.add('hidden');
        stopAlarm(); // Σταματάμε τον ήχο αμέσως!
        if (callback) callback(); // Εκτέλεση της επόμενης φάσης
    };
}

// 2. Έναρξη του Χρονομέτρου
function startTimer() {
    if (timerId !== null) return; // Αν τρέχει ήδη, δεν κάνει τίποτα

    // Ξεκλείδωμα του ήχου κατά το κλικ
    initAudio();

    // Κλείδωμα των πεδίων εισαγωγής κατά τη διάρκεια της λειτουργίας
    workTimeInput.disabled = true;
    breakTimeInput.disabled = true;

    // Ενημέρωση της εικόνας και του κειμένου ανάλογα με τη φάση
    if (isWorkSession) {
        lumberjackImg.src = 'images/lumberjack-active.gif'; // Εμφάνιση του GIF
        actionText.textContent = 'Chopping!';
        statusLabel.textContent = 'Work';
    } else {
        lumberjackImg.src = 'images/lumberjack-static.png';
        actionText.textContent = 'Resting...';
        statusLabel.textContent = 'Break';
    }

    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerId);
            timerId = null;
            switchSession();
        }
    }, 1000);
}

// 3. Παύση του Χρονομέτρου
function pauseTimer() {
    if (timerId === null) return;

    clearInterval(timerId);
    timerId = null;

    lumberjackImg.src = 'images/lumberjack-static.png';
    actionText.textContent = 'Paused...';
}

// 4. Επαναφορά του Χρονομέτρου (Reset)
function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    stopAlarm(); // Σε περίπτωση που πατηθεί reset κατά τη διάρκεια του alarm

    workTimeInput.disabled = false;
    breakTimeInput.disabled = false;

    isWorkSession = true;
    statusLabel.textContent = 'Work';
    timeLeft = parseInt(workTimeInput.value) * 60;
    updateDisplay();

    lumberjackImg.src = 'images/lumberjack-static.png';
    actionText.textContent = 'Paused...';
}

// 5. Εγκατάλειψη (Give Up)
function giveUp() {
    clearInterval(timerId);
    timerId = null;
    stopAlarm();

    workTimeInput.disabled = false;
    breakTimeInput.disabled = false;

    isWorkSession = true;
    statusLabel.textContent = 'Work';
    timeLeft = parseInt(workTimeInput.value) * 60;
    updateDisplay();

    lumberjackImg.src = 'images/lumberjack-static.png';
    actionText.textContent = 'Gave up. Start again?';
}

// 6. Εναλλαγή μεταξύ Work και Break
function switchSession() {
    // Ξεκινάει ο επαναλαμβανόμενος ήχος
    startAlarm();

    if (isWorkSession) {
        completedCycles++;
        cyclesCountSpan.textContent = completedCycles;
        isWorkSession = false;
        timeLeft = parseInt(breakTimeInput.value) * 60;
        
        // Εμφάνιση custom modal αντί για alert()
        showModal('Time for a Break! ☕', 'Good job! Time to rest your eyes.', () => {
            updateDisplay();
            startTimer();
        });
    } else {
        isWorkSession = true;
        timeLeft = parseInt(workTimeInput.value) * 60;
        
        // Εμφάνιση custom modal αντί για alert()
        showModal("Break is Over! 🪓", 'Time to get back to work!', () => {
            updateDisplay();
            startTimer();
        });
    }
}

// Event Listeners για τα κουμπιά
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
giveUpBtn.addEventListener('click', giveUp);

// Event listeners για αλλαγή των inputs όταν το χρονόμετρο είναι σταματημένο
workTimeInput.addEventListener('change', () => {
    if (timerId === null && isWorkSession) {
        timeLeft = parseInt(workTimeInput.value) * 60;
        updateDisplay();
    }
});

breakTimeInput.addEventListener('change', () => {
    if (timerId === null && !isWorkSession) {
        timeLeft = parseInt(breakTimeInput.value) * 60;
        updateDisplay();
    }
});

// Αρχική εμφάνιση του χρόνου κατά το άνοιγμα της σελίδας
updateDisplay();
