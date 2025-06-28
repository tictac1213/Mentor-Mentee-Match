document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }

    try {
        const userId = getCurrentUserId();
        console.log(userId);
        const userProfile = await makeAuthenticatedRequest(`/api/profile/${userId}`);
        
        // Display welcome message
        document.getElementById('userName').textContent = userProfile.name || 'User';
        document.getElementById('userRole').textContent = `${userProfile.role || 'Not specified'}`;
        
        // Show profile completion as encouragement (no redirect)
        const completion = calculateProfileCompletion(userProfile);
        document.getElementById('profileCompletion').textContent = `Profile ${completion}% complete`;
        
        if (completion < 50) {
            // Add visual highlight but don't redirect
            document.querySelector('.card a[href="profile.html"]')
                .classList.add('highlight-incomplete');
        }
        
        // Load other dashboard data...
    } catch (err) {
        console.error('Dashboard error:', err);
        // NO REDIRECT TO PROFILE PAGE
    }
});

function calculateProfileCompletion(profile) {
    let completion = 0;
    if (profile.name) completion += 20;
    if (profile.role) completion += 15;
    if (profile.title) completion += 15;
    if (profile.bio) completion += 10;
    if (profile.skills?.length) completion += 20;
    if (profile.interests?.length) completion += 20;
    return Math.min(100, completion);
}