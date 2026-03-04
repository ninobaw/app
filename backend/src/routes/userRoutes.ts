import { Router } from 'express';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid'; // For generating UUIDs for _id

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const { email, firstName, lastName, role, airport, phone, department, password } = req.body;

  if (!email || !firstName || !lastName || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const newUser = new User({
      _id: uuidv4(), // Generate a UUID for MongoDB _id
      email,
      firstName,
      lastName,
      role,
      airport,
      phone,
      department,
      isActive: true, // Default to active
      // In a real app, password would be hashed before saving
    });

    await newUser.save();
    
    // Exclude password from response
    const { password: _, ...userResponse } = newUser.toObject();
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;