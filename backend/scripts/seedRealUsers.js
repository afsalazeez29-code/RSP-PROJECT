require('dotenv').config();

const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const User = require('../models/Users');

const users = [
  {
    _id: '665000000000000000000001',
    name: 'Noufa S Sajna',
    email: 'noufassajna@gmail.com',
    password: 'noufa@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717975/noufa_sjivsn.jpg',
    profileImagePublicId: 'noufa_sjivsn',
    bio: 'I am Foodie Noufa.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'Indian Cuisine',
    isPrivate: false,
    location: 'Jaipur — Rajasthan',
    username: 'noufassajna'
  },
  {
    _id: '665000000000000000000002',
    name: 'Jerin Moni Thomas',
    email: 'jerinmonithomas@gmail.com',
    password: 'jerin@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717972/jerin_ael4ym.jpg',
    profileImagePublicId: 'jerin_ael4ym',
    bio: 'I am Foodie Jerin.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'Arabic Cuisine',
    isPrivate: false,
    location: 'Mysuru — Karnataka',
    username: 'jerinmonithomas'
  },
  {
    _id: '665000000000000000000003',
    name: 'Shinu S Lulu',
    email: 'shinuslulu@gmail.com',
    password: 'shinu@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717978/shinu_a45zpa.jpg',
    profileImagePublicId: 'shinu_a45zpa',
    bio: 'I am Foodie Shinu.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'American Cuisine',
    isPrivate: false,
    location: 'Shillong — Meghalaya',
    username: 'shinuslulu'
  },
  {
    _id: '665000000000000000000004',
    name: 'Devika Devakumar',
    email: 'devikadevakumar@gmail.com',
    password: 'devika@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717967/devika_gvuaxi.jpg',
    profileImagePublicId: 'devika_gvuaxi',
    bio: 'I am Foodie Devika.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'Chinese Cuisine',
    isPrivate: false,
    location: 'Varanasi — Uttar Pradesh',
    username: 'devikadevakumar'
  },
  {
    _id: '665000000000000000000005',
    name: 'Anandha Pavanan',
    email: 'anandhapavanan@gmail.com',
    password: 'anandha@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717964/ananda_wrgdkt.jpg',
    profileImagePublicId: 'ananda_wrgdkt',
    bio: 'I am Foodie Anandha.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'Thai Cuisine',
    isPrivate: false,
    location: 'Puducherry — Puducherry',
    username: 'anandhapavanan'
  },
  {
    _id: '665000000000000000000006',
    name: 'Gopika Gopakumar',
    email: 'gopikagopakumar@gmail.com',
    password: 'gopika@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717970/gopika_q0ahpc.jpg',
    profileImagePublicId: 'gopika_q0ahpc',
    bio: 'I am Foodie Gopika.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'Japanese Cuisine',
    isPrivate: false,
    location: 'Udaipur — Rajasthan',
    username: 'gopikagopakumar'
  },
  {
    _id: '665000000000000000000007',
    name: 'Ijas Faizy',
    email: 'ijasfaizy@gmail.com',
    password: 'ijas@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717971/ijas_rqf5dl.jpg',
    profileImagePublicId: 'ijas_rqf5dl',
    bio: 'I am Foodie Ijas.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'Indian Cuisine',
    isPrivate: false,
    location: 'Visakhapatnam — Andhra Pradesh',
    username: 'ijasfaizy'
  },
  {
    _id: '665000000000000000000008',
    name: 'Ashik A S',
    email: 'ashikas@gmail.com',
    password: 'ashik@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717966/ashik_ql4m7w.jpg',
    profileImagePublicId: 'ashik_ql4m7w',
    bio: 'I am Foodie Ashik.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'Arabic Cuisine',
    isPrivate: false,
    location: 'Madurai — Tamil Nadu',
    username: 'ashikas'
  },
  {
    _id: '665000000000000000000009',
    name: 'Nabeel N S',
    email: 'nabeelns@gmail.com',
    password: 'nabeel@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717974/nabeel_fstt8n.jpg',
    profileImagePublicId: 'nabeel_fstt8n',
    bio: 'I am Foodie Nabeel.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'American Cuisine',
    isPrivate: false,
    location: 'Bhopal — Madhya Pradesh',
    username: 'nabeelns'
  },
  {
    _id: '665000000000000000000010',
    name: 'Eren Yeager',
    email: 'erenyeager@gmail.com',
    password: 'eren@123',
    profileImage: 'https://res.cloudinary.com/dgovvdud9/image/upload/v1781717968/eren_spy4vx.jpg',
    profileImagePublicId: 'eren_spy4vx',
    bio: 'I am Foodie Eren.',
    isBlocked: false,
    likedRecipes: [],
    favoriteCuisine: 'Chinese Cuisine',
    isPrivate: false,
    location: 'Panaji — Goa',
    username: 'erenyeager'
  }
];

const seedUsers = async () => {
  await connectDatabase();

  for (const seedUser of users) {
    const existingDuplicate = await User.findOne({
      email: seedUser.email,
      _id: { $ne: new mongoose.Types.ObjectId(seedUser._id) }
    });

    if (existingDuplicate) {
      throw new Error(`Email ${seedUser.email} already exists with a different _id (${existingDuplicate._id}). Remove that user before seeding.`);
    }

    let user = await User.findById(seedUser._id);

    if (!user) {
      user = new User({ _id: seedUser._id });
    }

    Object.assign(user, seedUser);
    await user.save();
    console.log(`Seeded user: ${user.email}`);
  }
};

seedUsers()
  .then(async () => {
    console.log(`Seeded ${users.length} real users successfully.`);
    await disconnectDatabase();
  })
  .catch(async (error) => {
    console.error('Real user seed failed:', error.message);
    await disconnectDatabase();
    process.exitCode = 1;
  });
