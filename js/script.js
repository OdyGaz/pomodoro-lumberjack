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

// Μεταβλητές κατάστασης του χρονομέτρου
let timeLeft;
let timerId = null;
let isWorkSession = true;
let completedCycles = 0;

// Μεταβλητή για το κανάλι ήχου (Web Audio API)
let audioCtx = null;

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

// ΔΙΟΡΘΩΣΗ: "Ξεκλείδωμα" και αρχικοποίηση του ήχου με το πάτημα του χρήστη
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Αν ο browser έχει βάλει τον ήχο σε αναμονή (suspended), τον ενεργοποιούμε ξανά
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// ΔΙΟΡΘΩΣΗ: Αναπαραγωγή ήχου χρησιμοποιώντας το ήδη ξεκλειδωμένο audioCtx
function playNotificationSound() {
    try {
        initAudio(); // Διασφάλιση ότι ο ήχος είναι ενεργός
        
        if (!audioCtx) return;

        const playBeep = (delay, frequency, duration) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + delay);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration);
            
            oscillator.start(audioCtx.currentTime + delay);
            oscillator.stop(audioCtx.currentTime + delay + duration);
        };
        
        // Παίζει τον διπλό ήχο
        playBeep(0, 587.33, 0.15); // D5
        playBeep(0.2, 880.00, 0.3); // A5
    } catch (e) {
        console.error("Σφάλμα ήχου:", e);
    }
}

// 2. Έναρξη του Χρονομέτρου
function startTimer() {
    initAudio(); // Ξεκλειδώνουμε τον ήχο επειδή αυτή η συνάρτηση καλείται από κλικ (start-btn)

    if (timerId !== null) return; // Αν τρέχει ήδη, δεν κάνει τίποτα

    // Κλείδωμα των πεδίων εισαγωγής κατά τη διάρκεια της λειτουργίας
    workTimeInput.disabled = true;
    breakTimeInput.disabled = true;

    // Ενημέρωση της εικόνας και του κειμένου ανάλογα με τη φάση
    if (isWorkSession) {
        lumberjackImg.src = 'images/lumberjack-active.gif'; // Εμφάνιση του GIF
        actionText.textContent = 'Chopping!';
        statusLabel.textContent = 'Work';
    } else {
        // Στο διάλειμμα ο ξυλοκόπος ξεκουράζεται (στατική εικόνα)
        lumberjackImg.src = 'images/lumberjack-static.png';
        actionText.textContent = 'Resting...';
        statusLabel.textContent = 'Break';
    }

    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            // Όταν ο χρόνος τελειώσει, σταματάμε το τρέχον interval και αλλάζουμε φάση
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

    workTimeInput.disabled = false;
    breakTimeInput.disabled = false;

    isWorkSession = true;
    statusLabel.textContent = 'Work';
    timeLeft = parseInt(workTimeInput.value) * 60;
    updateDisplay();

    lumberjackImg.src = 'images/lumberjack-static.png';
    actionText.textContent = 'Gave up. Start again?';
}

// 6. ΔΙΟΡΘΩΣΗ: Εναλλαγή μεταξύ Work και Break με καθυστέρηση στο Alert
function switchSession() {
    // 1. Παίζει τον ήχο αμέσως
    playNotificationSound();

    // 2. Καθυστερούμε την εμφάνιση του alert κατά 1 δευτερόλεπτο (1000ms)
    // ώστε να προλάβει να ακουστεί ο ήχος πριν παγώσει η σελίδα.
    setTimeout(() => {
        if (isWorkSession) {
            completedCycles++;
            cyclesCountSpan.textContent = completedCycles;
            isWorkSession = false;
            timeLeft = parseInt(breakTimeInput.value) * 60;
            alert('Time for a break! Good job!');
        } else {
            isWorkSession = true;
            timeLeft = parseInt(workTimeInput.value) * 60;
            alert('Break is over! Time to get back to work!');
        }
        
        updateDisplay();
        // Αυτόματη έναρξη της επόμενης φάσης
        startTimer();
    }, 1000); 
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
