# Real Estate CRM Dashboard

A comprehensive Customer Relationship Management (CRM) dashboard for real estate businesses, built with React and Material-UI. The system features intelligent device detection to provide optimal user experiences across different platforms.

## 🚀 Features

### Core CRM Functionality
- **Dashboard Overview**: Real-time statistics and analytics
- **Property Management**: Complete CRUD operations for property listings
- **User Management**: Customer and admin user management
- **Enquiry Management**: Handle customer inquiries and responses
- **Analytics**: Comprehensive business insights and reporting
- **Settings**: System configuration and user preferences

### Smart Device Routing
- **Automatic Detection**: Identifies mobile vs desktop devices
- **Responsive Design**: Optimized interfaces for each device type
- **Admin Override**: Force desktop interface with `?admin=true`
- **Seamless Experience**: Smooth transitions between interfaces

### Security Features
- **JWT Authentication**: Secure login system
- **Role-based Access**: Admin-only access to CRM features
- **Protected Routes**: Authenticated route protection
- **Security Headers**: Comprehensive security configuration

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and context
- **Material-UI v5**: Comprehensive component library
- **React Router v6**: Client-side routing
- **Recharts**: Data visualization and charts
- **Axios**: HTTP client for API calls
- **Formik & Yup**: Form handling and validation

### Backend Integration
- **RESTful API**: Integration with Node.js/Express backend
- **MySQL Database**: Relational data storage
- **JWT Tokens**: Secure authentication
- **File Uploads**: Image and document handling

## 📱 Device Support

### Desktop Interface (CRM Dashboard)
- **Optimized for**: Laptops, desktops, large screens
- **Features**: Full CRM functionality, data tables, analytics
- **Screen Size**: 1024px and above
- **Navigation**: Sidebar navigation with collapsible menu

### Mobile Interface (Redirect)
- **Optimized for**: Smartphones, small tablets
- **Features**: Redirect to mobile-optimized interface
- **Screen Size**: Below 768px
- **Override**: Available with `?admin=true` parameter

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager
- Backend API running (see backend documentation)

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd admin-crm-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit environment variables
   nano .env
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Development: `http://localhost:3000`
   - Production: `https://mobileapplication.creativeethics.co.in`

### Environment Configuration

Create `.env` file with the following variables:

```env
REACT_APP_API_BASE_URL=https://mobileapplication.creativeethics.co.in/backend/api
REACT_APP_SERVER_BASE_URL=https://mobileapplication.creativeethics.co.in/backend
REACT_APP_IMAGE_BASE_URL=https://mobileapplication.creativeethics.co.in/backend
GENERATE_SOURCEMAP=false
```

## 📁 Project Structure

```
admin-crm-dashboard/
├── public/                 # Static assets
│   ├── index.html         # HTML template
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/        # Common components
│   │   ├── layout/        # Layout components
│   │   └── routing/       # Routing components
│   ├── contexts/          # React contexts
│   │   └── AuthContext.js # Authentication context
│   ├── pages/             # Page components
│   │   ├── Dashboard.js   # Main dashboard
│   │   ├── Properties.js  # Property management
│   │   ├── Users.js       # User management
│   │   ├── Enquiries.js   # Enquiry management
│   │   ├── Analytics.js   # Analytics dashboard
│   │   └── Settings.js    # Settings page
│   ├── services/          # API services
│   │   └── api.js         # API client configuration
│   ├── utils/             # Utility functions
│   │   └── deviceDetection.js # Device detection logic
│   ├── config/            # Configuration files
│   │   └── environment.js # Environment configuration
│   ├── App.js             # Main application component
│   └── index.js           # Application entry point
├── build.js               # Custom build script
├── DEPLOYMENT_GUIDE.md    # Deployment instructions
└── README.md              # This file
```

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Custom build with deployment preparation
node build.js

# Analyze bundle size
npm run analyze
```

### Code Style
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality

### Development Guidelines
1. Follow React best practices
2. Use functional components with hooks
3. Implement proper error handling
4. Write meaningful commit messages
5. Test on multiple devices and browsers

## 🚀 Deployment

### Production Build

1. **Build the application**
   ```bash
   node build.js
   ```

2. **Deploy files**
   - Upload `deploy/admin/` contents to web server root
   - Ensure `.htaccess` is properly configured
   - Verify SSL certificate is active

3. **Test deployment**
   - Check all routes work correctly
   - Verify API connectivity
   - Test device detection
   - Confirm security headers

### Server Requirements
- **Web Server**: Apache or Nginx
- **SSL Certificate**: Required for HTTPS
- **PHP**: 7.4+ (for backend)
- **Database**: MySQL 5.7+

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 📊 API Integration

### Authentication Endpoints
```javascript
POST /api/auth/login          # Admin login
POST /api/auth/logout         # Logout
GET  /api/auth/me            # Get current user
```

### Property Endpoints
```javascript
GET    /api/properties        # List properties
GET    /api/properties/:id    # Get property details
POST   /api/properties        # Create property
PUT    /api/properties/:id    # Update property
DELETE /api/properties/:id    # Delete property
```

### User Endpoints
```javascript
GET    /api/users            # List users
GET    /api/users/:id        # Get user details
PUT    /api/users/:id        # Update user
DELETE /api/users/:id        # Delete user
```

### Enquiry Endpoints
```javascript
GET    /api/enquiries        # List enquiries
GET    /api/enquiries/:id    # Get enquiry details
POST   /api/enquiries/:id/respond # Respond to enquiry
DELETE /api/enquiries/:id    # Delete enquiry
```

## 🔒 Security

### Authentication
- JWT token-based authentication
- Secure token storage in localStorage
- Automatic token refresh
- Role-based access control

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content Security Policy (configurable)

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1200px

### Device Detection
- User agent analysis
- Screen size detection
- Touch capability detection
- Automatic routing based on device type

## 🧪 Testing

### Testing Strategy
- Unit tests for components
- Integration tests for API calls
- End-to-end testing for user flows
- Cross-browser compatibility testing

### Test Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="Dashboard"
```

## 🔄 Future Enhancements

### Planned Features
- [ ] Progressive Web App (PWA) support
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Document management system
- [ ] Integration with third-party services
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Dark mode theme

### Performance Optimizations
- [ ] Code splitting for faster loading
- [ ] Image optimization and lazy loading
- [ ] Service worker implementation
- [ ] CDN integration
- [ ] Database query optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
1. Follow the installation instructions
2. Create a new branch for your feature
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Documentation**: Check this README and deployment guide
- **Issues**: Create an issue on GitHub
- **Email**: [Your support email]
- **Phone**: [Your support phone]

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- React team for the amazing framework
- All contributors and testers
- Real estate industry professionals for requirements and feedback

---

**Built with ❤️ for the real estate industry**