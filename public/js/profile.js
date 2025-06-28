const profileForm = document.getElementById('profileForm');
const mentorSkillsContainer = document.getElementById('mentorSkills');
const menteeInterestsContainer = document.getElementById('menteeInterests');
const newMentorSkillInput = document.getElementById('newMentorSkill');
const addMentorSkillBtn = document.getElementById('addMentorSkill');
const newMenteeInterestInput = document.getElementById('newMenteeInterest');
const addMenteeInterestBtn = document.getElementById('addMenteeInterest');
const profileSuccess = document.getElementById('profileSuccess');

// Current user data
let userProfile = null;

// Initialize profile module - NO REDIRECTS TO DASHBOARD
document.addEventListener('DOMContentLoaded', async () => {
    if (!profileForm) return;

    // Only check authentication
    if (!isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }

    try {
        await loadProfileData();
        setupSkillHandlers();
        profileForm.addEventListener('submit', handleProfileSubmit);
    } catch (err) {
        console.error('Profile initialization error:', err);
        showError('Failed to load profile data. Please try again.');
        // NO REDIRECT ON ERROR
    }
});

async function loadProfileData() {
    const userId = getCurrentUserId();
    if (!userId) {
        window.location.href = '/index.html'; // Only redirect to login if not auth
        return;
    }

    try {
        userProfile = await makeAuthenticatedRequest(`/api/profile/${userId}`);
        renderProfileForm();
        
    } catch (err) {
        if (err.message.includes('401')) {
            window.location.href = '/index.html'; // Only redirect on auth errors
        } else {
            console.error('Failed to load profile:', err);
            showError('Failed to load profile data. Please try again.');
        }
    }
}

// Render profile form with loaded data
function renderProfileForm() {
    if (!userProfile) return;

    // Basic Info
    document.getElementById('profileName').value = userProfile.name || '';
    document.getElementById('profileRole').value = userProfile.role || 'mentor';
    document.getElementById('profileTitle').value = userProfile.title || '';
    document.getElementById('profileBio').value = userProfile.bio || '';
    document.getElementById('meetingFrequency').value = userProfile.meeting_frequency || 'weekly';

    // Skills & Interests
    renderSkills(userProfile.skills || [], mentorSkillsContainer);
    renderSkills(userProfile.interests || [], menteeInterestsContainer);

    // Availability
    const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]');
    availabilityCheckboxes.forEach(checkbox => {
        checkbox.checked = userProfile.availability?.includes(checkbox.value) || false;
    });
}

// Render skills/interests as tags
function renderSkills(items, container) {
    container.innerHTML = '';
    
    items.forEach(item => {
        const itemName = item.skill_name || item.interest_name || item;
        const itemElement = document.createElement('div');
        itemElement.className = 'tag';
        itemElement.innerHTML = `
            ${itemName}
            <span class="tag-remove" data-item="${itemName}">&times;</span>
        `;
        container.appendChild(itemElement);
    });
    
    // Add remove event listeners
    container.querySelectorAll('.tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemToRemove = e.target.getAttribute('data-item');
            removeItem(itemToRemove, container === mentorSkillsContainer ? 'skills' : 'interests');
        });
    });
}

// Setup skill/interest handlers
function setupSkillHandlers() {
    // Mentor skills
    addMentorSkillBtn?.addEventListener('click', () => {
        const newSkill = newMentorSkillInput.value.trim();
        if (newSkill) {
            addItem(newSkill, 'skills');
            newMentorSkillInput.value = '';
        }
    });

    // Mentee interests
    addMenteeInterestBtn?.addEventListener('click', () => {
        const newInterest = newMenteeInterestInput.value.trim();
        if (newInterest) {
            addItem(newInterest, 'interests');
            newMenteeInterestInput.value = '';
        }
    });

    // Allow Enter key to add items
    newMentorSkillInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addMentorSkillBtn.click();
        }
    });

    newMenteeInterestInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addMenteeInterestBtn.click();
        }
    });
}

// Add new skill/interest
async function addItem(item, type) {
    if (!userProfile) return;

    try {
        // Update local state immediately for responsive UI
        if (type === 'skills') {
            if (!userProfile.skills.some(s => s.skill_name === item)) {
                userProfile.skills.push({ skill_name: item, skill_level: 'intermediate' });
                renderSkills(userProfile.skills, mentorSkillsContainer);
            }
        } else {
            if (!userProfile.interests.some(i => i.interest_name === item)) {
                userProfile.interests.push({ interest_name: item, proficiency_level: 'beginner' });
                renderSkills(userProfile.interests, menteeInterestsContainer);
            }
        }
    } catch (err) {
        console.error(`Failed to add ${type}:`, err);
        showError(`Failed to add ${item}. Please try again.`);
    }
}

// Remove skill/interest
async function removeItem(item, type) {
    if (!userProfile) return;

    try {
        // Update local state immediately for responsive UI
        if (type === 'skills') {
            userProfile.skills = userProfile.skills.filter(s => s.skill_name !== item);
            renderSkills(userProfile.skills, mentorSkillsContainer);
        } else {
            userProfile.interests = userProfile.interests.filter(i => i.interest_name !== item);
            renderSkills(userProfile.interests, menteeInterestsContainer);
        }
    } catch (err) {
        console.error(`Failed to remove ${type}:`, err);
        showError(`Failed to remove ${item}. Please try again.`);
    }
}

// Handle profile form submission
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    if (!userProfile) return;

    try {
        const userId = getCurrentUserId();
        const formData = {
            name: document.getElementById('profileName').value,
            title: document.getElementById('profileTitle').value,
            bio: document.getElementById('profileBio').value,
            role: document.getElementById('profileRole').value,
            meeting_frequency: document.getElementById('meetingFrequency').value,
            skills: userProfile.skills,
            interests: userProfile.interests,
            availability: Array.from(document.querySelectorAll('input[name="availability"]:checked')).map(cb => cb.value)
        };

        // Send to server
        await makeAuthenticatedRequest(`/api/profile/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        // Show success message
        showSuccess('Profile saved successfully!');
        
        // Update local profile data
        await loadProfileData();
    } catch (err) {
        console.error('Failed to save profile:', err);
        showError(err.message || 'Failed to save profile. Please try again.');
    }
}

// Helper function to show success message
function showSuccess(message) {
    profileSuccess.textContent = message;
    profileSuccess.style.display = 'block';
    profileSuccess.className = 'success-message';
    setTimeout(() => {
        profileSuccess.style.display = 'none';
    }, 3000);
}

// Helper function to show error message
function showError(message) {
    profileSuccess.textContent = message;
    profileSuccess.style.display = 'block';
    profileSuccess.className = 'error-message';
    setTimeout(() => {
        profileSuccess.style.display = 'none';
    }, 3000);
}