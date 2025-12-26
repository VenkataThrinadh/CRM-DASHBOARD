// Sample data for testing the admin dashboard
export const sampleUsers = [
  {
    id: 1,
    full_name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '9876543210',
    role: 'admin',
    status: 'active',
    is_verified: true,
    date_of_birth: '1985-06-15',
    gender: 'male',
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip_code: '400001',
    occupation: 'Software Engineer',
    company: 'Tech Solutions Inc',
    created_at: '2023-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    full_name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '9876543211',
    role: 'agent',
    status: 'active',
    is_verified: true,
    date_of_birth: '1990-03-22',
    gender: 'female',
    address: '456 Oak Avenue',
    city: 'Delhi',
    state: 'Delhi',
    zip_code: '110001',
    occupation: 'Real Estate Agent',
    company: 'Prime Properties',
    created_at: '2023-02-20T14:15:00Z',
    updated_at: '2024-01-20T14:15:00Z'
  },
  {
    id: 3,
    full_name: 'Michael Brown',
    email: 'michael.brown@example.com',
    phone: '9876543212',
    role: 'user',
    status: 'active',
    is_verified: false,
    date_of_birth: '1988-11-08',
    gender: 'male',
    address: '789 Pine Road',
    city: 'Bangalore',
    state: 'Karnataka',
    zip_code: '560001',
    occupation: 'Business Analyst',
    company: 'Analytics Corp',
    created_at: '2023-03-10T09:45:00Z',
    updated_at: '2024-01-10T09:45:00Z'
  },
  {
    id: 4,
    full_name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '9876543213',
    role: 'user',
    status: 'active',
    is_verified: true,
    date_of_birth: '1992-07-30',
    gender: 'female',
    address: '321 Elm Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    zip_code: '600001',
    occupation: 'Marketing Manager',
    company: 'Creative Agency',
    created_at: '2023-04-05T16:20:00Z',
    updated_at: '2024-01-05T16:20:00Z'
  },
  {
    id: 5,
    full_name: 'David Wilson',
    email: 'david.wilson@example.com',
    phone: '9876543214',
    role: 'agent',
    status: 'inactive',
    is_verified: true,
    date_of_birth: '1987-12-12',
    gender: 'male',
    address: '654 Maple Drive',
    city: 'Pune',
    state: 'Maharashtra',
    zip_code: '411001',
    occupation: 'Property Consultant',
    company: 'Elite Realty',
    created_at: '2023-05-18T11:30:00Z',
    updated_at: '2024-01-18T11:30:00Z'
  }
];

export const sampleEnquiries = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '9876543220',
    subject: 'Interested in 3BHK Apartment',
    message: 'I am looking for a 3BHK apartment in Mumbai with good connectivity to IT parks. My budget is around 1.5 crores.',
    property_id: 1,
    user_id: null,
    status: 'new',
    priority: 'high',
    source: 'website',
    assigned_to: 2,
    follow_up_date: '2024-02-15',
    notes: 'Customer seems serious. Schedule site visit.',
    budget_min: '12000000',
    budget_max: '15000000',
    preferred_location: 'Andheri, Powai, Thane',
    property_type: 'apartment',
    requirements: '3BHK, good connectivity, parking space, gym facilities',
    created_at: '2024-01-10T10:30:00Z',
    updated_at: '2024-01-10T10:30:00Z'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '9876543221',
    subject: 'Villa for Investment',
    message: 'Looking for a villa in Goa for investment purposes. Prefer beachside location.',
    property_id: null,
    user_id: 3,
    status: 'in_progress',
    priority: 'medium',
    source: 'referral',
    assigned_to: 2,
    follow_up_date: '2024-02-20',
    notes: 'Referred by existing client. High potential.',
    budget_min: '25000000',
    budget_max: '40000000',
    preferred_location: 'North Goa, Candolim, Calangute',
    property_type: 'villa',
    requirements: 'Beachside, 4BHK, swimming pool, garden',
    created_at: '2024-01-12T14:15:00Z',
    updated_at: '2024-01-15T14:15:00Z'
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    phone: '9876543222',
    subject: 'Commercial Space Inquiry',
    message: 'Need commercial space for my startup in Bangalore. Looking for office space around 2000 sq ft.',
    property_id: null,
    user_id: null,
    status: 'responded',
    priority: 'medium',
    source: 'phone',
    assigned_to: null,
    follow_up_date: '2024-02-18',
    notes: 'Sent property options via email. Awaiting response.',
    budget_min: '5000000',
    budget_max: '8000000',
    preferred_location: 'Koramangala, Indiranagar, Whitefield',
    property_type: 'commercial',
    requirements: 'Office space, 2000 sq ft, parking, good connectivity',
    created_at: '2024-01-08T09:45:00Z',
    updated_at: '2024-01-12T09:45:00Z'
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    phone: '9876543223',
    subject: 'First Home Purchase',
    message: 'Looking to buy my first home in Hyderabad. Prefer 2BHK apartment with modern amenities.',
    property_id: 2,
    user_id: 4,
    status: 'closed',
    priority: 'low',
    source: 'social_media',
    assigned_to: 2,
    follow_up_date: null,
    notes: 'Successfully closed. Customer purchased property.',
    budget_min: '6000000',
    budget_max: '9000000',
    preferred_location: 'Gachibowli, Madhapur, Kondapur',
    property_type: 'apartment',
    requirements: '2BHK, modern amenities, gym, swimming pool',
    created_at: '2024-01-05T16:20:00Z',
    updated_at: '2024-01-25T16:20:00Z'
  },
  {
    id: 5,
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    phone: '9876543224',
    subject: 'Plot for Construction',
    message: 'Looking for a residential plot in Delhi NCR to construct my dream home.',
    property_id: null,
    user_id: null,
    status: 'cancelled',
    priority: 'low',
    source: 'advertisement',
    assigned_to: null,
    follow_up_date: null,
    notes: 'Customer cancelled due to budget constraints.',
    budget_min: '15000000',
    budget_max: '20000000',
    preferred_location: 'Gurgaon, Noida, Faridabad',
    property_type: 'plot',
    requirements: 'Residential plot, 200-300 sq yards, good location',
    created_at: '2024-01-03T11:30:00Z',
    updated_at: '2024-01-20T11:30:00Z'
  },
  {
    id: 6,
    name: 'Anita Gupta',
    email: 'anita.gupta@example.com',
    phone: '9876543225',
    subject: 'Luxury Apartment Inquiry',
    message: 'Interested in luxury apartments in South Mumbai. Looking for sea-facing properties.',
    property_id: null,
    user_id: null,
    status: 'new',
    priority: 'urgent',
    source: 'walk_in',
    assigned_to: 2,
    follow_up_date: '2024-02-12',
    notes: 'VIP client. Handle with priority.',
    budget_min: '50000000',
    budget_max: '80000000',
    preferred_location: 'Worli, Bandra, Juhu',
    property_type: 'apartment',
    requirements: 'Luxury apartment, sea-facing, 4BHK, premium amenities',
    created_at: '2024-01-28T13:45:00Z',
    updated_at: '2024-01-28T13:45:00Z'
  }
];

export const sampleProperties = [
  {
    id: 1,
    title: 'Luxury 3BHK Apartment in Andheri',
    description: 'Spacious 3BHK apartment with modern amenities and excellent connectivity.',
    property_type: 'apartment',
    status: 'available',
    is_featured: true,
    address: '123 Andheri West, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip_code: '400058',
    location: 'Andheri West',
    price: '15000000',
    area: 1200,
    built_year: 2020,
    unit_number: 'A-1201',
    outstanding_amount: 0,
    contact_email: 'sales@primerealty.com',
    contact_phone: '9876543230',
    features: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden'],
    amenities: ['Air Conditioning', 'Modular Kitchen', 'Balcony', 'Elevator'],
    specifications: [
      { name: 'Bedrooms', value: '3' },
      { name: 'Bathrooms', value: '2' },
      { name: 'Balconies', value: '2' }
    ],
    plans: [
      { name: 'Ground Floor', area: '1200', price: '15000000' }
    ],
    plots: [],
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    title: 'Modern 2BHK in Gachibowli',
    description: 'Contemporary 2BHK apartment in IT corridor with all modern facilities.',
    property_type: 'apartment',
    status: 'sold',
    is_featured: false,
    address: '456 Gachibowli, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    zip_code: '500032',
    location: 'Gachibowli',
    price: '8500000',
    area: 950,
    built_year: 2021,
    unit_number: 'B-805',
    outstanding_amount: 0,
    contact_email: 'info@modernhomes.com',
    contact_phone: '9876543231',
    features: ['Gym', 'Parking', 'Security', 'Playground'],
    amenities: ['Air Conditioning', 'Modular Kitchen', 'Balcony'],
    specifications: [
      { name: 'Bedrooms', value: '2' },
      { name: 'Bathrooms', value: '2' },
      { name: 'Balconies', value: '1' }
    ],
    plans: [
      { name: 'Floor Plan', area: '950', price: '8500000' }
    ],
    plots: [],
    created_at: '2023-11-15T14:30:00Z',
    updated_at: '2024-01-25T14:30:00Z'
  }
];

// Function to load sample data into localStorage for testing
export const loadSampleData = () => {
  localStorage.setItem('sampleUsers', JSON.stringify(sampleUsers));
  localStorage.setItem('sampleEnquiries', JSON.stringify(sampleEnquiries));
  localStorage.setItem('sampleProperties', JSON.stringify(sampleProperties));
};

// Function to get sample data from localStorage
export const getSampleData = (type) => {
  const data = localStorage.getItem(`sample${type}`);
  return data ? JSON.parse(data) : [];
};

// Function to clear sample data
export const clearSampleData = () => {
  localStorage.removeItem('sampleUsers');
  localStorage.removeItem('sampleEnquiries');
  localStorage.removeItem('sampleProperties');
};