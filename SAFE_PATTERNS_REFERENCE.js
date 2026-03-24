/**
 * QUICK REFERENCE: Error-Safe React Patterns
 * Copy-paste ready code examples
 */

// ========== SAFE PROPERTY ACCESS ==========

// Pattern 1: Optional chaining with nullish coalescing
const name = user?.profile?.name ?? 'Unknown';
const email = data?.user?.email ?? '';
const count = response?.data?.length ?? 0;

// Pattern 2: Using safeGet utility
import { safeGet } from '../utils/safeProperties';
const name = safeGet(user, 'profile.name', 'Unknown');
const email = safeGet(response, 'data.userData.email', '');

// Pattern 3: Safe nested access
const value = obj?.a?.b?.c?.d ?? defaultValue;

// ========== SAFE ARRAY OPERATIONS ==========

// Pattern 1: Validate before filter
const items = Array.isArray(data) ? data : [];
const filtered = items.filter(item => item?.name?.includes(search ?? ''));

// Pattern 2: Using ensureArray utility
import { ensureArray } from '../utils/safeProperties';
const items = ensureArray(data);
const filtered = items.filter(item => item?.id);

// Pattern 3: Safe map operations
const mapped = ensureArray(items).map(item => ({
  ...item,
  display: item?.name ?? 'N/A'
}));

// ========== SAFE STATE UPDATES ==========

// Pattern 1: In useEffect
React.useEffect(() => {
  const loadData = async () => {
    try {
      const response = await api.get('/endpoint');
      const data = safeGet(response, 'data', {});
      setState(data);
    } catch (error) {
      console.error('Failed to load:', error);
      setState({}); // Default fallback
    }
  };
  loadData();
}, []);

// Pattern 2: API call with validation
const handleFetch = async () => {
  try {
    setLoading(true);
    const response = await api.get('/data');
    const items = ensureArray(safeGet(response, 'data.items', []));
    setItems(items);
  } catch (error) {
    setError(formatErrorMessage(error));
    setItems([]); // Fallback
  } finally {
    setLoading(false);
  }
};

// ========== SAFE OBJECT CREATION ==========

// Pattern 1: With defaults
const config = {
  timeout: response?.timeout ?? 10000,
  retries: response?.retries ?? 3,
  headers: response?.headers ?? {}
};

// Pattern 2: Using ensureObject
import { ensureObject } from '../utils/safeProperties';
const settings = ensureObject(user?.settings);
const theme = settings.theme ?? 'light';

// ========== SAFE ERROR HANDLING ==========

// Pattern 1: Format error message
import { formatErrorMessage } from '../utils/safeProperties';
try {
  await api.post('/endpoint', data);
} catch (error) {
  const message = formatErrorMessage(error);
  setError(message); // Safe to display
}

// Pattern 2: Handle multiple error types
try {
  const result = await someAsync();
} catch (error) {
  if (error?.response?.status === 401) {
    // Unauthorized
    redirectToLogin();
  } else if (error?.response?.status === 404) {
    // Not found
    setError('Item not found');
  } else {
    // Generic error
    const msg = formatErrorMessage(error);
    setError(msg);
  }
}

// ========== SAFE COMPONENT RENDERING ==========

// Pattern 1: Conditional rendering with fallback
export default function MyComponent() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/data');
        setData(response?.data ?? null);
      } catch (err) {
        setError(formatErrorMessage(err));
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <EmptyState />;

  return <DataDisplay data={data} />;
}

// Pattern 2: Safe prop access in child components
export default function ListItem({ item }) {
  return (
    <div>
      <h3>{item?.name ?? 'Untitled'}</h3>
      <p>{item?.description ?? 'No description'}</p>
      <button onClick={() => {
        if (item?._id) {
          handleClick(item._id);
        }
      }}>
        Action
      </button>
    </div>
  );
}

// ========== SAFE FORM HANDLING ==========

// Pattern 1: Safe form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const formData = {
      name: e.target?.elements?.name?.value ?? '',
      email: e.target?.elements?.email?.value ?? '',
    };

    if (!formData.name || !formData.email) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    const response = await api.post('/submit', formData);
    
    const result = safeGet(response, 'data', {});
    if (result.success) {
      setSuccess('Submitted successfully');
    } else {
      setError(result.message ?? 'Submission failed');
    }
  } catch (error) {
    setError(formatErrorMessage(error));
  } finally {
    setLoading(false);
  }
};

// ========== SAFE DATA TRANSFORMATION ==========

// Pattern 1: Transform API response safely
const transformUser = (user) => {
  if (!user) return null;
  
  return {
    id: user?._id ?? null,
    name: user?.name ?? 'Unknown',
    email: user?.email ?? '',
    role: user?.role ?? 'user',
    profile: {
      bio: user?.profile?.bio ?? '',
      avatar: user?.profile?.avatar ?? null,
      verified: user?.profile?.verified ?? false
    }
  };
};

// Pattern 2: Safe list transformation
const transformList = (items) => {
  return ensureArray(items).map(item => ({
    key: item?._id ?? Math.random(),
    label: item?.name ?? 'N/A',
    value: item?.value ?? '',
    enabled: item?.active ?? false
  })).filter(item => item.value); // Remove empty
};

// ========== SAFE LOCAL STORAGE ==========

// Pattern 1: Safe localStorage access
import { safeParse, safeStringify } from '../utils/safeProperties';

const saveUser = (user) => {
  try {
    localStorage.setItem('current_user', safeStringify(user));
  } catch (error) {
    console.error('Failed to save user:', error);
  }
};

const getUser = () => {
  try {
    const raw = localStorage.getItem('current_user');
    return safeParse(raw, null);
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
};

// ========== COMMON MISTAKES TO AVOID ==========

// ❌ DON'T DO THIS
const name = user.profile.name; // Crashes if user or profile is undefined
const items = data.items.filter(...); // Crashes if data.items is not an array
const value = response.data.data.user.name; // Deep nesting = high crash risk

// ✅ DO THIS INSTEAD
const name = user?.profile?.name ?? 'Unknown';
const items = ensureArray(data?.items).filter(...);
const value = safeGet(response, 'data.data.user.name', 'Unknown');

// ========== TESTING SAFE PATTERNS ==========

// Test with these values in console:
const testCases = {
  undefined: undefined,
  null: null,
  emptyObject: {},
  emptyArray: [],
  validData: { user: { name: 'John' } }
};

Object.entries(testCases).forEach(([key, value]) => {
  console.log(key, ':', safeGet(value, 'user.name', 'FALLBACK'));
});
