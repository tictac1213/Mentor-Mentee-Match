import express from 'express'

import db from '../config/db.js'
import authenticate from '../middlewares/authenticate.js'

const router = express.Router();

// Get profile
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [req.params.userId]);
    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    
    // Get skills and interests
    const [skills] = await db.query('SELECT * FROM skills WHERE user_id = ?', [user.user_id]);
    const [interests] = await db.query('SELECT * FROM interests WHERE user_id = ?', [user.user_id]);
    const [availability] = await db.query('SELECT * FROM user_availability WHERE user_id = ?', [user.user_id]);

    res.json({
      ...user,
      skills,
      interests,
      availability: availability.map(a => a.availability)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const { name, title, bio, role, skills, interests, availability } = req.body;

    // Update basic info
    await db.query(
      'UPDATE users SET name = ?, title = ?, bio = ?, role = ?, profile_complete = TRUE WHERE user_id = ?',
      [name, title, bio, role, req.params.userId]
    );

    // Update skills (delete old ones first)
    await db.query('DELETE FROM skills WHERE user_id = ?', [req.params.userId]);
    if (skills && skills.length) {
      const skillValues = skills.map(skill => [req.params.userId, skill.skill_name, skill.skill_level]);
      await db.query(
        'INSERT INTO skills (user_id, skill_name, skill_level) VALUES ?',
        [skillValues]
      );
    }

    // Update interests
    await db.query('DELETE FROM interests WHERE user_id = ?', [req.params.userId]);
    if (interests && interests.length) {
      const interestValues = interests.map(interest => [req.params.userId, interest.interest_name, interest.proficiency_level]);
      await db.query(
        'INSERT INTO interests (user_id, interest_name, proficiency_level) VALUES ?',
        [interestValues]
      );
    }

    // Update availability
    await db.query('DELETE FROM user_availability WHERE user_id = ?', [req.params.userId]);
    if (availability && availability.length) {
      const availabilityValues = availability.map(avail => [req.params.userId, avail]);
      await db.query(
        'INSERT INTO user_availability (user_id, availability) VALUES ?',
        [availabilityValues]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router