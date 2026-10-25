export const SEED_CONSTANTS = {
  // Merchants
  MERCHANT_A: {
    id: '11111111-1111-4000-8000-000000000001',
    name: 'Merchant Alpha',
    slug: 'merchant-alpha',
  },
  MERCHANT_B: {
    id: '22222222-2222-4000-8000-000000000001',
    name: 'Merchant Beta',
    slug: 'merchant-beta',
  },

  // Stores
  STORE_1: {
    id: '11111111-1111-4000-8000-000000000011',
    merchantId: '11111111-1111-4000-8000-000000000001',
    name: 'Alpha Store Downtown',
    address: '100 Main St, Bengaluru',
  },
  STORE_2: {
    id: '11111111-1111-4000-8000-000000000012',
    merchantId: '11111111-1111-4000-8000-000000000001',
    name: 'Alpha Store Airport',
    address: 'Terminal 2, BLR Airport',
  },
  STORE_3: {
    id: '22222222-2222-4000-8000-000000000013',
    merchantId: '22222222-2222-4000-8000-000000000001',
    name: 'Beta Store Central',
    address: '50 Park Avenue, Mumbai',
  },

  // Subscription Plans
  PLANS: {
    STARTER: {
      id: '33333333-3333-4000-8000-000000000001',
      name: 'Starter Plan',
      slug: 'starter',
      description: 'Perfect for single boutique store or kiosk',
      priceMinorUnits: 99900, // ₹999.00
      currency: 'INR',
      durationMonths: 1,
      maxStores: 1,
      maxUsers: 3,
      features: ['Basic POS', '1 Store', 'Up to 3 Cashiers/Managers', 'Daily Reports'],
    },
    GROWTH: {
      id: '33333333-3333-4000-8000-000000000002',
      name: 'Growth Plan',
      slug: 'growth',
      description: 'Ideal for expanding retail businesses with multiple locations',
      priceMinorUnits: 499900, // ₹4,999.00
      currency: 'INR',
      durationMonths: 6,
      maxStores: 5,
      maxUsers: 20,
      features: ['Multi-Store POS', 'Up to 5 Stores', 'Up to 20 Users', 'Inventory Sync', 'Advanced Analytics'],
    },
    ENTERPRISE: {
      id: '33333333-3333-4000-8000-000000000003',
      name: 'Enterprise Plan',
      slug: 'enterprise',
      description: 'For large franchises with limitless scaling needs',
      priceMinorUnits: 1999900, // ₹19,999.00
      currency: 'INR',
      durationMonths: 12,
      maxStores: 50,
      maxUsers: 200,
      features: ['Unlimited Scale', 'Up to 50 Stores', 'Up to 200 Users', 'Priority 24/7 Support', 'Dedicated Account Manager'],
    },
  },

  // Users
  USERS: {
    SUPER_ADMIN: {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'superadmin@posplatform.com',
      merchantId: null,
      storeId: null,
      role: 'SUPER_ADMIN',
    },
    OWNER_A: {
      id: '11111111-1111-4000-8000-000000000021',
      email: 'owner-a@merchant.com',
      merchantId: '11111111-1111-4000-8000-000000000001',
      storeId: null,
      role: 'OWNER',
    },
    OWNER_B: {
      id: '22222222-2222-4000-8000-000000000022',
      email: 'owner-b@merchant.com',
      merchantId: '22222222-2222-4000-8000-000000000001',
      storeId: null,
      role: 'OWNER',
    },
    MANAGER_S1: {
      id: '11111111-1111-4000-8000-000000000023',
      email: 'manager-s1@merchant.com',
      merchantId: '11111111-1111-4000-8000-000000000001',
      storeId: '11111111-1111-4000-8000-000000000011',
      role: 'MANAGER',
    },
    CASHIER_S1: {
      id: '11111111-1111-4000-8000-000000000024',
      email: 'cashier-s1@merchant.com',
      merchantId: '11111111-1111-4000-8000-000000000001',
      storeId: '11111111-1111-4000-8000-000000000011',
      role: 'CASHIER',
    },
    CASHIER_S2: {
      id: '11111111-1111-4000-8000-000000000025',
      email: 'cashier-s2@merchant.com',
      merchantId: '11111111-1111-4000-8000-000000000001',
      storeId: '11111111-1111-4000-8000-000000000012',
      role: 'CASHIER',
    },
    CASHIER_S3: {
      id: '22222222-2222-4000-8000-000000000026',
      email: 'cashier-s3@merchant.com',
      merchantId: '22222222-2222-4000-8000-000000000001',
      storeId: '22222222-2222-4000-8000-000000000013',
      role: 'CASHIER',
    },
  },

  // Products
  PRODUCTS: {
    A1: {
      id: '11111111-1111-4000-8000-000000000031',
      merchantId: '11111111-1111-4000-8000-000000000001',
      name: 'Espresso Roast Coffee Beans',
      description: 'Single-origin premium roasted coffee beans 250g',
      priceMinorUnits: 45000, // ₹450.00
      currency: 'INR',
      sku: 'COF-ESP-001',
    },
    A2: {
      id: '11111111-1111-4000-8000-000000000032',
      merchantId: '11111111-1111-4000-8000-000000000001',
      name: 'Ceramic Coffee Mug',
      description: 'Matte black 350ml ceramic mug',
      priceMinorUnits: 25000, // ₹250.00
      currency: 'INR',
      sku: 'MUG-BLK-001',
    },
    A3: {
      id: '11111111-1111-4000-8000-000000000033',
      merchantId: '11111111-1111-4000-8000-000000000001',
      name: 'Almond Croissant',
      description: 'Fresh butter croissant baked daily',
      priceMinorUnits: 15000, // ₹150.00
      currency: 'INR',
      sku: 'BAK-ALM-001',
    },
    B1: {
      id: '22222222-2222-4000-8000-000000000031',
      merchantId: '22222222-2222-4000-8000-000000000001',
      name: 'Organic Green Tea',
      description: 'Darjeeling loose leaf organic tea 100g',
      priceMinorUnits: 32000, // ₹320.00
      currency: 'INR',
      sku: 'TEA-GRN-001',
    },
    B2: {
      id: '22222222-2222-4000-8000-000000000032',
      merchantId: '22222222-2222-4000-8000-000000000001',
      name: 'Matcha Powder',
      description: 'Ceremonial grade Japanese matcha 50g',
      priceMinorUnits: 85000, // ₹850.00
      currency: 'INR',
      sku: 'TEA-MTC-001',
    },
    B3: {
      id: '22222222-2222-4000-8000-000000000033',
      merchantId: '22222222-2222-4000-8000-000000000001',
      name: 'Tea Infuser Bottle',
      description: 'Glass double-wall tea infuser tumbler',
      priceMinorUnits: 49900, // ₹499.00
      currency: 'INR',
      sku: 'ACC-INF-001',
    },
  },

  // Stock Initial quantities
  INVENTORY: [
    // Store 1 (Alpha Downtown)
    { storeId: '11111111-1111-4000-8000-000000000011', productId: '11111111-1111-4000-8000-000000000031', quantity: 5 }, // 5 for concurrency scenario
    { storeId: '11111111-1111-4000-8000-000000000011', productId: '11111111-1111-4000-8000-000000000032', quantity: 20 },
    { storeId: '11111111-1111-4000-8000-000000000011', productId: '11111111-1111-4000-8000-000000000033', quantity: 50 },

    // Store 2 (Alpha Airport)
    { storeId: '11111111-1111-4000-8000-000000000012', productId: '11111111-1111-4000-8000-000000000031', quantity: 15 },
    { storeId: '11111111-1111-4000-8000-000000000012', productId: '11111111-1111-4000-8000-000000000032', quantity: 10 },
    { storeId: '11111111-1111-4000-8000-000000000012', productId: '11111111-1111-4000-8000-000000000033', quantity: 30 },

    // Store 3 (Beta Central)
    { storeId: '22222222-2222-4000-8000-000000000013', productId: '22222222-2222-4000-8000-000000000031', quantity: 40 },
    { storeId: '22222222-2222-4000-8000-000000000013', productId: '22222222-2222-4000-8000-000000000032', quantity: 25 },
    { storeId: '22222222-2222-4000-8000-000000000013', productId: '22222222-2222-4000-8000-000000000033', quantity: 15 },
  ],

  DEFAULT_PASSWORD: 'password123',
};
