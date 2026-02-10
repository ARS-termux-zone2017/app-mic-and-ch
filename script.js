let audioContext = null; 
let micSource = null;
let gainNode = null;
let compressorNode = null;
let destination = null; 

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
        console.log('--- Start Audio Processing Attempt ---');

        // 1. Create AudioContext (if not already created or if closed)
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext created. Initial state:', audioContext.state);
        }

        // 2. Resume AudioContext if it's suspended
        if (audioContext.state === 'suspended') {
            console.log('AudioContext is suspended, attempting to resume...');
            await audioContext.resume();
            console.log('AudioContext resumed. New state:', audioContext.state);
        }
        
        // Ensure AudioContext is running before proceeding
        if (audioContext.state !== 'running') {
            throw new Error(AudioContext failed to resume or is not running. Current state: ${audioContext.state});
        }
        console.log('AudioContext is running.');

        // 3. Get Microphone Input
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micSource = audioContext.createMediaStreamSource(stream);
        console.log('Microphone stream obtained:', stream);
        statusMessage.textContent = 'Status: Microphone connected.';

        // 4. Create Gain Node
        gainNode = audioContext.createGain();
        gainNode.gain.value = parseFloat(gainSlider.value); // Set initial gain from slider
        gainValueSpan.textContent = gainSlider.value;
        console.log('Gain node created with value:', gainNode.gain.value);
        statusMessage.textContent = 'Status: Gain node created.';

        // 5. Create Dynamics Compressor Node
        compressorNode = audioContext.createDynamicsCompressor();
        compressorNode.threshold.value = parseFloat(thresholdSlider.value);
        compressorNode.ratio.value = parseFloat(ratioSlider.value);
        compressorNode.attack.value = parseFloat(attackSlider.value);
        compressorNode.release.value = parseFloat(releaseSlider.value);
        thresholdValueSpan.textContent = thresholdSlider.value;
        ratioValueSpan.textContent = ratioSlider.value;
        attackValueSpan.textContent = attackSlider.value;
        releaseValueSpan.textContent = releaseSlider.value;
        console.log('Compressor node created with settings:', {
            threshold: compressorNode.threshold.value,
            ratio: compressorNode.ratio.value,
            attack: compressorNode.attack.value,
            release: compressorNode.release.value
        });
        statusMessage.textContent = 'Status: Compressor created.';

        // 6. Connect the nodes: Mic -> Gain -> Compressor -> Speakers (headphone output)
        micSource.connect(gainNode);
        console.log('Mic connected to GainNode');
        gainNode.connect(compressorNode);
        console.log('GainNode connected to CompressorNode');
        compressorNode.connect(audioContext.destination); // Connect to speakers/headphones
        destination = audioContext.destination; // Store reference to speakers
        console.log('CompressorNode connected to AudioContext Destination (speakers/headphones).');

        // Update UI state
        startButton.disabled = true;
        stopButton.disabled = false;
        statusMessage.textContent = 'Status: Audio processing active! Listen via headphones.';
        console.log('--- Audio processing started successfully. ---');

    } catch (err) {
        console.error('Error accessing microphone or processing audio:', err);
        statusMessage.textContent = Status: Error! ${err.name}: ${err.message}. (Microphone access denied or not found?);
        startButton.disabled = false;
        stopButton.disabled = true;
        
        // Ensure stream tracks are stopped if any were obtained
        if (micSource && micSource.mediaStream) {
            micSource.mediaStream.getTracks().forEach(track => track.stop());
            console.log('Microphone tracks stopped due to error.');
        }
        // If audioContext was created but failed, attempt to close it
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close();
            audioContext = null;
        }
    }
}

function stopAudioProcessing() {
    console.log('--- Stop Audio Processing Attempt ---');
    if (audioContext) {
        // Disconnect all nodes
        if (micSource) {
            micSource.disconnect();
            if (micSource.mediaStream) { // Stop media stream tracks to release microphone hardware
                micSource.mediaStream.getTracks().forEach(track => track.stop());
                console.log('Microphone tracks stopped.');
            }
        }
        if (gainNode) gainNode.disconnect();
        if (compressorNode) compressorNode.disconnect();
        // destination.disconnect(); // Not strictly needed to disconnect destination
        
        // Close the audio context
        audioContext.close();
        audioContext = null;
        console.log('AudioContext closed.');
        statusMessage.textContent = 'Status: Audio processing stopped.';
    } else {
        console.log('AudioContext was not active or already stopped.');
    }
    // Reset UI state
    startButton.disabled = false;
    stopButton.disabled = true;
    console.log('--- Audio processing stopped successfully. ---');
}

// --- Event Listeners ---
startButton.addEventListener('click', startAudioProcessing);
stopButton.addEventListener('click', stopAudioProcessing);

gainSlider.addEventListener('input', () => {
    if (gainNode && audioContext && audioContext.state === 'running') { // Only update if audio processing is active
        gainNode.gain.value = parseFloat(gainSlider.value);
        console.log('Gain updated to:', gainNode.gain.value);
    }
    gainValueSpan.textContent = gainSlider.value;
});

thresholdSlider.addEventListener('input', () => {
    if (compressorNode && audioContext && audioContext.state === 'running') { 
        compressorNode.threshold.value = parseFloat(thresholdSlider.value);
        console.log('Compressor Threshold updated to:', compressorNode.threshold.value);
    }
    thresholdValueSpan.textContent = thresholdSlider.value;
});

ratioSlider.addEventListener('input', () => {
    if (compressorNode && audioContext && audioContext.state === 'running') { 
        compressorNode.ratio.value = parseFloat(ratioSlider.value);
        console.log('Compressor Ratio updated to:', compressorNode.ratio.value);
    }
    ratioValueSpan.textContent = ratioSlider.value;
});

attackSlider.addEventListener('input', () => {
    if (compressorNode && audioContext && audioContext.state === 'running') { 
        compressorNode.attack.value = parseFloat(attackSlider.value);
        console.log('Compressor Attack updated to:', compressorNode.attack.value);
    }
    attackValueSpan.textContent = attackSlider.value;
});

releaseSlider.addEventListener('input', () => {
    if (compressorNode && audioContext && audioContext.state === 'running') { 
        compressorNode.release.value = parseFloat(releaseSlider.value);
        console.log('Compressor Release updated to:', compressorNode.release.value);
    }
    releaseValueSpan.textContent = releaseSlider.value;
});

// Initial state on page load
window.addEventListener('load', () => {
    statusMessage.textContent = 'Status: Ready. Click "Start Audio" to begin.';
    // Ensure initial slider values are reflected on UI
    gainValueSpan.textContent = gainSlider.value;
    thresholdValueSpan.textContent = thresholdSlider.value;
    ratioValueSpan.textContent = ratioSlider.value;
    attackValueSpan.textContent = attackSlider.value;
    releaseValueSpan.textContent = releaseSlider.value;
});
