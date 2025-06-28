document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }
    
    if (window.location.pathname.includes('discover.html')) {
        try {
            await loadDiscoveryResults();
            setupFilterHandlers();
        } catch (err) {
            console.error('Discover initialization error:', err);
            showError('Failed to load discover results. Please try again.');
        }
    }
});

// Load discovery results from server
async function loadDiscoveryResults(filters = {}) {
    const discoveryResults = document.getElementById('discoveryResults');
    if (!discoveryResults) return;

    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.role) queryParams.append('role', filters.role);
        if (filters.skills) queryParams.append('skills', filters.skills);
        if (filters.availability) queryParams.append('availability', filters.availability);

        // Get discoverable users
        const users = await makeAuthenticatedRequest(`/api/discover?${queryParams.toString()}`);
        
        // Display results
        discoveryResults.innerHTML = '';
        
        if (users.length === 0) {
            discoveryResults.innerHTML = '<p>No users found matching your criteria.</p>';
            return;
        }
        
        // Load connection status for each user
        for (const user of users) {
            const connectionStatus = await getConnectionStatus(user.user_id);
            renderUserCard(user, connectionStatus, discoveryResults);
        }
    } catch (err) {
        console.error('Failed to load discovery results:', err);
        discoveryResults.innerHTML = '<p>Error loading results. Please try again.</p>';
    }
}

// Get connection status for a user
async function getConnectionStatus(targetUserId) {
    try {
        const response = await makeAuthenticatedRequest(`/api/discover/connection-status/${targetUserId}`);
        return response.status;
    } catch (err) {
        console.error('Failed to get connection status:', err);
        return 'none';
    }
}

// Render user card
function renderUserCard(user, connectionStatus, container) {
    const userCard = document.createElement('div');
    userCard.className = 'profile-card';
    
    userCard.innerHTML = `
        <div class="profile-card-header">
            <h3 class="profile-card-name">${user.name}</h3>
            <p class="profile-card-role">${formatRole(user.role)}</p>
        </div>
        <div class="profile-card-body">
            ${user.title ? `<p><strong>${user.title}</strong></p>` : ''}
            ${user.bio ? `<p class="profile-card-bio">${user.bio}</p>` : ''}
            
            ${user.skills?.length ? `
            <div>
                <p><strong>Skills:</strong></p>
                <div class="profile-card-skills">
                    ${user.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            
            ${user.interests?.length ? `
            <div>
                <p><strong>Interests:</strong></p>
                <div class="profile-card-skills">
                    ${user.interests.map(interest => `<span class="skill-tag">${interest}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="profile-card-actions">
                ${connectionStatus === 'connected' ? `
                    <button class="btn btn-secondary" disabled>Connected</button>
                ` : connectionStatus === 'requested' ? `
                    <button class="btn btn-secondary" disabled>Request Sent</button>
                ` : connectionStatus === 'pending' ? `
                    <button class="btn btn-primary" data-user-id="${user.user_id}" data-action="accept">Accept</button>
                    <button class="btn btn-secondary" data-user-id="${user.user_id}" data-action="decline">Decline</button>
                ` : `
                    <button class="btn btn-primary" data-user-id="${user.user_id}" data-action="connect">Connect</button>
                `}
            </div>
        </div>
    `;
    
    container.appendChild(userCard);
    
    // Add event listeners to buttons
    userCard.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            const action = e.target.getAttribute('data-action');
            
            if (action === 'connect') {
                sendConnectionRequest(userId);
            } else if (action === 'accept') {
                acceptConnectionRequest(userId);
            } else if (action === 'decline') {
                declineConnectionRequest(userId);
            }
        });
    });
}

// Setup filter handlers
function setupFilterHandlers() {
    document.getElementById('applyFilters')?.addEventListener('click', () => {
        const filters = {
            role: document.getElementById('filterRole').value,
            skills: document.getElementById('filterSkills').value,
            availability: document.getElementById('filterAvailability').value
        };
        
        loadDiscoveryResults(filters);
    });
    
    document.getElementById('resetFilters')?.addEventListener('click', () => {
        document.getElementById('filterRole').value = 'all';
        document.getElementById('filterSkills').value = '';
        document.getElementById('filterAvailability').value = 'any';
        loadDiscoveryResults({});
    });
}

// Format role for display
function formatRole(role) {
    switch (role) {
        case 'mentor': return 'Mentor';
        case 'mentee': return 'Mentee';
        case 'both': return 'Mentor & Mentee';
        default: return '';
    }
}

// Send connection request
async function sendConnectionRequest(targetUserId) {
    try {
        await makeAuthenticatedRequest(`/api/discover/connection-request/${targetUserId}`, {
            method: 'POST'
        });
        
        // Refresh results
        await loadDiscoveryResults();
    } catch (err) {
        console.error('Failed to send connection request:', err);
        showError(err.message || 'Failed to send request. Please try again.');
    }
}

// Accept connection request
async function acceptConnectionRequest(targetUserId) {
    try {
        await makeAuthenticatedRequest(`/api/discover/accept-request/${targetUserId}`, {
            method: 'POST'
        });
        
        // Refresh results
        await loadDiscoveryResults();
    } catch (err) {
        console.error('Failed to accept connection request:', err);
        showError('Failed to accept request. Please try again.');
    }
}

// Decline connection request
async function declineConnectionRequest(targetUserId) {
    try {
        await makeAuthenticatedRequest(`/api/discover/decline-request/${targetUserId}`, {
            method: 'POST'
        });
        
        // Refresh results
        await loadDiscoveryResults();
    } catch (err) {
        console.error('Failed to decline connection request:', err);
        showError('Failed to decline request. Please try again.');
    }
}

// Show error message
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    const container = document.querySelector('.container main');
    if (container) {
        container.insertBefore(errorElement, container.firstChild);
        
        setTimeout(() => {
            errorElement.remove();
        }, 3000);
    }
}