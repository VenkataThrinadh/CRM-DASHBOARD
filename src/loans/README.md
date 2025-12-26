# Loans Module Documentation

This directory contains all the loan-related components, pages, and services for the admin CRM dashboard.

## Directory Structure

```
loans/
├── pages/                          # Page components for each loan section
│   ├── Customers.js               # Customers list with split-view detail panel
│   ├── CustomerDocuments.js       # Customer documents management
│   ├── Borrowers.js               # Borrowers management
│   ├── Loans.js                   # Loans management
│   ├── Payments.js                # Payments management
│   ├── Receipts.js                # Receipts management
│   ├── Reports.js                 # Reports and analytics
│   ├── Transactions.js            # Transactions management
│   ├── BalanceManagement.js       # Balance management
│   └── Settings.js                # Loans settings
├── components/                    # Reusable components
│   └── DetailPanelComponents.jsx  # Split-view detail panel components
├── services/                      # API services and utilities
│   └── customerService.js         # Customer-related API calls
└── utils/                         # Utility functions
```

## Features

### Customers Page
The Customers page implements a **split-view layout** with the following features:

1. **Left Panel (List)**
   - Table displaying all customers
   - Search functionality
   - Pagination (5, 10, 25, 50 items per page)
   - Customer selection highlighting
   - Quick action buttons (Edit)

2. **Right Panel (Details)** - Desktop Only
   - Customer avatar with initials
   - Contact information (Phone, Email)
   - Location details (State, Zip Code)
   - Full address
   - Action buttons (Edit, Delete)
   - Automatically updates when selecting a customer

3. **Mobile View**
   - Converts right panel to a bottom drawer
   - Maintains all functionality
   - Responsive design

4. **Dialog for Add/Edit**
   - Modal form for creating/updating customers
   - Form validation
   - State, email, phone number validation
   - Success/error notifications

### Components

#### DetailPanelComponents.jsx
Provides reusable components for split-view layouts:
- `DetailPanelHeader` - Header with close button
- `DetailPanelContainer` - Responsive drawer container
- `SplitViewLayout` - Main split-view wrapper
- `DetailInfo` - Key-value information display
- `DetailAvatar` - Avatar with name and ID
- `EmptyDetailPanel` - Empty state message

## Services

### CustomerService.js
Mock service for customer operations. Ready to be extended with real API calls:
- `getCustomers()` - Fetch all customers
- `getCustomerById()` - Get single customer
- `createCustomer()` - Create new customer
- `updateCustomer()` - Update customer
- `deleteCustomer()` - Delete customer
- `uploadCustomerPhoto()` - Upload customer photo

## Future Development

The following pages need similar split-view implementations:
- CustomerDocuments - Document list with document preview
- Borrowers - Borrower list with borrower details
- Loans - Loan list with loan details
- Payments - Payment list with transaction details
- Receipts - Receipt list with receipt details
- Reports - Report generation and viewing
- Transactions - Transaction history with details
// Vouchers removed: feature deprecated.
- BalanceManagement - Balance overview
- Settings - Loans-specific settings

## Integration with Frontend

The implementation follows the same pattern as the frontend:
- Uses mock data initially
- Provides TODO comments for API integration points
- Maintains consistency with Material-UI design system
- Responsive and mobile-friendly

## Usage Example

```jsx
import Customers from '../loans/pages/Customers';

// In your router
<Route path="/loans-dashboard/customers" element={<Customers />} />
```

## Customization

To modify the Customers page:

1. **Update Services** - Replace mock data in `customerService.js` with real API calls
2. **Add New Fields** - Update form fields and detail display
3. **Change Layout** - Modify SplitViewLayout or create custom layout
4. **Styling** - Adjust Material-UI sx props for custom appearance

## Notes

- All pages use mock data for initial development
- Forms include basic validation
- Toast notifications for user feedback
- Responsive design for all screen sizes
- Accessible components following Material-UI guidelines
