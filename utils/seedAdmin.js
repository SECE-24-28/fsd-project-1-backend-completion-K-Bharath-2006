import User from '../models/User.js';

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      console.log('Seeding default admin user...');
      await User.create({
        name: 'Admin Director',
        email: 'admin@vertex.edu',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      });
      console.log('Default admin user seeded successfully.');
    } else {
      console.log('Admin user already exists. Seeding skipped.');
    }
  } catch (error) {
    console.error(`Error seeding admin user: ${error.message}`);
  }
};

export default seedAdmin;
