# Customer Information Page Design Documentation

## Overview
The Customer Information Page is designed with a modular, card-based layout that provides comprehensive customer details while maintaining scalability for future enhancements.

## 2.1 Main Page Layout

### Design Principles
- **Responsive Grid System**: Uses Material-UI's Grid component for flexible layout adaptation
- **Card-Based Architecture**: Each functional area is contained within its own card for modularity
- **Progressive Disclosure**: Information is organized hierarchically from most to least important
- **Consistent Spacing**: Standardized spacing using Material-UI's spacing system (sx={{ p: 3, mb: 3 }})

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header (Back Button + Title + Edit Button)                 │
├─────────────────────────────────────────────────────────────┤
│ Main Content Grid (12 columns)                             │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ Customer Information    │ │ Quick Actions Card          │ │
│ │ Card (8 columns)        │ │ (4 columns)                 │ │
│ │                         │ ├─────────────────────────────┤ │
│ │ - Contact Information   │ │ Customer Summary Card       │ │
│ │ - Personal Information  │ │ (4 columns)                 │ │
│ │ - Business Information  │ │                             │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
│                                                             │
│ Future Cards (Full Width or Split)                         │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ Customer Enquiries      │ │ Customer Properties         │ │
│ │ Card (6 columns)        │ │ Card (6 columns)            │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Customer Activity Timeline (12 columns)                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Behavior
- **Desktop (lg+)**: 8/4 column split for main content
- **Tablet (md)**: 12/12 column stack
- **Mobile (sm)**: Single column layout with optimized card heights

## 2.2 Cards Implementation

### 2.2.1 Customer Information Card

#### Fields Included
- **Name**: Primary identifier with avatar
- **Contact Number**: Phone with formatting
- **Email**: Email address with validation
- **Customer ID**: Unique identifier for customer portal
- **Customer Password**: Masked password for portal access
- **Address**: Full address with city extraction
- **Date of Birth**: Formatted date display
- **Registration Date**: Account creation timestamp
- **Assigned Sales Executive**: Future relationship field

#### Design Considerations

##### Visual Hierarchy
```jsx
<CardHeader>
  <Avatar> + <Name + Status Chips> + <Edit Button>
  <Subheader: Registration Date>
</CardHeader>
<CardContent>
  <Section: Contact Information>
    - Phone Number (with icon)
    - Email Address (with icon)
    - Customer ID (with icon)
    - Customer Password (masked, with icon)
  
  <Section: Personal Information>
    - Address (with icon)
    - City (with icon)
    - Date of Birth (with icon)
    - Registration Date (with icon)
  
  <Section: Business Information>
    - Assigned Sales Executive (with icon)
</CardContent>
```

##### Icon System
- **Consistent Icons**: Each field type has a dedicated Material-UI icon
- **Color Coding**: Icons use `color="action"` for subtle visual hierarchy
- **Semantic Meaning**: Icons provide immediate context for field types

##### Status Indicators
- **Customer Status**: Color-coded chips (Active=green, Inactive=grey, Blocked=red, Pending=orange)
- **Customer Type**: Outlined chips (Individual=primary, Business=secondary, Investor=info)

#### "View Details" Button Design

##### Button Placement
- **Primary Location**: Card header action area (top-right)
- **Secondary Location**: Quick Actions card
- **Accessibility**: Tooltip with descriptive text

##### Button Variants
```jsx
// Primary Edit Button (Header)
<Button variant="contained" startIcon={<Edit />} onClick={handleEditClick}>
  Edit Customer
</Button>

// Secondary Edit Button (Quick Actions)
<Button fullWidth variant="outlined" startIcon={<Edit />} onClick={handleEditClick}>
  Edit Information
</Button>
```

##### Visual States
- **Default**: Contained button with primary color
- **Hover**: Elevated shadow with color intensification
- **Loading**: Disabled state with loading indicator
- **Focus**: Keyboard navigation outline

#### Edit Form Design Considerations

##### Modal vs. Inline Editing
- **Choice**: Modal dialog for comprehensive editing
- **Rationale**: Prevents accidental navigation away, provides focused editing experience
- **Size**: `maxWidth="md"` with `fullWidth` for optimal form layout

##### Form Organization
```jsx
<DialogContent>
  <Section: Basic Information>
    - Full Name (required)
    - Email (required, validated)
    - Phone Number
    - Customer ID
    - Customer Password (with show/hide toggle)
    - Date of Birth (date picker)
  
  <Section: Address Information>
    - Address (multiline)
    - City
    - State
    - ZIP Code
  
  <Section: Customer Settings>
    - Status (dropdown)
    - Customer Type (dropdown)
</DialogContent>
```

##### Validation Strategy
- **Real-time Validation**: Field-level validation on blur
- **Form Validation**: Complete form validation on submit
- **Error Display**: Helper text under fields with error styling
- **Success Feedback**: Snackbar notification on successful save

##### Password Field Security
```jsx
<TextField
  type={showPassword ? 'text' : 'password'}
  InputProps={{
    endAdornment: (
      <IconButton onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    ),
  }}
  helperText="Password for customer portal access"
/>
```

## Future Card Expansion

### 2.2.2 Customer Enquiries Card (Implemented)
- **Purpose**: Display customer's property enquiries
- **Features**: Status tracking, priority indicators, quick actions
- **Integration**: Links to enquiry detail pages

### 2.2.3 Customer Properties Card (Implemented)
- **Purpose**: Show favorite and viewed properties
- **Features**: Property thumbnails, quick actions, activity tracking
- **Integration**: Links to property detail pages

### 2.2.4 Customer Activity Card (Implemented)
- **Purpose**: Timeline of customer interactions
- **Features**: Activity types, timestamps, related actions
- **Integration**: Links to related entities

### 2.2.5 Future Cards (Planned)

#### Communication History Card
```jsx
<CustomerCommunicationCard customerId={id}>
  - Email history
  - Phone call logs
  - SMS records
  - Meeting notes
</CustomerCommunicationCard>
```

#### Financial Information Card
```jsx
<CustomerFinancialCard customerId={id}>
  - Payment history
  - Outstanding amounts
  - Credit score
  - Financial preferences
</CustomerFinancialCard>
```

#### Documents Card
```jsx
<CustomerDocumentsCard customerId={id}>
  - Identity documents
  - Property documents
  - Agreements
  - Verification status
</CustomerDocumentsCard>
```

#### Preferences Card
```jsx
<CustomerPreferencesCard customerId={id}>
  - Property preferences
  - Communication preferences
  - Budget range
  - Location preferences
</CustomerPreferencesCard>
```

## Technical Implementation

### State Management
```jsx
// Customer data state
const [customer, setCustomer] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Edit form state
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [editFormData, setEditFormData] = useState({});
const [editLoading, setEditLoading] = useState(false);
```

### API Integration
```jsx
// Fetch customer details
const fetchCustomerDetails = async () => {
  const response = await customersAPI.getById(id);
  setCustomer(response.data.customer);
};

// Update customer
const handleEditSave = async () => {
  const response = await customersAPI.update(id, editFormData);
  setCustomer(response.data.customer);
};
```

### Error Handling
- **Loading States**: Skeleton components during data fetch
- **Error States**: Alert components with retry options
- **Empty States**: Informative messages with action suggestions

### Performance Considerations
- **Lazy Loading**: Cards load data independently
- **Memoization**: React.memo for card components
- **Debounced Search**: For large datasets in cards
- **Pagination**: For cards with many items

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through interactive elements
- **Focus Management**: Proper focus handling in modals
- **Keyboard Shortcuts**: Common shortcuts for edit actions

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Role Attributes**: Proper semantic roles for custom components
- **Live Regions**: Announcements for dynamic content updates

### Visual Accessibility
- **Color Contrast**: WCAG AA compliant color combinations
- **Focus Indicators**: Clear focus outlines for keyboard users
- **Text Scaling**: Responsive text that scales with browser settings

## Styling and Theming

### Material-UI Theme Integration
```jsx
// Consistent spacing
sx={{ p: 3, mb: 3 }}

// Color system
color="primary" | "secondary" | "error" | "warning" | "info" | "success"

// Typography scale
variant="h4" | "h6" | "subtitle2" | "body2" | "caption"
```

### Custom Styling Patterns
```jsx
// Card hover effects
'&:hover': {
  backgroundColor: 'action.hover',
  cursor: 'pointer'
}

// Status-based styling
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'inactive': return 'default';
    case 'blocked': return 'error';
    case 'pending': return 'warning';
    default: return 'default';
  }
};
```

## Testing Strategy

### Unit Tests
- Component rendering
- User interactions
- State management
- API integration

### Integration Tests
- Form submission flows
- Navigation between cards
- Error handling scenarios

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation

## Future Enhancements

### Advanced Features
1. **Real-time Updates**: WebSocket integration for live data
2. **Bulk Operations**: Multi-customer editing capabilities
3. **Export Functionality**: PDF/Excel export of customer data
4. **Advanced Search**: Full-text search across all customer data
5. **Custom Fields**: Configurable additional fields per business needs

### Performance Optimizations
1. **Virtual Scrolling**: For large datasets in cards
2. **Image Optimization**: Lazy loading and compression for avatars
3. **Caching Strategy**: Redis caching for frequently accessed data
4. **Progressive Loading**: Incremental data loading for better UX

This design provides a solid foundation for comprehensive customer management while maintaining flexibility for future enhancements and business requirements.