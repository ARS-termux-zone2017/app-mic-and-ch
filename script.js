let audioContext;
let micSource;
let gainNode;
let compressorNode;
let destination; // Speakers

// UI Elements
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const gainSlider = document.getElementById('gainSlider');
const gainValueSpan = document.getElementById('gainValue');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValueSpan = document.getElementById('thresholdValue');
const ratioSlider = document.getElementById('ratioSlider');
const ratioValueSpan = document.getElementById('ratioValue');
const attackSlider = document.getElementById('attackSlider');
const attackValueSpan = document.getElementById('attackValue');
const releaseSlider = document.getElementById('releaseSlider');
const releaseValueSpan = document.getElementById('releaseValue');
const statusMessage = document.getElementById('statusMessage');

// --- Functions ---

async function startAudioProcessing() {
    try {
        statusMessage.textContent = 'Status: Initializing audio...';
        // 1. Create AudioContext
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Check if AudioContext is suspended (important for browser behavior)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // 2. Get Microphone Input
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micSource = audioContext.createMediaStreamSource(stream);
        statusMessage.textContent = 'Status: Microphone connected.';

        // 3. Create Gain Node
        gainNode = audioContext.createGain();
        gainNode.gain.value = parseFloat(gainSlider.value); // Set initial gain from slider
        gainValueSpan.textContent = gainSlider.value;
        statusMessage.textContent = 'Status: Gain node created.';

        // 4. Create Dynamics Compressor Node
        compressorNode = audioContext.createDynamicsCompressor();
        compressorNode.threshold.value = parseFloat(thresholdSlider.value);
        compressorNode.ratio.value = parseFloat(ratioSlider.value);
        compressorNode.attack.value = parseFloat(attackSlider.value);
        compressorNode.release.value = parseFloat(releaseSlider.value);

        thresholdValueSpan.textContent = thresholdSlider.value;
        ratioValueSpan.textContent = ratioSlider.value;
        attackValueSpan.textContent = attackSlider.value;
        releaseValueSpan.textContent = releaseSlider.value;
        statusMessage.textContent = 'Status: Compressor created.';

        // 5. Connect the nodes: Mic -> Gain -> Compressor -> Speakers (headphone output)
        micSource.connect(gainNode);
        gainNode.connect(compressorNode);
        compressorNode.connect(audioContext.destination); // Connect to speakers/headphones
        destination = audioContext.destination; // Store reference to speakers

        startButton.disabled = true;
        stopButton.disabled = false;
        statusMessage.textContent = 'Status: Audio processing active! Listen via headphones.';

    } catch (err) {
        console.error('Error accessing microphone or processing audio:', err);
        statusMessage.textContent = 'Status: Error! Check console for details. (Microphone access denied or not found?)';
        startButton.disabled = false;
        stopButton.disabled = true;
    }
}

function stopAudioProcessing() {
    if (audioContext) {
        // Disconnect all nodes
        if (micSource) micSource.disconnect();
        if (gainNode) gainNode.disconnect();
        if (compressorNode) compressorNode.disconnect();
        
        // Stop all tracks on the stream to release mic
        if (micSource && micSource.mediaStream) {
            micSource.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        // Close the audio context to free up resources
        audioContext.close();
        audioContext = null;
        statusMessage.textContent = 'Status: Audio processing stopped.';
    }
    startButton.disabled = false;
    stopButton.disabled = true;
}

// --- Event Listeners ---
startButton.addEventListener('click', startAudioProcessing);
stopButton.addEventListener('click', stopAudioProcessing);

gainSlider.addEventListener('input', () => {
    if (gainNode) {
        gainNode.gain.value = parseFloat(gainSlider.value);
    }
    gainValueSpan.textContent = gainSlider.value;
});

thresholdSlider.addEventListener('input', () => {
    if (compressorNode) {
        compressorNode.threshold.value = parseFloat(thresholdSlider.value);
    }
    thresholdValueSpan.textContent = thresholdSlider.value;
});

ratioSlider.addEventListener('input', () => {
    if (compressorNode) {
        compressorNode.ratio.value = parseFloat(ratioSlider.value);
    }
    ratioValueSpan.textContent = ratioSlider.value;
});

attackSlider.addEventListener('input', () => {
    if (compressorNode) {
        compressorNode.attack.value = parseFloat(attackSlider.value);
    }
    attackValueSpan.textContent = attackSlider.value;
});

releaseSlider.addEventListener('input', () => {
    if (compressorNode) {
        compressorNode.release.value = parseFloat(releaseSlider.value);
    }
    releaseValueSpan.textContent = releaseSlider.value;
});

// Initial state on page load
window.addEventListener('load', () => {
    statusMessage.textContent = 'Status: Ready. Click "Start Audio" to begin.';
});
