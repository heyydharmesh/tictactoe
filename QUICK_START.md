# 🚀 Quick Start Guide

Get your Elegant Jewelry E-Commerce website up and running in minutes!

## Prerequisites

- Node.js 16+ installed
- MongoDB (local or Atlas)
- Git

## 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/jewelry-ecommerce.git
cd jewelry-ecommerce

# Install dependencies
npm install
cd client && npm install && cd ..
```

## 2. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit with your settings
nano .env
```

**Required Environment Variables:**
```env
MONGODB_URI=mongodb://localhost:27017/jewelry-store
JWT_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## 3. Start Development Server

```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

## 4. Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:3000/admin (after creating admin user)

## 5. Create Admin User

```bash
# Using MongoDB shell
mongosh
use jewelry-store
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$hashedpassword", // Use bcrypt to hash
  role: "admin"
})
```

## 6. Add Sample Products

Visit the admin panel at `/admin` and add some sample jewelry products:

### Sample Product Data:
```json
{
  "name": "Diamond Engagement Ring",
  "description": "Beautiful 14k white gold engagement ring with 1 carat diamond",
  "price": 2500,
  "category": "rings",
  "material": "white-gold",
  "stock": 10,
  "images": ["https://example.com/ring1.jpg"],
  "mainImage": "https://example.com/ring1.jpg"
}
```

## 7. Test Features

### Customer Features:
- ✅ Browse products at `/shop`
- ✅ Register/Login at `/register` and `/login`
- ✅ Add items to cart
- ✅ Complete checkout process
- ✅ View order history

### Admin Features:
- ✅ Access admin dashboard at `/admin`
- ✅ Add/edit products
- ✅ Manage orders
- ✅ View analytics

## 8. Production Deployment

### Option A: Docker (Recommended)
```bash
# Build and run with Docker
docker-compose up -d
```

### Option B: AWS EC2
```bash
# Run deployment script
./deploy.sh
```

### Option C: Manual Deployment
```bash
# Build for production
cd client && npm run build && cd ..

# Start production server
NODE_ENV=production npm start
```

## 9. Customization

### Branding
- Update logo in `client/src/components/layout/Header.js`
- Change colors in `client/src/index.css` (CSS variables)
- Modify company info in `client/src/components/layout/Footer.js`

### Products
- Add your jewelry categories in `server/models/Product.js`
- Customize product fields as needed
- Update image upload settings

### Payment
- Configure Stripe webhooks
- Set up production Stripe keys
- Test payment flow thoroughly

## 10. Security Checklist

- [ ] Change default JWT secret
- [ ] Set up HTTPS in production
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up monitoring

## 11. Performance Optimization

- [ ] Enable image compression
- [ ] Set up CDN for images
- [ ] Configure caching headers
- [ ] Optimize database queries
- [ ] Enable gzip compression

## 12. Monitoring

### Health Check
```bash
curl http://localhost:5000/health
```

### PM2 Monitoring (Production)
```bash
pm2 status
pm2 logs jewelry-ecommerce
```

## Troubleshooting

### Common Issues:

**1. MongoDB Connection Error**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

**2. Port Already in Use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

**3. Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
cd client && rm -rf node_modules package-lock.json && npm install
```

**4. Environment Variables**
```bash
# Check if .env file exists
ls -la .env

# Verify variables are loaded
node -e "console.log(process.env.MONGODB_URI)"
```

## Support

- 📧 Email: support@elegantjewelry.com
- 📖 Documentation: [Full README](README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/jewelry-ecommerce/issues)

## Next Steps

1. **Customize Design**: Update colors, fonts, and branding
2. **Add Products**: Upload your jewelry inventory
3. **Configure Payments**: Set up Stripe for production
4. **Deploy**: Choose your hosting platform
5. **Monitor**: Set up analytics and monitoring
6. **Scale**: Optimize for high traffic

---

**🎉 Congratulations! Your jewelry e-commerce website is ready to go live!**