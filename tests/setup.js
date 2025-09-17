import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.VITE_R2_ACCOUNT_ID = 'test-account-id'
process.env.VITE_R2_ACCESS_KEY_ID = 'test-access-key'
process.env.VITE_R2_SECRET_ACCESS_KEY = 'test-secret-key'
process.env.VITE_R2_BUCKET_NAME = 'test-bucket'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock Clerk authentication
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User'
    },
    isSignedIn: true,
    isLoaded: true
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: 'test-user-id',
    getToken: () => Promise.resolve('test-token')
  }),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => '<div>User Button</div>'
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        download: vi.fn(() => Promise.resolve({ data: null, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
        list: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }
  },
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}))

// Mock R2 Storage
vi.mock('@/lib/storage/r2Client', () => ({
  r2Storage: {
    isInitialized: vi.fn(() => true),
    uploadFile: vi.fn(() => Promise.resolve({
      success: true,
      fileKey: 'test-file-key',
      fileUrl: 'https://test.r2.dev/test-file-key',
      fileName: 'test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf'
    })),
    getDownloadUrl: vi.fn(() => Promise.resolve('https://test.r2.dev/download-url')),
    deleteFile: vi.fn(() => Promise.resolve(true)),
    listUserFiles: vi.fn(() => Promise.resolve([])),
    getUserStorageUsage: vi.fn(() => Promise.resolve({
      totalFiles: 0,
      totalSize: 0,
      totalSizeMB: 0,
      files: []
    }))
  }
}))

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      }
    },
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn()
  }))
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock window methods
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  }
})

// Suppress console warnings during tests
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  if (args[0]?.includes('React Router')) return
  originalConsoleWarn(...args)
}