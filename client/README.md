# BigBag - Social Commerce Platform

**Reach abroad, discover local** - A modern social commerce platform connecting users with local businesses through engaging video content.

## 🚀 Features

### 📱 Mobile App (React Native + Expo)
- **Video Rolls**: TikTok-style short videos showcasing products and services
- **Shop Discovery**: Browse local businesses by category and location
- **Coupons & Offers**: Exclusive deals and discount codes
- **Social Features**: Like, comment, save, and share content
- **Multi-role Support**: Users, Vendors, and Admins
- **Dark/Light Theme**: Customizable UI experience
- **Multi-language**: Support for multiple languages and regions

### 🛠 Backend API (Node.js + MongoDB)
- **RESTful API**: Comprehensive endpoints for all features
- **Authentication**: JWT-based secure authentication
- **File Upload**: Cloudinary integration for images and videos
- **Performance**: MongoDB indexes, caching, and pagination
- **Admin Panel**: Complete management system
- **Real-time**: WebSocket support for live features

## 🏗 Architecture

```
bigbagofficial/
├── client/          # React Native mobile app
│   ├── app/         # Expo Router pages
│   ├── components/  # Reusable UI components
│   ├── hooks/       # Custom React hooks
│   ├── services/    # API integration
│   └── styles/      # Theme and styling
└── api/             # Node.js backend
    ├── controllers/ # Route handlers
    ├── models/      # MongoDB schemas
    ├── middleware/  # Authentication & validation
    ├── routes/      # API endpoints
    └── utils/       # Helper functions
```

## 🛠 Tech Stack

### Frontend
- **React Native** with Expo SDK 51
- **Expo Router** for navigation
- **TypeScript** for type safety
- **Expo Video** for video playback
- **AsyncStorage** for local data
- **Expo SecureStore** for sensitive data

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for media storage
- **bcrypt** for password hashing
- **Multer** for file uploads

### DevOps
- **Fly.io** for API deployment
- **MongoDB Atlas** for database
- **Cloudinary** for CDN
- **Git** for version control

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Expo CLI
- Cloudinary account

### Backend Setup
```bash
cd api
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
cp .env.example .env
# Configure your API URL
npx expo start
```

### Environment Variables

**API (.env)**
```env
MONGO_URI=mongodb://localhost:27017/bigbag
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=5050
```

**Client (.env)**
```env
EXPO_PUBLIC_API_URL=http://localhost:5050
EXPO_PUBLIC_USE_API=true
EXPO_PUBLIC_API_TIMEOUT=120000
```

## 📊 Database Seeding

### Seed Sample Data
```bash
cd api
node seed-bigbag.js    # Creates shops, rolls, coupons, offers
node seed-admins.js    # Creates admin accounts
```

### Admin Credentials
- **Email**: admin@bigbag.com
- **Password**: admin123

## 🎯 User Roles

### 👤 Regular Users
- Browse and discover content
- Like, comment, save rolls
- Use coupons and offers
- Earn rolls through sharing

### 🏪 Vendors
- Create and manage shops
- Upload product rolls
- Create coupons and offers
- Purchase roll packages

### 👑 Admins
- Full platform management
- Create shops for big companies
- Manage all content
- User and vendor oversight

## 📱 Key Features

### Video Rolls
- **TikTok-style interface** with vertical scrolling
- **Auto-play** with smooth transitions
- **Engagement metrics** (likes, comments, saves, shares)
- **Category filtering** (fashion, food, tech, etc.)
- **Real video URLs** for testing

### Shop Management
- **Multi-vendor support** with approval system
- **Rich shop profiles** with logos and descriptions
- **Location-based discovery**
- **Rating and review system**

### Commerce Features
- **Dynamic coupons** with expiry dates
- **Limited-time offers** with countdown timers
- **Automatic code copying** for seamless shopping
- **Direct shop navigation**

### Performance Optimizations
- **MongoDB indexes** for fast queries
- **LRU caching** with 30-60s TTL
- **Pagination** for large datasets
- **Atomic operations** for concurrent updates
- **Image optimization** via Cloudinary

## 🔒 Security Features

- **JWT authentication** with secure token storage
- **Role-based access control** (RBAC)
- **Input validation** and sanitization
- **Password hashing** with bcrypt
- **API rate limiting**
- **CORS protection**

## 📈 Performance Metrics

### Load Testing Results (k6)
- **Feed endpoint**: 26s → <1s (7x improvement)
- **Browse endpoint**: 1.92s → 1.15s (40% improvement)
- **Likes system**: 83% → 100% success rate
- **Comments**: 100% success rate, 2.4s avg response

### Optimizations Applied
- **Database indexes** on critical fields
- **Cursor-based pagination** for infinite scroll
- **Lean queries** to reduce memory usage
- **Atomic operations** to prevent race conditions
- **Strategic caching** for frequently accessed data

## 🎨 UI/UX Features

### Theme System
- **Dark/Light mode** toggle
- **Consistent color palette**
- **Responsive design**
- **Smooth animations**

### Navigation
- **Tab-based navigation** with 5 main sections
- **Stack navigation** for detailed views
- **Deep linking** support
- **Gesture-friendly** interactions

## 🔧 Development Tools

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Git hooks** for pre-commit checks

### Testing
- **k6** for load testing
- **Postman** collections for API testing
- **Manual testing** protocols
- **Performance monitoring**

## 📦 Deployment

### API Deployment (Fly.io)
```bash
cd api
fly deploy
```

### Mobile App
```bash
cd client
eas build --platform all
eas submit --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Email**: support@bigbag.com
- **Issues**: GitHub Issues
- **Documentation**: Wiki pages

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core video platform
- ✅ Shop management
- ✅ Commerce features
- ✅ Performance optimization

### Phase 2 (Upcoming)
- 🔄 Real-time chat
- 🔄 Push notifications
- 🔄 Advanced analytics
- 🔄 AI recommendations

### Phase 3 (Future)
- 📋 Live streaming
- 📋 AR try-on features
- 📋 Marketplace expansion
- 📋 International scaling

---

**Built with ❤️ by Osama**

