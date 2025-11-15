// Application State
let currentTrack = null;
let currentQuestionIndex = 0;
let answers = {};
let routing = null;
let completedTracks = new Set();

// Initialize the application
async function init() {
    try {
        // Load routing configuration
        const routingResponse = await fetch('/api/routing');
        routing = await routingResponse.json();
        
        // Render train map
        await renderTrainMap();
        
        // Render connections graph
        await renderConnectionsGraph();
        
        // Load entry track
        const entryTrackId = routing.entry_track;
        await loadTrack(entryTrackId);
    } catch (error) {
        console.error('Error initializing:', error);
        showError('Failed to load application. Please refresh the page.');
    }
}

// Load a track by ID
async function loadTrack(trackId) {
    try {
        const response = await fetch(`/api/track/${trackId}`);
        const data = await response.json();
        currentTrack = data;
        currentQuestionIndex = 0;
        
        // Load saved answers for this track
        loadSavedAnswers(trackId);
        
        // Display track info
        displayTrackInfo();
        
        // Display first question
        displayQuestion();
        
        // Update progress
        updateProgress();
        
        // Update train map
        await renderTrainMap();
        
        // Update connections graph
        await renderConnectionsGraph();
    } catch (error) {
        console.error('Error loading track:', error);
        showError('Failed to load track. Please try again.');
    }
}

// Display track information
function displayTrackInfo() {
    const trackInfo = document.getElementById('trackInfo');
    const trackTitle = document.getElementById('trackTitle');
    const trackSummary = document.getElementById('trackSummary');
    const resetBtn = document.getElementById('resetTrackBtn');
    
    if (currentTrack && currentTrack.options && currentTrack.options[0]) {
        const track = currentTrack.options[0];
        trackTitle.textContent = track.label;
        trackSummary.textContent = track.summary;
        trackInfo.style.display = 'block';
        
        // Show reset button if track has answers or is completed
        const trackId = track.id;
        const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
        const saved = JSON.parse(localStorage.getItem('espi_answers') || '{}');
        const hasAnswers = saved[trackId] && Object.keys(saved[trackId]).length > 0;
        const isCompleted = completed.includes(trackId);
        
        if (hasAnswers || isCompleted) {
            resetBtn.style.display = 'block';
        } else {
            resetBtn.style.display = 'none';
        }
    }
}

// Display current question
function displayQuestion() {
    const container = document.getElementById('questionContainer');
    const navigation = document.getElementById('navigation');
    const loading = document.getElementById('loading');
    
    // Show main content area when displaying questions
    const mainContentArea = document.getElementById('mainContentArea');
    if (mainContentArea) {
        mainContentArea.style.display = 'block';
    }
    
    if (!currentTrack || !currentTrack.options || !currentTrack.options[0]) {
        if (loading) loading.style.display = 'block';
        if (navigation) navigation.style.display = 'none';
        const currentQuestionBadge = document.getElementById('currentQuestionBadge');
        if (currentQuestionBadge) currentQuestionBadge.style.display = 'none';
        return;
    }
    
    const track = currentTrack.options[0];
    const questions = track.required_inputs || [];
    
    if (questions.length === 0) {
        container.innerHTML = '<p>No questions in this track.</p>';
        if (navigation) navigation.style.display = 'none';
        if (loading) loading.style.display = 'none';
        const currentQuestionBadge = document.getElementById('currentQuestionBadge');
        if (currentQuestionBadge) currentQuestionBadge.style.display = 'none';
        return;
    }
    
    if (currentQuestionIndex >= questions.length) {
        showTrackComplete();
        return;
    }
    
    // Hide loading if it exists
    if (loading) {
        loading.style.display = 'none';
    }
    
    if (navigation) {
        navigation.style.display = 'flex';
    }
    
    const question = questions[currentQuestionIndex];
    const questionKey = question.key;
    const savedAnswer = answers[questionKey];
    
    // Highlight the current question with a prominent border and background
    let html = `<div class="p-8 bg-white rounded-lg border-2 border-finland-blue-500 shadow-lg mb-6 relative">`;
    // Add a visual indicator for the current question
    html += `<div class="absolute -top-2 -right-2 w-6 h-6 bg-finland-blue-700 rounded-full flex items-center justify-center shadow-md">
        <span class="text-white text-xs font-bold">${currentQuestionIndex + 1}</span>
    </div>`;
    html += `<label class="block text-lg font-bold text-finland-blue-900 mb-4 tracking-tight">${question.label}</label>`;
    
    if (question.help_text) {
        html += `<div class="mb-5 p-4 bg-blue-50 border-l-4 border-finland-blue-500 rounded-md text-sm text-gray-700 leading-relaxed">${question.help_text}</div>`;
    }
    
    // Render input based on type - with enhanced focus styles
    if (question.type === 'boolean') {
        html += `<div class="flex gap-4">`;
        html += `<div class="flex-1 p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 ${savedAnswer === true ? 'bg-finland-blue-700 text-white border-finland-blue-700 shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-finland-blue-500 hover:shadow-sm'}" onclick="selectBoolean('${questionKey}', true)">
            <input type="radio" name="${questionKey}" value="true" ${savedAnswer === true ? 'checked' : ''} class="mr-3">
            <strong class="text-base">Yes</strong>
        </div>`;
        html += `<div class="flex-1 p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 ${savedAnswer === false ? 'bg-finland-blue-700 text-white border-finland-blue-700 shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-finland-blue-500 hover:shadow-sm'}" onclick="selectBoolean('${questionKey}', false)">
            <input type="radio" name="${questionKey}" value="false" ${savedAnswer === false ? 'checked' : ''} class="mr-3">
            <strong class="text-base">No</strong>
        </div>`;
        html += `</div>`;
    } else if (question.type === 'long_text') {
        html += `<textarea id="input_${questionKey}" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue-500 focus:border-finland-blue-500 text-base text-gray-700 transition-all shadow-sm" rows="6" oninput="saveAnswer('${questionKey}', this.value)" onchange="saveAnswer('${questionKey}', this.value)">${savedAnswer || ''}</textarea>`;
    } else if (question.type === 'file') {
        html += `<input type="file" id="input_${questionKey}" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue-500 focus:border-finland-blue-500 text-sm text-gray-700 transition-all shadow-sm" onchange="handleFileUpload('${questionKey}', this.files[0])">`;
        if (savedAnswer) {
            html += `<p class="mt-3 text-sm text-finland-green-600 font-medium">✓ File uploaded: ${savedAnswer}</p>`;
        }
    } else {
        html += `<input type="${question.type || 'text'}" id="input_${questionKey}" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue-500 focus:border-finland-blue-500 text-base text-gray-700 transition-all shadow-sm" value="${savedAnswer || ''}" oninput="saveAnswer('${questionKey}', this.value)" onchange="saveAnswer('${questionKey}', this.value)">`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Show the current question badge
    const currentQuestionBadge = document.getElementById('currentQuestionBadge');
    if (currentQuestionBadge) {
        currentQuestionBadge.style.display = 'block';
    }
    
    // Scroll to question container to ensure it's visible (reuse mainContentArea from above)
    if (mainContentArea) {
        mainContentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Update navigation buttons
    updateNavigationButtons(questions.length);
}

// Select boolean value
async function selectBoolean(key, value) {
    await saveAnswer(key, value);
    displayQuestion(); // Re-render to show selection
}

// Handle file upload
async function handleFileUpload(key, file) {
    if (file) {
        // In a real app, you'd upload to server
        // For now, just save the filename
        await saveAnswer(key, file.name);
        displayQuestion();
    }
}

// Save answer
async function saveAnswer(key, value) {
    answers[key] = value;
    // Save to localStorage
    const trackId = currentTrack?.options?.[0]?.id;
    if (trackId) {
        const saved = JSON.parse(localStorage.getItem('espi_answers') || '{}');
        if (!saved[trackId]) {
            saved[trackId] = {};
        }
        saved[trackId][key] = value;
        localStorage.setItem('espi_answers', JSON.stringify(saved));
        
        // Re-evaluate tracks after saving (debounced)
        if (saveAnswer.reEvaluateTimeout) {
            clearTimeout(saveAnswer.reEvaluateTimeout);
        }
        saveAnswer.reEvaluateTimeout = setTimeout(async () => {
            await reEvaluateTracks();
        }, 500); // Wait 500ms after last change
    }
}

// Load saved answers
function loadSavedAnswers(trackId) {
    const saved = JSON.parse(localStorage.getItem('espi_answers') || '{}');
    if (saved[trackId]) {
        answers = { ...saved[trackId] };
    } else {
        answers = {};
    }
}

// Update navigation buttons
function updateNavigationButtons(totalQuestions) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = currentQuestionIndex > 0 ? 'block' : 'none';
    
    if (currentQuestionIndex === totalQuestions - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

// Next question
async function nextQuestion() {
    if (!currentTrack || !currentTrack.options || !currentTrack.options[0]) {
        return;
    }
    
    const questions = currentTrack.options[0].required_inputs || [];
    
    // Validate current question if needed
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
        return;
    }
    
    const questionKey = currentQuestion.key;
    
    // Always read current value from DOM first (most up-to-date)
    let currentValue = null;
    let hasValue = false;
    
    // Check if boolean was selected (for radio buttons)
    if (currentQuestion.type === 'boolean') {
        const radioButtons = document.querySelectorAll(`input[name="${questionKey}"]`);
        for (const radio of radioButtons) {
            if (radio.checked) {
                currentValue = radio.value === 'true';
                hasValue = true;
                await saveAnswer(questionKey, currentValue);
                break;
            }
        }
    } else {
        // For text inputs, textareas, etc.
        const inputElement = document.getElementById(`input_${questionKey}`);
        if (inputElement) {
            // Get raw value from DOM
            const rawValue = inputElement.value;
            
            // Handle different input types
            if (currentQuestion.type === 'file') {
                // For file inputs, check if file is selected
                if (inputElement.files && inputElement.files.length > 0) {
                    currentValue = inputElement.files[0].name;
                    hasValue = true;
                } else {
                    // Check if we have a saved answer
                    currentValue = answers[questionKey];
                    hasValue = !!currentValue;
                }
            } else {
                // For text inputs and textareas
                // Always read the value, even if it's empty string
                const rawValue = inputElement.value || '';
                
                // Trim whitespace for text inputs
                if (typeof rawValue === 'string') {
                    currentValue = rawValue.trim();
                    hasValue = currentValue.length > 0;
                } else {
                    currentValue = rawValue;
                    hasValue = !!currentValue;
                }
                
                // Always save the value (even if empty) to keep DOM and state in sync
                await saveAnswer(questionKey, currentValue);
            }
        } else {
            // Fallback to saved answer if DOM element not found
            currentValue = answers[questionKey];
            if (currentValue !== undefined && currentValue !== null) {
                if (typeof currentValue === 'string') {
                    hasValue = currentValue.trim().length > 0;
                } else {
                    hasValue = true;
                }
            }
        }
    }
    
    // Validate required questions
    if (currentQuestion.optional !== true) {
        if (!hasValue) {
            alert('Please answer this question before continuing.');
            return;
        }
    }
    
    currentQuestionIndex++;
    displayQuestion();
    updateProgress();
}

// Previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateProgress();
    }
}

// Update progress bar
function updateProgress() {
    if (!currentTrack || !currentTrack.options || !currentTrack.options[0]) {
        return;
    }
    
    const questions = currentTrack.options[0].required_inputs || [];
    const total = questions.length;
    const current = currentQuestionIndex + 1;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = `${percentage}% Complete`;
    document.getElementById('questionCounter').textContent = `Question ${current} of ${total}`;
}

// Submit track
async function submitTrack() {
    if (!currentTrack || !currentTrack.options || !currentTrack.options[0]) {
        return;
    }
    
    const questions = currentTrack.options[0].required_inputs || [];
    
    // First, save any unsaved values from DOM
    for (const question of questions) {
        const questionKey = question.key;
        const inputElement = document.getElementById(`input_${questionKey}`);
        if (inputElement) {
            const domValue = inputElement.value;
            if (domValue !== undefined && domValue !== null) {
                await saveAnswer(questionKey, domValue);
            }
        }
        
        // Check boolean radio buttons
        if (question.type === 'boolean') {
            const radioButtons = document.querySelectorAll(`input[name="${questionKey}"]`);
            for (const radio of radioButtons) {
                if (radio.checked) {
                    const value = radio.value === 'true';
                    await saveAnswer(questionKey, value);
                    break;
                }
            }
        }
    }
    
    // Validate all required questions
    for (const question of questions) {
        if (question.optional !== true) {
            const answer = answers[question.key];
            if (answer === undefined || answer === null || answer === '') {
                alert(`Please answer: ${question.label}`);
                return;
            }
        }
    }
    
    // Mark track as completed
    const trackId = currentTrack.options[0].id;
    const trackConfig = routing?.routing?.find(t => t.track_id === trackId);
    const isTerminal = trackConfig?.is_terminal === true;
    
    completedTracks.add(trackId);
    
    // Save completion status
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    if (!completed.includes(trackId)) {
        completed.push(trackId);
        localStorage.setItem('espi_completed', JSON.stringify(completed));
    }
    
    // Update train map
    await renderTrainMap();
    
    // Update connections graph
    await renderConnectionsGraph();
    
    // If this is the terminal track, show summary page
    if (isTerminal) {
        await showSummaryPage();
    } else {
        // Show success and next tracks
        showTrackComplete();
    }
}

// Reset current track - clears all answers and removes from completed
async function resetCurrentTrack() {
    if (!currentTrack || !currentTrack.options || !currentTrack.options[0]) {
        return;
    }
    
    const trackId = currentTrack.options[0].id;
    const trackLabel = currentTrack.options[0].label;
    
    // Confirm with user
    if (!confirm(`Are you sure you want to reset "${trackLabel}"? This will clear all your answers for this track.`)) {
        return;
    }
    
    // Clear answers for this track from localStorage
    const saved = JSON.parse(localStorage.getItem('espi_answers') || '{}');
    if (saved[trackId]) {
        delete saved[trackId];
        localStorage.setItem('espi_answers', JSON.stringify(saved));
    }
    
    // Remove from completed tracks
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    const updatedCompleted = completed.filter(id => id !== trackId);
    localStorage.setItem('espi_completed', JSON.stringify(updatedCompleted));
    completedTracks = new Set(updatedCompleted);
    
    // Clear current answers object
    answers = {};
    
    // Reset question index
    currentQuestionIndex = 0;
    
    // Re-evaluate all tracks to check criteria
    await reEvaluateTracks();
    
    // Reload the track to show first question
    await loadTrack(trackId);
    
    // Update UI
    await renderTrainMap();
    await renderConnectionsGraph();
    await renderOverview();
}

// Reset a specific track by ID (for overview)
async function resetTrack(trackId) {
    if (!routing) return;
    
    // Find track config
    const trackConfig = routing.routing.find(t => t.track_id === trackId);
    if (!trackConfig) return;
    
    // Get track label
    let trackLabel = trackConfig.track_id;
    try {
        const response = await fetch(`/api/track/${trackId}`);
        const data = await response.json();
        if (data.options && data.options[0]) {
            trackLabel = data.options[0].label;
        }
    } catch (e) {
        trackLabel = trackConfig.description || trackConfig.track_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Confirm with user
    if (!confirm(`Are you sure you want to reset "${trackLabel}"? This will clear all your answers for this track.`)) {
        return;
    }
    
    // Clear answers for this track from localStorage
    const saved = JSON.parse(localStorage.getItem('espi_answers') || '{}');
    if (saved[trackId]) {
        delete saved[trackId];
        localStorage.setItem('espi_answers', JSON.stringify(saved));
    }
    
    // Remove from completed tracks
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    const updatedCompleted = completed.filter(id => id !== trackId);
    localStorage.setItem('espi_completed', JSON.stringify(updatedCompleted));
    completedTracks = new Set(updatedCompleted);
    
    // If this is the current track, reset it
    const currentTrackId = currentTrack?.options?.[0]?.id;
    if (currentTrackId === trackId) {
        answers = {};
        currentQuestionIndex = 0;
    }
    
    // Re-evaluate all tracks to check criteria
    await reEvaluateTracks();
    
    // If this was the current track, reload it
    if (currentTrackId === trackId) {
        await loadTrack(trackId);
    }
    
    // Update UI
    await renderTrainMap();
    await renderConnectionsGraph();
    await renderOverview();
}

// Show track complete and next tracks
function showTrackComplete() {
    const container = document.getElementById('questionContainer');
    const navigation = document.getElementById('navigation');
    const completionContainer = document.getElementById('completionContainer');
    const successMessage = document.getElementById('successMessage');
    
    container.style.display = 'none';
    navigation.style.display = 'none';
    
    // Show success message
    document.getElementById('successText').textContent = 
        `You've completed "${currentTrack.options[0].label}". Great job!`;
    
    // Show completion container with success message and next tracks side by side
    completionContainer.style.display = 'flex';
    
    // Load and display next track options
    displayNextTracks();
}

// Display next track options - shows all tracks with prerequisites met, grayed out if not eligible
async function displayNextTracks() {
    if (!routing) return;
    
    const nextTracks = document.getElementById('nextTracks');
    const trackCards = document.getElementById('trackCards');
    
    trackCards.innerHTML = '';
    
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    const currentTrackId = currentTrack?.options?.[0]?.id;
    
    // Find all tracks with prerequisites met (show all, even if not eligible)
    const allPossibleTracks = [];
    
    for (const trackConfig of routing.routing) {
        // Skip if already completed or is current track
        if (completed.includes(trackConfig.track_id) || trackConfig.track_id === currentTrackId) {
            continue;
        }
        
        // Check prerequisites
        const prerequisitesMet = checkTrackPrerequisites(trackConfig.track_id);
        
        // Only show tracks where prerequisites are met
        if (prerequisitesMet) {
            // Check eligibility
            const isEligible = await checkTrackEligibility(trackConfig.track_id);
            
            // Check mutually exclusive
            let isMutuallyExclusiveLocked = false;
            if (trackConfig.mutually_exclusive_with) {
                isMutuallyExclusiveLocked = trackConfig.mutually_exclusive_with.some(
                    otherId => completed.includes(otherId)
                );
            }
            
            // Track is clickable if prerequisites met, eligible, and not mutually exclusive locked
            const isClickable = isEligible && !isMutuallyExclusiveLocked;
            
            allPossibleTracks.push({
                config: trackConfig,
                isEligible: isEligible,
                isMutuallyExclusiveLocked: isMutuallyExclusiveLocked,
                isClickable: isClickable
            });
        }
    }
    
    if (allPossibleTracks.length === 0) {
        trackCards.innerHTML = '<p style="color: #666; padding: 20px;">All done! 🎉 You have completed all available tracks.</p>';
        return;
    }
    
    // Sort tracks: eligible/clickable first, then grayed out
    allPossibleTracks.sort((a, b) => {
        if (a.isClickable && !b.isClickable) return -1;
        if (!a.isClickable && b.isClickable) return 1;
        return 0;
    });
    
    // Render as bullet point list
    let html = '<ul class="space-y-3">';
    
    for (const trackInfo of allPossibleTracks) {
        const trackConfig = trackInfo.config;
        try {
            const response = await fetch(`/api/track/${trackConfig.track_id}`);
            const data = await response.json();
            const track = data.options[0];
            
            // Determine list item class
            let listItemClass = 'p-4 rounded-lg border transition-colors';
            if (trackInfo.isClickable) {
                listItemClass += ' bg-white border-gray-200 hover:border-finland-blue-500 hover:bg-blue-50 cursor-pointer';
            } else {
                listItemClass += ' bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed';
            }
            
            // Build status message
            let statusMessage = '';
            if (!trackInfo.isEligible) {
                statusMessage = ' <span class="text-xs text-gray-500">Eligibility criteria not met</span>';
            } else if (trackInfo.isMutuallyExclusiveLocked) {
                statusMessage = ' <span class="text-xs text-gray-500">Another funding track is already selected</span>';
            }
            
            const clickHandler = trackInfo.isClickable 
                ? `onclick="startNextTrack('${trackConfig.track_id}')"` 
                : '';
            
            html += `
                <li class="${listItemClass}" ${clickHandler}>
                    <div class="flex flex-col gap-1.5">
                        <strong class="text-sm font-semibold text-finland-blue-900">${track.label}</strong>
                        <span class="text-xs text-gray-600 leading-relaxed">${track.summary}</span>
                        ${statusMessage}
                    </div>
                </li>
            `;
        } catch (error) {
            console.error(`Error loading track ${trackConfig.track_id}:`, error);
        }
    }
    
    html += '</ul>';
    trackCards.innerHTML = html;
}

// Start next track or edit existing track
async function startNextTrack(trackId) {
    document.getElementById('completionContainer').style.display = 'none';
    document.getElementById('questionContainer').style.display = 'block';
    await loadTrack(trackId);
}

// Check if a track's eligibility criteria are met
async function checkTrackEligibility(trackId) {
    try {
        const response = await fetch(`/api/track/${trackId}`);
        const data = await response.json();
        const track = data.options[0];
        
        // If track has no eligibility criteria, check prerequisites only
        if (!track.eligibility || !track.eligibility.criteria_refs) {
            return checkTrackPrerequisites(trackId);
        }
        
        // Load all answers from localStorage
        const allAnswers = {};
        const saved = JSON.parse(localStorage.getItem('espi_answers') || '{}');
        for (const trackId in saved) {
            Object.assign(allAnswers, saved[trackId]);
        }
        
        // Check each eligibility criterion
        for (const criterion of track.eligibility.criteria_refs) {
            const answerKey = criterion.answer_key;
            const expectedValue = criterion.expected_value;
            const actualValue = allAnswers[answerKey];
            
            // Convert string booleans to actual booleans if needed
            let normalizedActual = actualValue;
            if (typeof expectedValue === 'boolean' && typeof actualValue === 'string') {
                normalizedActual = actualValue === 'true' || actualValue === true;
            }
            
            if (normalizedActual !== expectedValue) {
                return false;
            }
        }
        
        // Also check prerequisites
        return checkTrackPrerequisites(trackId);
    } catch (error) {
        console.error('Error checking eligibility:', error);
        return false;
    }
}

// Check if track prerequisites are met
function checkTrackPrerequisites(trackId) {
    if (!routing) return false;
    
    const trackConfig = routing.routing.find(r => r.track_id === trackId);
    if (!trackConfig) return false;
    
    // Entry track has no prerequisites
    if (trackId === routing.entry_track) {
        return true;
    }
    
    // If no prerequisites defined, track is not accessible
    if (!trackConfig.prerequisites || trackConfig.prerequisites.length === 0) {
        return false;
    }
    
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    return trackConfig.prerequisites.every(prereq => completed.includes(prereq));
}

// Re-evaluate all tracks and find the last valid track
async function findLastValidTrack() {
    if (!routing) return routing.entry_track;
    
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    let lastValidTrack = routing.entry_track;
    
    // Check tracks in order
    const entryTrack = routing.routing.find(r => r.track_id === routing.entry_track);
    if (entryTrack) {
        const tracksToCheck = [entryTrack];
        
        // Build track sequence
        function addNextTracks(trackConfig, visited = new Set()) {
            if (trackConfig.next_tracks) {
                for (const nextId of trackConfig.next_tracks) {
                    if (!visited.has(nextId)) {
                        visited.add(nextId);
                        const nextTrack = routing.routing.find(r => r.track_id === nextId);
                        if (nextTrack) {
                            tracksToCheck.push(nextTrack);
                            addNextTracks(nextTrack, visited);
                        }
                    }
                }
            }
        }
        addNextTracks(entryTrack);
        
        // Check each track in sequence
        for (const trackConfig of tracksToCheck) {
            const isCompleted = completed.includes(trackConfig.track_id);
            
            if (isCompleted) {
                // Check if this completed track is still valid
                const isValid = await checkTrackEligibility(trackConfig.track_id);
                if (isValid) {
                    lastValidTrack = trackConfig.track_id;
                } else {
                    // This track is no longer valid, stop here
                    break;
                }
            } else {
                // Check if we can access this track
                const canAccess = await checkTrackEligibility(trackConfig.track_id);
                if (canAccess) {
                    lastValidTrack = trackConfig.track_id;
                } else {
                    break;
                }
            }
        }
    }
    
    return lastValidTrack;
}

// Re-evaluate and reset if needed
async function reEvaluateTracks() {
    const lastValidTrack = await findLastValidTrack();
    const currentTrackId = currentTrack?.options?.[0]?.id;
    
    // If current track is still valid, keep it
    if (currentTrackId && await checkTrackEligibility(currentTrackId)) {
        return;
    }
    
    // Remove invalid completed tracks
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    const validCompleted = [];
    
    for (const trackId of completed) {
        const isValid = await checkTrackEligibility(trackId);
        if (isValid) {
            validCompleted.push(trackId);
        }
    }
    
    localStorage.setItem('espi_completed', JSON.stringify(validCompleted));
    completedTracks = new Set(validCompleted);
    
    // Reset to last valid track
    if (currentTrackId !== lastValidTrack) {
        await loadTrack(lastValidTrack);
    }
    
    // Update train map
    await renderTrainMap();
    
    // Update connections graph
    await renderConnectionsGraph();
}

// Show error
function showError(message) {
    const container = document.getElementById('questionContainer');
    container.innerHTML = `<div class="error" style="padding: 20px; background: #fee; border: 2px solid #fcc; border-radius: 8px; color: #c33;">${message}</div>`;
}

// Render train station map - uses SVG like connections graph
async function renderTrainMap() {
    if (!routing) return;
    
    const trainMap = document.getElementById('trainMap');
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    const currentTrackId = currentTrack?.options?.[0]?.id;
    
    // Build graph structure (same as renderConnectionsGraph)
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();
    
    // Create nodes for all tracks
    for (const trackConfig of routing.routing) {
        const trackId = trackConfig.track_id;
        const isCompleted = completed.includes(trackId);
        const isCurrent = trackId === currentTrackId;
        const isEligible = await checkTrackEligibility(trackId);
        
        // Get track label
        let trackLabel = trackConfig.track_id;
        try {
            const response = await fetch(`/api/track/${trackId}`);
                        const data = await response.json();
                        if (data.options && data.options[0]) {
                trackLabel = data.options[0].label;
                        }
                    } catch (e) {
            trackLabel = trackConfig.description || trackConfig.track_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                
                // Check if terminal track
        const isTerminal = trackConfig.is_terminal === true;
                
        // Determine node status
        let nodeClass = 'node-unavailable';
                if (isTerminal) {
            nodeClass = isCompleted ? 'node-terminal' : (checkTrackPrerequisites(trackId) && isEligible ? 'node-terminal-available' : 'node-terminal-unavailable');
        } else if (isCompleted) {
            nodeClass = isEligible ? 'node-completed' : 'node-invalid';
                } else if (isCurrent) {
            nodeClass = 'node-current';
        } else {
            const prerequisitesMet = checkTrackPrerequisites(trackId);
            if (prerequisitesMet && isEligible) {
                nodeClass = 'node-available';
            }
        }
        
        const node = {
            id: trackId,
            label: trackLabel,
            order: trackConfig.order || 999,
            class: nodeClass,
            isEntry: trackId === routing.entry_track,
            isTerminal: isTerminal,
            config: trackConfig
        };
        
        nodes.push(node);
        nodeMap.set(trackId, node);
    }
    
    // Create edges based on prerequisites
    for (const trackConfig of routing.routing) {
                    if (trackConfig.prerequisites && trackConfig.prerequisites.length > 0) {
            for (const prereqId of trackConfig.prerequisites) {
                if (nodeMap.has(prereqId)) {
                    edges.push({
                        from: prereqId,
                        to: trackConfig.track_id,
                        fromNode: nodeMap.get(prereqId),
                        toNode: nodeMap.get(trackConfig.track_id)
                    });
                }
            }
        }
    }
    
    // Sort nodes by order for layout
    nodes.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.id.localeCompare(b.id);
    });
    
    // Group nodes by order for vertical layout
    const nodesByOrder = new Map();
    for (const node of nodes) {
        const order = node.order || 999;
        if (!nodesByOrder.has(order)) {
            nodesByOrder.set(order, []);
        }
        nodesByOrder.get(order).push(node);
    }
    
    // Calculate positions
    const sortedOrders = Array.from(nodesByOrder.keys()).sort((a, b) => a - b);
    const nodePositions = new Map();
    const maxNodesPerLevel = Math.max(...Array.from(nodesByOrder.values()).map(n => n.length));
    
    // Calculate container dimensions
    const container = trainMap;
    const containerWidth = container.offsetWidth || 1200;
    const containerHeight = container.offsetHeight || 600;
    
    // Use a larger virtual canvas for node positioning, then scale down with viewBox
    const virtualWidth = containerWidth * 1.5; // Larger virtual width
    const virtualHeight = containerHeight;
    
    // Use spacing based on virtual canvas size
    const baseSpacing = 300;
    const stationSpacing = Math.max(baseSpacing, virtualWidth / (maxNodesPerLevel + 1));
    const baseLineHeight = 70; // Even more reduced for very tight vertical spacing
    const lineHeight = Math.max(baseLineHeight, virtualHeight / (sortedOrders.length + 1.5)); // Back to 1.5
    
    // Calculate node positions on virtual canvas and track bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const circleRadius = 70;
    const labelHeight = 104; // Space for labels below nodes
    
    for (let orderIdx = 0; orderIdx < sortedOrders.length; orderIdx++) {
        const order = sortedOrders[orderIdx];
        const nodesInOrder = nodesByOrder.get(order) || [];
        const y = 50 + (orderIdx + 1) * lineHeight;
        
        for (let i = 0; i < nodesInOrder.length; i++) {
            const x = 50 + (i + 1) * stationSpacing;
            nodePositions.set(nodesInOrder[i].id, { x, y });
            
            // Track bounds including circle and label
            const node = nodesInOrder[i];
            const words = node.label.split(' ');
            const maxWordsPerLine = 4;
            const numLines = Math.ceil(words.length / maxWordsPerLine);
            const estimatedLabelHeight = numLines * 19;
            
            minX = Math.min(minX, x - circleRadius);
            maxX = Math.max(maxX, x + circleRadius);
            minY = Math.min(minY, y - circleRadius);
            maxY = Math.max(maxY, y + labelHeight + estimatedLabelHeight);
        }
    }
    
    // Calculate content dimensions
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Add 5% padding
    const paddingX = contentWidth * 0.05;
    const paddingY = contentHeight * 0.05;
    
    // Set viewBox to fit content with 5% padding
    const viewBoxX = minX - paddingX;
    const viewBoxY = minY - paddingY;
    const viewBoxWidth = contentWidth + (paddingX * 2);
    const viewBoxHeight = contentHeight + (paddingY * 2);
    
    // Render SVG
    let html = `<svg class="graph-svg train-map-svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`;
    
    // Draw train lines (horizontal tracks) first
    for (let orderIdx = 0; orderIdx < sortedOrders.length; orderIdx++) {
        const order = sortedOrders[orderIdx];
        const nodesInOrder = nodesByOrder.get(order) || [];
        
        if (nodesInOrder.length > 0) {
            const firstNode = nodePositions.get(nodesInOrder[0].id);
            const lastNode = nodePositions.get(nodesInOrder[nodesInOrder.length - 1].id);
            const y = firstNode.y;
            const firstX = firstNode.x;
            const lastX = lastNode.x;
            
            html += `<line x1="${firstX}" y1="${y}" x2="${lastX}" y2="${y}" class="train-line-track" stroke-width="20"/>`;
        }
    }
    
    // Draw vertical connections between levels
    for (const edge of edges) {
        const fromPos = nodePositions.get(edge.from);
        const toPos = nodePositions.get(edge.to);
        
        if (!fromPos || !toPos) continue;
        
        const fromX = fromPos.x;
        const fromY = fromPos.y;
        const toX = toPos.x;
        const toY = toPos.y;
        
        if (Math.abs(fromY - toY) > 10) {
            html += `<line x1="${fromX}" y1="${fromY}" x2="${fromX}" y2="${toY}" class="train-line-connection" stroke-width="10"/>`;
            if (Math.abs(fromX - toX) > 10) {
                html += `<line x1="${fromX}" y1="${toY}" x2="${toX}" y2="${toY}" class="train-line-connection" stroke-width="10"/>`;
            }
            const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
            html += `<polygon points="${toX},${toY} ${toX - 24},${toY - 12} ${toX - 24},${toY + 12}" class="train-arrow" transform="rotate(${angle} ${toX} ${toY})"/>`;
        }
    }
    
    // Draw stations (nodes)
    for (let orderIdx = 0; orderIdx < sortedOrders.length; orderIdx++) {
        const order = sortedOrders[orderIdx];
        const nodesInOrder = nodesByOrder.get(order) || [];
        
        for (let i = 0; i < nodesInOrder.length; i++) {
            const node = nodesInOrder[i];
            const pos = nodePositions.get(node.id);
            if (!pos) continue;
            const x = pos.x;
            const y = pos.y;
            
            html += `<circle cx="${x}" cy="${y}" r="70" class="train-station-outer ${node.class}" data-track-id="${node.id}"/>`;
            html += `<circle cx="${x}" cy="${y}" r="45" class="train-station-inner ${node.class}"/>`;
            
            if (node.isTerminal) {
                html += `<text x="${x}" y="${y + 18}" class="train-station-icon" text-anchor="middle" font-size="48">🏆</text>`;
            } else if (node.isEntry) {
                html += `<circle cx="${x}" cy="${y}" r="20" class="train-station-entry-dot"/>`;
            } else if (node.class.includes('current')) {
                html += `<circle cx="${x}" cy="${y}" r="20" class="train-station-current-dot"/>`;
            } else if (node.class.includes('completed')) {
                html += `<circle cx="${x}" cy="${y}" r="18" class="train-station-completed-dot"/>`;
            }
            
            // Draw station label
            const labelY = y + 104;
            const words = node.label.split(' ');
            const maxWordsPerLine = 4;
            let labelHtml = '';
            if (words.length <= maxWordsPerLine) {
                labelHtml = `<text x="${x}" y="${labelY}" class="train-station-label" text-anchor="middle" font-size="20">${node.label}</text>`;
            } else {
                for (let lineIdx = 0; lineIdx < Math.ceil(words.length / maxWordsPerLine); lineIdx++) {
                    const lineWords = words.slice(lineIdx * maxWordsPerLine, (lineIdx + 1) * maxWordsPerLine);
                    const lineY = labelY + (lineIdx * 19);
                    labelHtml += `<text x="${x}" y="${lineY}" class="train-station-label" text-anchor="middle" font-size="20">${lineWords.join(' ')}</text>`;
                }
            }
            html += labelHtml;
        }
    }
    
    html += '</svg>';
    trainMap.innerHTML = html;
    
    // Make stations clickable
    trainMap.querySelectorAll('.train-station-outer').forEach(stationEl => {
        stationEl.addEventListener('click', (e) => {
            const trackId = e.target.getAttribute('data-track-id');
            if (trackId) {
                startNextTrack(trackId);
            }
        });
    });
}

// Toggle overview page
let overviewVisible = false;
async function toggleOverview() {
    const overviewSection = document.getElementById('overviewSection');
    const overviewBtn = document.getElementById('overviewBtn');
    const journeyLink = document.getElementById('journeyLink');
    
    if (overviewVisible) {
        overviewSection.style.display = 'none';
        if (overviewBtn) overviewBtn.textContent = 'View Overview';
        if (journeyLink) journeyLink.classList.remove('active');
        overviewVisible = false;
    } else {
        overviewSection.style.display = 'block';
        if (overviewBtn) overviewBtn.textContent = 'Hide Overview';
        if (journeyLink) journeyLink.classList.add('active');
        overviewVisible = true;
        await renderOverview();
        // Scroll to overview
        overviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Render overview of all started/completed tracks
async function renderOverview() {
    if (!routing) return;
    
    const overviewTracks = document.getElementById('overviewTracks');
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    const currentTrackId = currentTrack?.options?.[0]?.id;
    const saved = JSON.parse(localStorage.getItem('espi_answers') || '{}');
    
    // Get all tracks that have been started (have answers) or completed
    const startedTracks = [];
    
    for (const trackConfig of routing.routing) {
        const trackId = trackConfig.track_id;
        const isCompleted = completed.includes(trackId);
        const isCurrent = trackId === currentTrackId;
        const hasAnswers = saved[trackId] && Object.keys(saved[trackId]).length > 0;
        
        if (isCompleted || isCurrent || hasAnswers) {
            try {
                const response = await fetch(`/api/track/${trackId}`);
                const data = await response.json();
                const track = data.options[0];
                
                // Count answered questions
                const questions = track.required_inputs || [];
                const trackAnswers = saved[trackId] || {};
                const answeredCount = questions.filter(q => {
                    const answer = trackAnswers[q.key];
                    return answer !== undefined && answer !== null && answer !== '';
                }).length;
                const totalQuestions = questions.length;
                const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
                
                // Check eligibility
                const isEligible = await checkTrackEligibility(trackId);
                
                startedTracks.push({
                    config: trackConfig,
                    track: track,
                    isCompleted: isCompleted,
                    isCurrent: isCurrent,
                    progress: progress,
                    answeredCount: answeredCount,
                    totalQuestions: totalQuestions,
                    isEligible: isEligible
                });
            } catch (error) {
                console.error(`Error loading track ${trackId}:`, error);
            }
        }
    }
    
    if (startedTracks.length === 0) {
        overviewTracks.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No tracks started yet. Begin by completing the first track!</p>';
        return;
    }
    
    // Sort by order, then by status (current first, then completed, then started)
    startedTracks.sort((a, b) => {
        const orderA = a.config.order || 999;
        const orderB = b.config.order || 999;
        if (orderA !== orderB) return orderA - orderB;
        
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        if (a.isCompleted && !b.isCompleted) return -1;
        if (!a.isCompleted && b.isCompleted) return 1;
        return 0;
    });
    
    let html = '';
    for (const trackInfo of startedTracks) {
        const { track, isCompleted, isCurrent, progress, answeredCount, totalQuestions, isEligible } = trackInfo;
        
        let statusBadge = '';
        let statusClass = '';
        if (isCurrent) {
            statusBadge = '<span class="px-3 py-1 bg-gradient-to-r from-finland-blue-700 to-finland-blue-500 text-white text-xs font-semibold rounded-full shadow-sm">In Progress</span>';
            statusClass = 'overview-track-current';
        } else if (isCompleted) {
            if (isEligible) {
                statusBadge = '<span class="px-3 py-1 bg-gradient-to-r from-finland-green-600 to-finland-green-400 text-white text-xs font-semibold rounded-full shadow-sm">Completed</span>';
                statusClass = 'overview-track-completed';
            } else {
                statusBadge = '<span class="px-3 py-1 bg-gradient-to-r from-finland-orange to-amber-400 text-white text-xs font-semibold rounded-full shadow-sm">Completed (Invalid)</span>';
                statusClass = 'overview-track-invalid';
            }
        } else {
            statusBadge = '<span class="px-3 py-1 bg-gray-400 text-white text-xs font-semibold rounded-full shadow-sm">Started</span>';
            statusClass = 'overview-track-started';
        }
        
        const statusBgClass = statusClass.includes('current') ? 'bg-gradient-to-br from-finland-blue-50 to-blue-100 border-finland-blue-500' :
                              statusClass.includes('completed') ? 'bg-gradient-to-br from-finland-green-50 to-green-100 border-finland-green-500' :
                              statusClass.includes('invalid') ? 'bg-gradient-to-br from-amber-50 to-orange-100 border-finland-orange' :
                              'bg-gradient-to-br from-gray-50 to-white border-gray-300';
        
        html += `
            <div class="p-5 rounded-lg border border-gray-200 bg-white transition-colors hover:border-finland-blue-500">
                <div class="flex justify-between items-start gap-4 mb-3">
                    <h3 onclick="startNextTrack('${trackInfo.config.track_id}')" class="text-base font-semibold text-finland-blue-900 cursor-pointer hover:text-finland-blue-700 transition-colors flex-1">${track.label}</h3>
                    <div class="flex items-center gap-2">
                        ${statusBadge}
                        <button class="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors" onclick="event.stopPropagation(); resetTrack('${trackInfo.config.track_id}');" title="Reset this track and clear all answers">
                            Reset
                        </button>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mb-3 leading-relaxed">${track.summary}</p>
                <div class="space-y-2">
                    <div>
                        <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                            <div class="h-full bg-finland-blue-700 transition-all duration-300 rounded-full" style="width: ${progress}%"></div>
                        </div>
                        <span class="text-xs text-gray-500">${answeredCount}/${totalQuestions} questions answered (${progress}%)</span>
                    </div>
                    <div class="text-xs text-gray-500">Provider: ${track.provider}</div>
                </div>
            </div>
        `;
    }
    
    overviewTracks.innerHTML = html;
}

// Show summary page after terminal track completion or when requested
async function showSummaryPage() {
    if (!routing) return;
    
    // Hide all other sections
    document.getElementById('progress-section').style.display = 'none';
    document.getElementById('trackInfo').style.display = 'none';
    document.getElementById('questionContainer').style.display = 'none';
    document.getElementById('navigation').style.display = 'none';
    document.getElementById('completionContainer').style.display = 'none';
    document.getElementById('trainMapContainer').style.display = 'none';
    document.getElementById('connectionsGraphContainer').style.display = 'none';
    document.getElementById('overviewSection').style.display = 'none';
    const mainContentArea = document.getElementById('mainContentArea');
    if (mainContentArea) mainContentArea.style.display = 'none';
    const overviewBtn = document.getElementById('overviewBtn');
    if (overviewBtn) overviewBtn.style.display = 'none';
    const summaryBtn = document.getElementById('summaryBtn');
    if (summaryBtn) summaryBtn.style.display = 'none';
    const summaryNavBtn = document.getElementById('summaryNavBtn');
    if (summaryNavBtn) summaryNavBtn.style.display = 'none';
    const journeyLink = document.getElementById('journeyLink');
    if (journeyLink) journeyLink.style.display = 'none';
    
    // Show summary container
    const summaryContainer = document.getElementById('summaryContainer');
    summaryContainer.style.display = 'block';
    
    // Build summary content
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    const saved = JSON.parse(localStorage.getItem('espi_answers') || '{}');
    const summaryContent = document.getElementById('summaryContent');
    
    let html = '';
    
    // Get all tracks with answers (completed or started) sorted by order
    const tracksWithAnswers = [];
    for (const trackConfig of routing.routing) {
        const trackId = trackConfig.track_id;
        const trackAnswers = saved[trackId] || {};
        
        // Check if track has any answers
        const hasAnswers = Object.keys(trackAnswers).length > 0;
        
        if (hasAnswers || completed.includes(trackId)) {
            tracksWithAnswers.push({
                config: trackConfig,
                order: trackConfig.order || 999,
                isCompleted: completed.includes(trackId)
            });
        }
    }
    
    tracksWithAnswers.sort((a, b) => a.order - b.order);
    
    // Render each track with its answers
    for (const trackInfo of tracksWithAnswers) {
        const trackConfig = trackInfo.config;
        const trackId = trackConfig.track_id;
        
        // Load track data
        let track = null;
        try {
            const response = await fetch(`/api/track/${trackId}`);
            const data = await response.json();
            if (data.options && data.options[0]) {
                track = data.options[0];
            }
        } catch (e) {
            continue;
        }
        
        if (!track) continue;
        
        const trackAnswers = saved[trackId] || {};
        const questions = track.required_inputs || [];
        
        // Count answered questions
        const answeredQuestions = questions.filter(q => {
            const answer = trackAnswers[q.key];
            return answer !== undefined && answer !== null && answer !== '';
        });
        
        if (answeredQuestions.length === 0) continue;
        
        // Determine track category/type
        let categoryBadge = '';
        if (trackConfig.category) {
            const categoryColors = {
                'funding': '#0066cc',
                'financial': '#00a86b',
                'submission': '#ffd700',
                'general': '#00a8e8',
                'insurance': '#9b59b6'
            };
            const categoryColor = categoryColors[trackConfig.category] || '#666';
            categoryBadge = `<span class="summary-category-badge" style="background: ${categoryColor}20; color: ${categoryColor}; border-color: ${categoryColor};">${trackConfig.category.toUpperCase()}</span>`;
        }
        
        // Status badge
        const statusBadge = trackInfo.isCompleted 
            ? '<span class="summary-status-badge summary-status-completed">✓ Completed</span>'
            : '<span class="summary-status-badge summary-status-started">○ In Progress</span>';
        
        html += `
            <div class="p-6 bg-white rounded-lg border border-gray-200">
                <div class="flex justify-between items-start gap-6 mb-5 pb-4 border-b border-gray-200">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-finland-blue-900 mb-3 tracking-tight">${track.label}</h3>
                        <div class="flex flex-wrap gap-2">
                            ${categoryBadge}
                            ${statusBadge}
                        </div>
                    </div>
                    <div class="text-xs text-gray-500">
                        <span>${track.provider || 'ESPI System'}</span>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mb-5 leading-relaxed">${track.summary || ''}</p>
                <div>
                    <h4 class="text-sm font-semibold text-finland-blue-900 mb-3">Your Answers:</h4>
                    <div class="space-y-3">
        `;
        
        // Display all answered questions
        for (const question of answeredQuestions) {
            const answer = trackAnswers[question.key];
            let answerDisplay = '';
            
            if (question.type === 'boolean') {
                answerDisplay = answer === true || answer === 'true' ? '✓ Yes' : '✗ No';
            } else if (question.type === 'file') {
                answerDisplay = `📎 ${answer}`;
            } else if (question.type === 'long_text') {
                // For long text, show first 200 chars with expand option
                const shortText = answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
                answerDisplay = `<div class="summary-answer-long">${shortText.replace(/\n/g, '<br>')}</div>`;
            } else {
                answerDisplay = answer;
            }
            
            html += `
                        <div class="p-3 bg-gray-50 rounded border border-gray-200">
                            <div class="text-xs font-semibold text-finland-blue-900 mb-1.5">${question.label}</div>
                            <div class="text-sm text-gray-700 whitespace-pre-wrap">${answerDisplay}</div>
                        </div>
            `;
        }
        
        html += `
                    </div>
                </div>
            </div>
        `;
    }
    
    // If no tracks with answers, show message
    if (html === '') {
        html = '<div class="text-center py-12 text-gray-500"><p class="text-lg">No tracks with answers to display. Start completing tracks to see your summary here.</p></div>';
    }
    
    summaryContent.innerHTML = html;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Hide summary page and return to application
function hideSummary() {
    document.getElementById('summaryContainer').style.display = 'none';
    document.getElementById('progress-section').style.display = 'block';
    document.getElementById('trainMapContainer').style.display = 'block';
    document.getElementById('connectionsGraphContainer').style.display = 'block';
    const mainContentArea = document.getElementById('mainContentArea');
    if (mainContentArea) mainContentArea.style.display = 'block';
    const overviewBtn = document.getElementById('overviewBtn');
    if (overviewBtn) overviewBtn.style.display = 'block';
    const summaryBtn = document.getElementById('summaryBtn');
    if (summaryBtn) summaryBtn.style.display = 'block';
    const summaryNavBtn = document.getElementById('summaryNavBtn');
    if (summaryNavBtn) summaryNavBtn.style.display = 'flex';
    const journeyLink = document.getElementById('journeyLink');
    if (journeyLink) journeyLink.style.display = 'flex';
    
    // Reload the current track
    if (currentTrack && currentTrack.options && currentTrack.options[0]) {
        const trackId = currentTrack.options[0].id;
        loadTrack(trackId);
    }
}

// Render Your Business Journey graph
async function renderConnectionsGraph() {
    if (!routing) return;
    
    const connectionsGraph = document.getElementById('connectionsGraph');
    const completed = JSON.parse(localStorage.getItem('espi_completed') || '[]');
    const currentTrackId = currentTrack?.options?.[0]?.id;
    
    // Build graph structure
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();
    
    // Create nodes for all tracks
    for (const trackConfig of routing.routing) {
        const trackId = trackConfig.track_id;
        const isCompleted = completed.includes(trackId);
        const isCurrent = trackId === currentTrackId;
        const isEligible = await checkTrackEligibility(trackId);
        
        // Get track label - use full label for better readability
        let trackLabel = trackConfig.track_id;
        try {
            const response = await fetch(`/api/track/${trackId}`);
            const data = await response.json();
            if (data.options && data.options[0]) {
                trackLabel = data.options[0].label; // Use full label instead of shortened
            }
        } catch (e) {
            trackLabel = trackConfig.description || trackConfig.track_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        
        // Check if terminal track
        const isTerminal = trackConfig.is_terminal === true;
        
        // Determine node status
        let nodeClass = 'node-unavailable';
        if (isTerminal) {
            nodeClass = isCompleted ? 'node-terminal' : (checkTrackPrerequisites(trackId) && isEligible ? 'node-terminal-available' : 'node-terminal-unavailable');
        } else if (isCompleted) {
            nodeClass = isEligible ? 'node-completed' : 'node-invalid';
        } else if (isCurrent) {
            nodeClass = 'node-current';
        } else {
            // Check if prerequisites are met
            const prerequisitesMet = checkTrackPrerequisites(trackId);
            if (prerequisitesMet && isEligible) {
                nodeClass = 'node-available';
            }
        }
        
        const node = {
            id: trackId,
            label: trackLabel,
            order: trackConfig.order || 999,
            class: nodeClass,
            isEntry: trackId === routing.entry_track,
            isTerminal: isTerminal,
            config: trackConfig
        };
        
        nodes.push(node);
        nodeMap.set(trackId, node);
    }
    
    // Create edges based on prerequisites
    for (const trackConfig of routing.routing) {
        if (trackConfig.prerequisites && trackConfig.prerequisites.length > 0) {
            for (const prereqId of trackConfig.prerequisites) {
                if (nodeMap.has(prereqId)) {
                    edges.push({
                        from: prereqId,
                        to: trackConfig.track_id,
                        fromNode: nodeMap.get(prereqId),
                        toNode: nodeMap.get(trackConfig.track_id)
                    });
                }
            }
        }
    }
    
    // Sort nodes by order for layout
    nodes.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.id.localeCompare(b.id);
    });
    
    // Group nodes by order for vertical layout
    const nodesByOrder = new Map();
    for (const node of nodes) {
        const order = node.order || 999;
        if (!nodesByOrder.has(order)) {
            nodesByOrder.set(order, []);
        }
        nodesByOrder.get(order).push(node);
    }
    
    // Calculate positions first to determine bounds
    const sortedOrders = Array.from(nodesByOrder.keys()).sort((a, b) => a - b);
    const nodePositions = new Map();
    const maxNodesPerLevel = Math.max(...Array.from(nodesByOrder.values()).map(n => n.length));
    
    // Use tighter spacing - calculate based on content
    const baseSpacing = 300; // Base spacing between nodes
    const stationSpacing = Math.max(baseSpacing, 800 / (maxNodesPerLevel + 1));
    const baseLineHeight = 200; // Base spacing between levels (20% less)
    const lineHeight = Math.max(baseLineHeight, 480 / (sortedOrders.length + 1)); // 20% less
    
    // Calculate all positions and track bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    // Calculate node positions
    for (let orderIdx = 0; orderIdx < sortedOrders.length; orderIdx++) {
        const order = sortedOrders[orderIdx];
        const nodesInOrder = nodesByOrder.get(order) || [];
        const y = 50 + (orderIdx + 1) * lineHeight;
        
        for (let i = 0; i < nodesInOrder.length; i++) {
            const x = 50 + (i + 1) * stationSpacing;
            nodePositions.set(nodesInOrder[i].id, { x, y });
            
            // Track bounds for circles (radius 70) and labels
            const circleRadius = 70;
            const labelY = y + 104; // 20% less spacing (130 * 0.8 = 104)
            
            // Estimate label height based on text length
            const node = nodesInOrder[i];
            const words = node.label.split(' ');
            const maxWordsPerLine = 4;
            const numLines = Math.ceil(words.length / maxWordsPerLine);
            const estimatedLabelHeight = numLines * 19; // 20% less (24 * 0.8 = 19.2, rounded to 19)
            
            minX = Math.min(minX, x - circleRadius);
            maxX = Math.max(maxX, x + circleRadius);
            minY = Math.min(minY, y - circleRadius);
            maxY = Math.max(maxY, labelY + estimatedLabelHeight);
        }
        
        // Also account for train lines
        if (nodesInOrder.length > 0) {
            const firstNode = nodePositions.get(nodesInOrder[0].id);
            const lastNode = nodePositions.get(nodesInOrder[nodesInOrder.length - 1].id);
            if (firstNode && lastNode) {
                minX = Math.min(minX, firstNode.x);
                maxX = Math.max(maxX, lastNode.x);
            }
        }
    }
    
    // Set viewBox to start at 0,0 and use viewport dimensions
    const viewBoxX = 0;
    const viewBoxY = 0;
    const viewBoxWidth = window.innerWidth || 1920;
    const viewBoxHeight = window.innerHeight || 1080;
    
    // Render graph with viewBox starting at 0,0 and using viewport dimensions
    // Use preserveAspectRatio="none" to stretch to full width
    let html = `<svg class="graph-svg train-map-svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
    
    // Draw train lines (horizontal tracks) first
    for (let orderIdx = 0; orderIdx < sortedOrders.length; orderIdx++) {
        const order = sortedOrders[orderIdx];
        const nodesInOrder = nodesByOrder.get(order) || [];
        
        if (nodesInOrder.length > 0) {
            const firstNode = nodePositions.get(nodesInOrder[0].id);
            const lastNode = nodePositions.get(nodesInOrder[nodesInOrder.length - 1].id);
            const y = firstNode.y;
            const firstX = firstNode.x;
            const lastX = lastNode.x;
            
            // Draw horizontal train line
            html += `<line x1="${firstX}" y1="${y}" x2="${lastX}" y2="${y}" class="train-line-track" stroke-width="20"/>`;
        }
    }
    
    // Draw vertical connections between levels (prerequisites)
    for (const edge of edges) {
        const fromPos = nodePositions.get(edge.from);
        const toPos = nodePositions.get(edge.to);
        
        if (!fromPos || !toPos) continue;
        
        const fromX = fromPos.x;
        const fromY = fromPos.y;
        const toX = toPos.x;
        const toY = toPos.y;
        
        // Only draw if nodes are on different levels (different Y coordinates)
        if (Math.abs(fromY - toY) > 10) {
            // Vertical line - thicker for better visibility
            html += `<line x1="${fromX}" y1="${fromY}" x2="${fromX}" y2="${toY}" class="train-line-connection" stroke-width="10"/>`;
            // Horizontal connector if needed
            if (Math.abs(fromX - toX) > 10) {
                html += `<line x1="${fromX}" y1="${toY}" x2="${toX}" y2="${toY}" class="train-line-connection" stroke-width="10"/>`;
            }
            // Arrow at the end - bigger for better visibility
            const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
            html += `<polygon points="${toX},${toY} ${toX - 24},${toY - 12} ${toX - 24},${toY + 12}" class="train-arrow" transform="rotate(${angle} ${toX} ${toY})"/>`;
        }
    }
    
    // Draw stations (nodes)
    for (let orderIdx = 0; orderIdx < sortedOrders.length; orderIdx++) {
        const order = sortedOrders[orderIdx];
        const nodesInOrder = nodesByOrder.get(order) || [];
        
        for (let i = 0; i < nodesInOrder.length; i++) {
            const node = nodesInOrder[i];
            const pos = nodePositions.get(node.id);
            if (!pos) continue;
            const x = pos.x;
            const y = pos.y;
            
            // Draw station outer circle (track circle) - much bigger size for better visibility
            html += `<circle cx="${x}" cy="${y}" r="70" class="train-station-outer ${node.class}" data-track-id="${node.id}"/>`;
            
            // Draw station inner circle (station platform) - bigger size
            html += `<circle cx="${x}" cy="${y}" r="45" class="train-station-inner ${node.class}"/>`;
            
            // Draw station icon/indicator - bigger
            if (node.isTerminal) {
                html += `<text x="${x}" y="${y + 18}" class="train-station-icon" text-anchor="middle" font-size="48">🏆</text>`;
            } else if (node.isEntry) {
                html += `<circle cx="${x}" cy="${y}" r="20" class="train-station-entry-dot"/>`;
            } else if (node.class.includes('current')) {
                html += `<circle cx="${x}" cy="${y}" r="20" class="train-station-current-dot"/>`;
            } else if (node.class.includes('completed')) {
                html += `<circle cx="${x}" cy="${y}" r="18" class="train-station-completed-dot"/>`;
            }
            
            // Draw station label below - with better spacing and wrapping support
            const labelY = y + 104; // 20% less spacing (130 * 0.8 = 104)
            // Split long labels into multiple lines if needed
            const words = node.label.split(' ');
            const maxWordsPerLine = 4;
            let labelHtml = '';
            if (words.length <= maxWordsPerLine) {
                // Single line
                labelHtml = `<text x="${x}" y="${labelY}" class="train-station-label" text-anchor="middle" font-size="20">${node.label}</text>`;
            } else {
                // Multiple lines
                for (let lineIdx = 0; lineIdx < Math.ceil(words.length / maxWordsPerLine); lineIdx++) {
                    const lineWords = words.slice(lineIdx * maxWordsPerLine, (lineIdx + 1) * maxWordsPerLine);
                    const lineY = labelY + (lineIdx * 19); // 20% less line spacing (24 * 0.8 = 19.2, rounded to 19)
                    labelHtml += `<text x="${x}" y="${lineY}" class="train-station-label" text-anchor="middle" font-size="20">${lineWords.join(' ')}</text>`;
                }
            }
            html += labelHtml;
        }
    }
    
    html += '</svg>';
    connectionsGraph.innerHTML = html;
    
    // Make stations clickable
    connectionsGraph.querySelectorAll('.train-station-outer').forEach(stationEl => {
        stationEl.addEventListener('click', (e) => {
            const trackId = e.target.getAttribute('data-track-id');
            if (trackId) {
                startNextTrack(trackId);
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

