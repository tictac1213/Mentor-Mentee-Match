document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }
    
    if (window.location.pathname.includes('connections.html')) {
        try {
            setupTabHandlers();
            await loadConnections();
        } catch (err) {
            console.error('Connections initialization error:', err);
            showError('Failed to load connections. Please try again.');
        }
    }
});

// Setup tab handlers
function setupTabHandlers() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId + 'Connections').classList.add('active');
        });
    });
}

// Load connections from server
async function loadConnections() {
    try {
        const data = await makeAuthenticatedRequest('/api/connections');
        
        // Active Connections
        renderConnectionList('activeConnectionsList', data.connections, 'connection');
        
        // Received Requests
        renderConnectionList('requestsList', data.receivedRequests, 'request');
        
        // Sent Requests
        renderConnectionList('sentRequestsList', data.sentRequests, 'sentRequest');
        
        // Add event listeners to all action buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', handleConnectionAction);
        });
    } catch (err) {
        console.error('Failed to load connections:', err);
        showError('Failed to load connections. Please try again.');
    }
}

// Render a connection list
function renderConnectionList(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = items.length ? '' : `<p>No ${type.replace(/([A-Z])/g, ' $1').toLowerCase()} found.</p>`;
    
    items.forEach(item => {
        const connectionItem = document.createElement('div');
        connectionItem.className = 'connection-item';
        
        if (type === 'connection') {
            connectionItem.innerHTML = `
                <div class="connection-info">
                    <div class="connection-avatar">${item.name.charAt(0)}</div>
                    <div class="connection-details">
                        <h3>${item.name}</h3>
                        <p>${formatRole(item.role)}</p>
                        <p><small>Connected since ${new Date(item.connected_since).toLocaleDateString()}</small></p>
                    </div>
                </div>
                <div class="connection-actions">
                    <button class="btn btn-secondary">Message</button>
                    <button class="btn btn-secondary" data-user-id="${item.user_id}" data-action="disconnect">Disconnect</button>
                </div>
            `;
        } 
        else if (type === 'request') {
            connectionItem.innerHTML = `
                <div class="connection-info">
                    <div class="connection-avatar">${item.name.charAt(0)}</div>
                    <div class="connection-details">
                        <h3>${item.name}</h3>
                        <p>${formatRole(item.role)}</p>
                        <p><small>Requested on ${new Date(item.created_at).toLocaleDateString()}</small></p>
                    </div>
                </div>
                <div class="connection-actions">
                    <button class="btn btn-primary" data-request-id="${item.request_id}" data-action="accept">Accept</button>
                    <button class="btn btn-secondary" data-request-id="${item.request_id}" data-action="decline">Decline</button>
                </div>
            `;
        }
        else if (type === 'sentRequest') {
            connectionItem.innerHTML = `
                <div class="connection-info">
                    <div class="connection-avatar">${item.name.charAt(0)}</div>
                    <div class="connection-details">
                        <h3>${item.name}</h3>
                        <p>${formatRole(item.role)}</p>
                        <p><small>Sent on ${new Date(item.created_at).toLocaleDateString()}</small></p>
                    </div>
                </div>
                <div class="connection-actions">
                    <button class="btn btn-secondary" data-request-id="${item.request_id}" data-action="cancel">Cancel</button>
                </div>
            `;
        }
        
        container.appendChild(connectionItem);
    });
}

// Handle connection actions
async function handleConnectionAction(e) {
    const action = e.target.getAttribute('data-action');
    const requestId = e.target.getAttribute('data-request-id');
    const userId = e.target.getAttribute('data-user-id');
    
    try {
        if (action === 'accept') {
            await makeAuthenticatedRequest(`/api/connections/accept/${requestId}`, {
                method: 'POST'
            });
        } 
        else if (action === 'decline') {
            await makeAuthenticatedRequest(`/api/connections/decline/${requestId}`, {
                method: 'POST'
            });
        } 
        else if (action === 'cancel') {
            await makeAuthenticatedRequest(`/api/connections/cancel/${requestId}`, {
                method: 'POST'
            });
        } 
        else if (action === 'disconnect') {
            await makeAuthenticatedRequest(`/api/connections/disconnect/${userId}`, {
                method: 'POST'
            });
        }
        
        // Refresh the connections list after any action
        await loadConnections();
    } catch (err) {
        console.error(`Failed to ${action} connection:`, err);
        showError(`Failed to ${action} connection. Please try again.`);
    }
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