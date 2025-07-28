const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');

// Sample jewelry products
const sampleProducts = [
  {
    name: "Diamond Solitaire Engagement Ring",
    description: "A timeless classic featuring a brilliant round-cut diamond in a elegant solitaire setting. Perfect for proposals and engagements.",
    price: 2499.99,
    salePrice: 2249.99,
    category: "rings",
    subcategory: "engagement",
    material: {
      metal: "gold",
      purity: "14k",
      finish: "polished"
    },
    gemstones: [{
      type: "diamond",
      carat: 1.0,
      cut: "round",
      color: "H",
      clarity: "VS1",
      quantity: 1
    }],
    dimensions: {
      diameter: 6.5,
      weight: 3.2,
      unit: "mm"
    },
    sizes: [
      { size: "5", stock: 3 },
      { size: "6", stock: 5 },
      { size: "7", stock: 4 },
      { size: "8", stock: 2 }
    ],
    stock: 14,
    sku: "DR-SOL-001",
    tags: ["diamond", "engagement", "solitaire", "classic"],
    isCustomizable: true,
    customizationOptions: {
      engraving: { available: true, maxLength: 30, additionalCost: 50 },
      resizing: { available: true, additionalCost: 25 },
      metalOptions: ["14k-gold", "18k-gold", "platinum"],
      gemstoneOptions: ["diamond"]
    },
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=800&fit=crop",
        altText: "Diamond Solitaire Engagement Ring",
        isPrimary: true
      }
    ]
  },
  {
    name: "Pearl Drop Earrings",
    description: "Elegant cultured pearl drop earrings with sterling silver settings. Perfect for formal occasions or everyday elegance.",
    price: 299.99,
    category: "earrings",
    subcategory: "luxury",
    material: {
      metal: "silver",
      purity: "925",
      finish: "polished"
    },
    gemstones: [{
      type: "pearl",
      quantity: 2
    }],
    dimensions: {
      length: 25,
      width: 8,
      weight: 4.5,
      unit: "mm"
    },
    stock: 12,
    sku: "PE-DROP-002",
    tags: ["pearl", "earrings", "elegant", "silver"],
    isCustomizable: false,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop",
        altText: "Pearl Drop Earrings",
        isPrimary: true
      }
    ]
  },
  {
    name: "Rose Gold Tennis Bracelet",
    description: "Stunning tennis bracelet featuring brilliant-cut diamonds set in 18k rose gold. A perfect gift for special occasions.",
    price: 1899.99,
    salePrice: 1699.99,
    category: "bracelets",
    subcategory: "luxury",
    material: {
      metal: "gold",
      purity: "18k",
      finish: "polished"
    },
    gemstones: [{
      type: "diamond",
      carat: 0.05,
      cut: "round",
      clarity: "VS2",
      quantity: 40
    }],
    dimensions: {
      length: 180,
      width: 4,
      weight: 12.5,
      unit: "mm"
    },
    sizes: [
      { size: "6.5\"", stock: 2 },
      { size: "7\"", stock: 4 },
      { size: "7.5\"", stock: 3 }
    ],
    stock: 9,
    sku: "TB-ROSE-003",
    tags: ["tennis", "bracelet", "diamond", "rose-gold"],
    isCustomizable: true,
    customizationOptions: {
      engraving: { available: true, maxLength: 20, additionalCost: 75 },
      resizing: { available: true, additionalCost: 50 }
    },
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop",
        altText: "Rose Gold Tennis Bracelet",
        isPrimary: true
      }
    ]
  },
  {
    name: "Sapphire Pendant Necklace",
    description: "Beautiful blue sapphire pendant surrounded by diamonds on a delicate white gold chain.",
    price: 899.99,
    category: "necklaces",
    subcategory: "luxury",
    material: {
      metal: "gold",
      purity: "14k",
      finish: "polished"
    },
    gemstones: [
      {
        type: "sapphire",
        carat: 1.5,
        cut: "oval",
        color: "blue",
        quantity: 1
      },
      {
        type: "diamond",
        carat: 0.02,
        cut: "round",
        clarity: "VS1",
        quantity: 12
      }
    ],
    dimensions: {
      length: 450,
      width: 12,
      weight: 6.8,
      unit: "mm"
    },
    stock: 8,
    sku: "SP-PEND-004",
    tags: ["sapphire", "pendant", "necklace", "diamond", "blue"],
    isCustomizable: true,
    customizationOptions: {
      engraving: { available: true, maxLength: 25, additionalCost: 40 },
      metalOptions: ["14k-white-gold", "14k-yellow-gold", "18k-white-gold"]
    },
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop",
        altText: "Sapphire Pendant Necklace",
        isPrimary: true
      }
    ]
  },
  {
    name: "Men's Stainless Steel Watch",
    description: "Modern chronograph watch with stainless steel case and bracelet. Water resistant and perfect for everyday wear.",
    price: 449.99,
    salePrice: 379.99,
    category: "watches",
    subcategory: "modern",
    material: {
      metal: "stainless-steel",
      finish: "brushed"
    },
    dimensions: {
      diameter: 42,
      weight: 180,
      unit: "mm"
    },
    stock: 15,
    sku: "MW-CHRON-005",
    tags: ["watch", "chronograph", "stainless-steel", "men"],
    isCustomizable: true,
    customizationOptions: {
      engraving: { available: true, maxLength: 15, additionalCost: 30 }
    },
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
        altText: "Men's Stainless Steel Watch",
        isPrimary: true
      }
    ]
  },
  {
    name: "Vintage Style Ruby Ring",
    description: "Art deco inspired ruby ring with intricate milgrain detailing and diamond accents.",
    price: 1299.99,
    category: "rings",
    subcategory: "vintage",
    material: {
      metal: "gold",
      purity: "18k",
      finish: "polished"
    },
    gemstones: [
      {
        type: "ruby",
        carat: 2.0,
        cut: "cushion",
        color: "red",
        quantity: 1
      },
      {
        type: "diamond",
        carat: 0.03,
        cut: "round",
        clarity: "VS2",
        quantity: 8
      }
    ],
    sizes: [
      { size: "5", stock: 1 },
      { size: "6", stock: 2 },
      { size: "7", stock: 3 },
      { size: "8", stock: 1 }
    ],
    stock: 7,
    sku: "RR-VINT-006",
    tags: ["ruby", "vintage", "art-deco", "ring"],
    isCustomizable: true,
    customizationOptions: {
      engraving: { available: true, maxLength: 20, additionalCost: 60 },
      resizing: { available: true, additionalCost: 35 }
    },
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=800&fit=crop",
        altText: "Vintage Style Ruby Ring",
        isPrimary: true
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jewelry-store', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@jewelrystore.com',
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true
    });
    
    // Don't hash password again (pre-save middleware will be skipped)
    admin.password = adminPassword;
    await admin.save({ validateBeforeSave: false });
    console.log('Created admin user: admin@jewelrystore.com / admin123');

    // Create sample user
    const userPassword = await bcrypt.hash('user123', 12);
    const user = new User({
      name: 'John Doe',
      email: 'user@example.com',
      password: userPassword,
      isEmailVerified: true,
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      phone: '+1-555-123-4567'
    });
    
    user.password = userPassword;
    await user.save({ validateBeforeSave: false });
    console.log('Created sample user: user@example.com / user123');

    // Create products
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
      console.log(`Created product: ${product.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Admin user: admin@jewelrystore.com (password: admin123)`);
    console.log(`- Sample user: user@example.com (password: user123)`);
    console.log(`- Products created: ${sampleProducts.length}`);
    console.log('\n🚀 You can now start the server and begin testing!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
}

// Run the seeding function
seedDatabase();