# Document Management System

A comprehensive document management system integrated into the admin CRM dashboard for managing property-related documents and files.

## Features

### 📁 Document Organization
- **Categories**: Organize documents by type (Property Documents, Contracts, Certificates, etc.)
- **Property Linking**: Associate documents with specific properties
- **Tags**: Add custom tags for better organization and searchability
- **Status Management**: Active, Archived, or Deleted status tracking

### 🔍 Search & Filter
- **Full-text Search**: Search by title, description, filename, or property name
- **Category Filter**: Filter by document categories
- **Property Filter**: Filter by associated properties
- **Status Filter**: Filter by document status
- **Advanced Pagination**: Navigate through large document collections

### 📤 File Upload & Management
- **Multi-format Support**: PDF, Word, Excel, Images, Text files
- **File Size Validation**: 10MB maximum file size
- **Secure Upload**: File type validation and security checks
- **Bulk Operations**: Upload multiple documents efficiently

### 🔄 Version Control
- **Version Tracking**: Maintain complete version history
- **Change Descriptions**: Document what changed in each version
- **Current Version**: Always know which is the latest version
- **Version Download**: Download any previous version

### 📊 Activity Tracking
- **Complete Audit Trail**: Track all document activities
- **User Attribution**: Know who performed each action
- **Timestamp Tracking**: When each action occurred
- **Activity Types**: Upload, Download, Edit, Delete, Version Upload

### 🔐 Security & Permissions
- **Admin-Only Access**: Only admin users can manage documents
- **Secure Downloads**: Protected file access
- **Activity Logging**: Complete audit trail for compliance

## Components

### DocumentsManager.js
Main component that provides the complete document management interface:
- Document listing with table and grid views
- Search and filtering capabilities
- Upload new documents
- Edit document metadata
- Delete documents
- Category management

### DocumentCard.js
Card component for displaying documents in grid view:
- Visual file type indicators
- Quick action buttons
- Context menu for additional options
- Responsive design

### DocumentDetail.js
Detailed view component for individual documents:
- Complete document information
- Version history timeline
- Activity timeline
- Upload new versions
- Download capabilities

## API Endpoints

### Documents
- `GET /api/documents` - List all documents with pagination and filters
- `GET /api/documents/:id` - Get specific document details
- `POST /api/documents` - Upload new document
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Download document
- `POST /api/documents/:id/versions` - Upload new version

### Categories
- `GET /api/documents/categories/list` - Get all categories
- `POST /api/documents/categories` - Create new category

### Activity
- `GET /api/documents/:id/activity` - Get document activity logs

## Database Tables

### document_categories
Stores document categories with color coding:
- `id`, `name`, `description`, `color`, `is_active`
- Pre-populated with 8 default categories

### documents
Main document storage table:
- Document metadata (title, description, category, property)
- File information (path, size, mime_type)
- Status and tracking fields
- Foreign keys to categories, properties, and users

### document_versions
Version control system:
- Links to parent document
- Version number and file information
- Change descriptions
- Current version tracking

### document_activity_logs
Complete audit trail:
- Action types (upload, download, edit, delete, etc.)
- User attribution and timestamps
- Detailed activity descriptions

### document_approvals
Workflow system for document approvals:
- Approval status tracking
- Approver assignments
- Comments and timestamps

### document_tags & document_tag_relations
Flexible tagging system:
- Custom tags with color coding
- Many-to-many relationships with documents

## Usage

### Basic Usage
```jsx
import DocumentsManager from '../components/documents/DocumentsManager';

function DocumentsPage() {
  return <DocumentsManager />;
}
```

### With Custom Props
```jsx
import DocumentDetail from '../components/documents/DocumentDetail';

function DocumentDetailPage({ documentId }) {
  return (
    <DocumentDetail 
      documentId={documentId}
      onUpdate={handleUpdate}
      onClose={handleClose}
    />
  );
}
```

## File Structure
```
src/components/documents/
├── DocumentsManager.js     # Main management interface
├── DocumentCard.js         # Grid view card component
├── DocumentDetail.js       # Detailed document view
└── README.md              # This documentation

src/pages/
└── Documents.js           # Documents page wrapper
```

## Installation & Setup

1. **Database Setup**: Execute the SQL queries from `schema.sql` to create the required tables
2. **Backend**: The document routes are automatically loaded in `server.js`
3. **Frontend**: The Documents page is added to the routing in `App.js`
4. **Navigation**: Documents menu item is added to the dashboard layout

## Default Categories

The system comes with 8 pre-configured categories:
1. **Property Documents** - Legal documents related to properties
2. **Contracts** - Agreements and contracts
3. **Certificates** - Certificates and approvals
4. **Financial Documents** - Financial records and statements
5. **Legal Documents** - Legal papers and documentation
6. **Marketing Materials** - Brochures, flyers, and promotional content
7. **Technical Documents** - Technical specifications and drawings
8. **Compliance Documents** - Regulatory and compliance documentation

## File Upload Restrictions

- **Maximum Size**: 10MB per file
- **Allowed Types**: 
  - PDF files (.pdf)
  - Word documents (.doc, .docx)
  - Excel spreadsheets (.xls, .xlsx)
  - Images (.jpg, .jpeg, .png)
  - Text files (.txt)

## Security Features

- **File Type Validation**: Only allowed file types can be uploaded
- **Size Limits**: Prevents large file uploads that could impact performance
- **Admin-Only Access**: All document operations require admin authentication
- **Audit Trail**: Complete logging of all document activities
- **Secure File Storage**: Files stored in protected directory structure

## Performance Considerations

- **Pagination**: Large document collections are paginated for better performance
- **Lazy Loading**: Document details loaded on demand
- **Optimized Queries**: Database queries optimized with proper indexing
- **File Streaming**: Large files streamed for download to prevent memory issues

## Future Enhancements

- **Document Preview**: In-browser preview for common file types
- **Advanced Search**: Full-text search within document contents
- **Workflow Automation**: Automated approval workflows
- **Integration**: Integration with external document management systems
- **Mobile Optimization**: Enhanced mobile interface for document management