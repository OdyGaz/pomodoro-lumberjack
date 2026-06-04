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

// 2. Έναρξη του Χρονομέτρου
function startTimer() {
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

    // Ο ξυλοκόπος σταματάει να δουλεύει (επιστροφή στη στατική εικόνα)
    lumberjackImg.src = 'images/lumberjack-static.png';
    actionText.textContent = 'Paused...';
}

// 4. Επαναφορά του Χρονομέτρου (Reset)
function resetTimer() {
    clearInterval(timerId);
    timerId = null;

    // Ξεκλείδωμα των πεδίων εισαγωγής
    workTimeInput.disabled = false;
    breakTimeInput.disabled = false;

    // Επαναφορά στις αρχικές τιμές
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

    // Ξεκλείδωμα πεδίων
    workTimeInput.disabled = false;
    breakTimeInput.disabled = false;

    // Επαναφορά στην αρχή της εργασίας χωρίς να μετρήσει ο κύκλος
    isWorkSession = true;
    statusLabel.textContent = 'Work';
    timeLeft = parseInt(workTimeInput.value) * 60;
    updateDisplay();

    lumberjackImg.src = 'images/lumberjack-static.png';
    actionText.textContent = 'Gave up. Start again?';
}

// 6. Εναλλαγή μεταξύ Work και Break
function switchSession() {
    if (isWorkSession) {
        // Ολοκληρώθηκε η εργασία -> Προσθήκη κύκλου και μετάβαση σε Διάλειμμα
        completedCycles++;
        cyclesCountSpan.textContent = completedCycles;
        isWorkSession = false;
        timeLeft = parseInt(breakTimeInput.value) * 60;
        alert('Time for a break! Good job!');
    } else {
        // Ολοκληρώθηκε το διάλειμμα -> Μετάβαση σε Εργασία
        isWorkSession = true;
        timeLeft = parseInt(workTimeInput.value) * 60;
        alert('Break is over! Time to get back to work!');
    }
    
    updateDisplay();
    // Αυτόματη έναρξη της επόμενης φάσης
    startTimer();
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