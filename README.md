# ✨ Sparkle Jewelry - E-commerce Website

A full-stack jewelry e-commerce website built with React, Node.js, Express, and MongoDB. Features include user authentication, shopping cart, payment processing with Stripe, admin panel, and AWS deployment ready.

## 🚀 Features

### Customer Features
- **User Authentication**: Register, login, password reset
- **Product Catalog**: Browse jewelry by categories (rings, necklaces, earrings, bracelets, watches)
- **Product Search & Filtering**: Advanced search with filters by price, material, category
- **Shopping Cart**: Add/remove items, quantity management, persistent cart
- **Wishlist**: Save favorite jewelry pieces
- **Secure Checkout**: Stripe payment integration
- **Order Management**: View order history, track orders, cancel orders
- **User Profile**: Update personal information, addresses
- **Product Reviews**: Rate and review purchased items
- **Responsive Design**: Mobile-first, fully responsive UI

### Admin Features
- **Admin Dashboard**: Sales analytics, user metrics, order overview
- **Product Management**: Add, edit, delete jewelry products with image uploads
- **Order Management**: View all orders, update order status, tracking
- **User Management**: View and manage customer accounts
- **Inventory Tracking**: Stock management with low-stock alerts
- **Sales Reports**: Revenue analytics and reporting

### Technical Features
- **Real-time Updates**: Live cart updates, inventory sync
- **SEO Optimized**: Meta tags, structured data, sitemap
- **Security**: JWT authentication, input validation, rate limiting
- **Performance**: Image optimization, lazy loading, caching
- **Scalable Architecture**: Microservices ready, cloud deployment
- **Payment Processing**: Secure Stripe integration
- **Email Notifications**: Order confirmations, shipping updates

## 🛠️ Technology Stack

### Frontend
- **React 18** with hooks and context
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for state management and caching
- **Axios** for API calls
- **Stripe Elements** for payment forms

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Stripe** for payment processing
- **Cloudinary** for image storage
- **Express Validator** for input validation
- **Helmet** for security headers
- **Rate Limiting** for API protection

### DevOps & Deployment
- **AWS EC2/ECS** for hosting
- **AWS S3** for file storage
- **AWS CloudFront** CDN
- **MongoDB Atlas** for database
- **PM2** for process management
- **Nginx** for reverse proxy
- **Let's Encrypt** for SSL certificates

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Stripe account
- Cloudinary account (for image uploads)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd jewelry-website
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration

#### Server Environment (.env)
Create `server/.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/jewelry-store
# For production: mongodb+srv://username:password@cluster.mongodb.net/jewelry-store

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Server
PORT=5000
NODE_ENV=development

# CORS
CLIENT_URL=http://localhost:3000
```

#### Client Environment (.env)
Create `client/.env` file:
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

### 4. Database Setup
```bash
# Start MongoDB locally (if using local MongoDB)
mongod

# Seed the database with sample data
cd server
npm run seed
```

This will create:
- Admin user: `admin@jewelrystore.com` / `admin123`
- Sample user: `user@example.com` / `user123`
- Sample jewelry products

### 5. Run the Application

#### Development Mode
```bash
# From root directory - runs both client and server
npm run dev

# Or run separately:
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client  
cd client
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 🚀 Deployment

### AWS Deployment

#### 1. Prepare for Production
```bash
# Build the client
cd client
npm run build

# Set production environment variables
# Update server/.env with production values
```

#### 2. Deploy to AWS EC2

##### Server Setup
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt update
sudo apt install nginx

# Clone your repository
git clone <your-repo-url>
cd jewelry-website
```

##### Application Setup
```bash
# Install dependencies
npm run install-deps

# Create production .env file
sudo nano server/.env
# Add your production environment variables

# Build the client
cd client
npm run build

# Start the server with PM2
cd ../server
pm2 start index.js --name "jewelry-api"

# Save PM2 configuration
pm2 save
pm2 startup
```

##### Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/jewelry-website
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Serve React app
    location / {
        root /path/to/jewelry-website/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/jewelry-website /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

##### SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Environment Variables for Production

Update your production environment variables:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jewelry-store
CLIENT_URL=https://your-domain.com
JWT_SECRET=your-super-secure-production-jwt-secret
```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Test Accounts
- **Admin**: admin@jewelrystore.com / admin123
- **User**: user@example.com / user123

### Test Payment Cards (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Use any future date for expiry and any 3-digit CVC

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Product Endpoints
- `GET /api/products` - Get products with filters/pagination
- `GET /api/products/:id` - Get single product
- `GET /api/products/featured` - Get featured products
- `POST /api/products/:id/reviews` - Add product review

### Cart Endpoints
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:itemId` - Update cart item
- `DELETE /api/cart/remove/:itemId` - Remove from cart

### Order Endpoints
- `POST /api/orders/create` - Create new order
- `POST /api/orders/:id/payment` - Process payment
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/products` - Manage products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `GET /api/admin/orders` - Manage orders
- `PUT /api/admin/orders/:id/status` - Update order status

## 🔧 Configuration

### Stripe Configuration
1. Create Stripe account at https://stripe.com
2. Get API keys from dashboard
3. Add webhook endpoint for order updates
4. Configure payment methods and currencies

### Cloudinary Configuration
1. Create account at https://cloudinary.com
2. Get cloud name, API key, and secret
3. Configure upload presets for jewelry images
4. Set up transformations for different image sizes

### MongoDB Configuration
For production, use MongoDB Atlas:
1. Create cluster at https://cloud.mongodb.com
2. Create database user
3. Configure network access
4. Get connection string

## 🎨 Customization

### Styling
- Modify `client/src/index.css` for global styles
- Update `client/tailwind.config.js` for theme colors
- Customize components in `client/src/components/`

### Branding
- Update logo and brand name in header component
- Modify color scheme in Tailwind config
- Update meta tags and SEO information

### Features
- Add new jewelry categories in product model
- Implement additional payment methods
- Add loyalty program functionality
- Integrate with jewelry certification APIs

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js security headers
- SQL injection prevention
- XSS protection

## 📊 Performance Optimizations

- Image lazy loading
- React Query caching
- MongoDB indexing
- Compression middleware
- CDN integration
- Code splitting
- Bundle optimization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@sparklejewelry.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] Mobile app with React Native
- [ ] Advanced analytics dashboard
- [ ] AI-powered jewelry recommendations
- [ ] Virtual try-on with AR
- [ ] Multi-language support
- [ ] Cryptocurrency payment options
- [ ] Subscription box service
- [ ] 3D jewelry visualization

---

**Built with ❤️ for jewelry lovers worldwide**
