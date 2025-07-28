# Elegant Jewelry E-Commerce Website

A modern, full-stack jewelry e-commerce platform built with React, Node.js, and MongoDB. Features user authentication, shopping cart functionality, admin panel, and secure payment processing.

## 🚀 Features

### Customer Features
- **User Authentication**: Secure login/register with JWT tokens
- **Product Browsing**: Browse jewelry by category, material, price range
- **Advanced Search**: Search products by name, description, or tags
- **Shopping Cart**: Add, remove, and update cart items
- **Secure Checkout**: Stripe payment integration
- **Order Management**: View order history and track orders
- **Product Reviews**: Rate and review products
- **Wishlist**: Save favorite items
- **Responsive Design**: Mobile-first design approach

### Admin Features
- **Dashboard**: Analytics and overview of sales, orders, users
- **Product Management**: Add, edit, delete products with image upload
- **Order Management**: Update order status, track shipments
- **User Management**: View and manage customer accounts
- **Inventory Management**: Track stock levels
- **Custom Jewelry**: Handle custom jewelry requests

### Technical Features
- **RESTful API**: Well-structured backend API
- **Real-time Updates**: Live cart and order updates
- **Image Optimization**: Cloudinary integration for image management
- **Security**: JWT authentication, input validation, rate limiting
- **Performance**: Optimized queries, caching, compression
- **SEO Friendly**: Meta tags, structured data

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **React Query**: Server state management
- **Axios**: HTTP client
- **React Hook Form**: Form handling
- **Framer Motion**: Animations
- **React Icons**: Icon library
- **Stripe**: Payment processing

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM
- **JWT**: Authentication
- **bcryptjs**: Password hashing
- **Multer**: File uploads
- **Cloudinary**: Image storage
- **Stripe**: Payment processing

### DevOps
- **Docker**: Containerization
- **AWS**: Cloud hosting
- **MongoDB Atlas**: Cloud database
- **Cloudinary**: Image CDN

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/jewelry-ecommerce.git
cd jewelry-ecommerce
```

### 2. Install dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Setup
```bash
# Copy environment variables
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

### 4. Database Setup
```bash
# Start MongoDB (if local)
mongod

# Or use MongoDB Atlas (recommended for production)
```

### 5. Start Development Server
```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/jewelry-store

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Third-party Services Setup

#### 1. Stripe
1. Create a Stripe account
2. Get your API keys from the dashboard
3. Add keys to `.env` file

#### 2. Cloudinary
1. Create a Cloudinary account
2. Get your cloud name, API key, and secret
3. Add credentials to `.env` file

#### 3. MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Replace `MONGODB_URI` in `.env`

## 🚀 Deployment

### AWS Deployment

#### 1. Prepare for Production
```bash
# Build the React app
cd client
npm run build
cd ..

# Set NODE_ENV to production
export NODE_ENV=production
```

#### 2. AWS EC2 Setup
```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js and MongoDB
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone your repository
git clone https://github.com/yourusername/jewelry-ecommerce.git
cd jewelry-ecommerce

# Install dependencies
npm install
cd client && npm install && npm run build && cd ..

# Start the application
pm2 start server/index.js --name "jewelry-ecommerce"
pm2 startup
pm2 save
```

#### 3. Domain Configuration
1. Point your domain to your EC2 instance
2. Configure SSL with Let's Encrypt
3. Set up reverse proxy with Nginx

#### 4. Environment Variables
Set production environment variables on your server:
```bash
export NODE_ENV=production
export MONGODB_URI=your_atlas_connection_string
export JWT_SECRET=your_production_jwt_secret
export STRIPE_SECRET_KEY=sk_live_your_stripe_key
export CLOUDINARY_CLOUD_NAME=your_cloudinary_name
export CLOUDINARY_API_KEY=your_cloudinary_key
export CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Docker Deployment

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN cd client && npm install && npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### 2. Build and Run
```bash
docker build -t jewelry-ecommerce .
docker run -p 5000:5000 jewelry-ecommerce
```

## 📁 Project Structure

```
jewelry-ecommerce/
├── server/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── index.js         # Server entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Utility functions
│   └── public/          # Static files
├── .env.example         # Environment variables template
└── README.md           # This file
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet.js security headers
- SQL injection prevention
- XSS protection

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client
npm test
```

## 📈 Performance Optimization

- Image optimization with Cloudinary
- Lazy loading for images
- Code splitting
- Compression middleware
- Database indexing
- Caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/jewelry-ecommerce/issues) page
2. Create a new issue with detailed information
3. Contact support at support@elegantjewelry.com

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend
- MongoDB for the flexible database
- Stripe for secure payment processing
- Cloudinary for image management
- All contributors and supporters

---

**Made with ❤️ for the jewelry industry**
