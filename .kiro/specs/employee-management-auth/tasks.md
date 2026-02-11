# Implementation Plan: Employee Management and Authentication System

## Overview

This implementation plan breaks down the Employee Management and Authentication System into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The implementation follows the existing Fusion Starter architecture with React frontend, Express backend, and MongoDB database.

## Tasks

- [ ] 1. Set up backend authentication infrastructure
  - [ ] 1.1 Create User model with Mongoose schema
    - Define IUser interface with all fields (username, passwordHash, firstName, lastName, phoneNumber, role, permissions, isActive, timestamps)
    - Create UserSchema with proper types, validations, and indexes
    - Export User model
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 1.2 Create password utility functions
    - Implement hashPassword() using bcrypt with 10 salt rounds
    - Implement comparePassword() using bcrypt.compare()
    - Implement generatePassword() for random 8-character passwords
    - _Requirements: 1.3, 1.4, 3.6, 10.1, 10.2, 10.3, 10.5_
  
  - [ ]* 1.3 Write property tests for password utilities
    - **Property 5: Password hashing with bcrypt** - For any password, verify it's hashed with bcrypt, not plaintext, and can be validated
    - **Property 4: Secure password generation** - For any generated password, verify it's at least 8 characters with mixed character types
    - **Property 18: Password validation with bcrypt** - For any password and hash, verify bcrypt.compare() works correctly
    - **Validates: Requirements 1.3, 1.4, 3.6, 10.1, 10.2, 10.3, 10.5**
  
  - [ ] 1.4 Create username generation utility
    - Implement generateUsername() that combines firstName + lastName in lowercase
    - Remove spaces and special characters
    - Check database for uniqueness and append numeric suffix if needed
    - Handle transliteration of non-Latin characters
    - Ensure minimum 3 characters
    - _Requirements: 1.2, 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 1.5 Write property tests for username generation
    - **Property 2: Username generation and uniqueness** - For any name combination, verify username is lowercase, sanitized, and unique with suffix if needed
    - **Property 3: Username transliteration** - For any non-Latin characters, verify they're transliterated
    - **Property 12: Unique username constraint** - For any existing username, verify duplicates are rejected
    - **Validates: Requirements 1.2, 11.2, 12.1, 12.2, 12.3, 12.4, 12.5**
  
  - [ ] 1.6 Create JWT utility functions
    - Implement generateToken() that creates JWT with userId, role, permissions payload and 8-hour expiration
    - Implement verifyToken() that validates and decodes JWT
    - Define TokenPayload interface
    - Use JWT_SECRET from environment variables
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [ ]* 1.7 Write property tests for JWT utilities
    - **Property 16: JWT expiration time** - For any generated token, verify expiration is exactly 8 hours from issuance
    - **Property 15: JWT payload structure** - For any authenticated user, verify token contains userId, role, and permissions
    - **Validates: Requirements 3.3, 3.4**

- [ ] 2. Implement authentication middleware
  - [ ] 2.1 Create authenticateToken middleware
    - Extract JWT from Authorization header (Bearer token)
    - Verify token using verifyToken()
    - Attach decoded user data to req.user
    - Return 401 if token missing, invalid, or expired
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ] 2.2 Create requireAdmin middleware
    - Check if req.user.role === 'admin'
    - Return 403 if not admin
    - Call next() if admin
    - _Requirements: 5.1_
  
  - [ ] 2.3 Create requirePermission middleware factory
    - Return middleware function that checks for specific permission
    - Admin role bypasses permission check
    - Check if permission exists in req.user.permissions
    - Return 403 if no permission
    - _Requirements: 5.2, 5.3, 5.5_
  
  - [ ]* 2.4 Write unit tests for authentication middleware
    - Test authenticateToken with valid token
    - Test authenticateToken with missing token (401)
    - Test authenticateToken with invalid token (401)
    - Test authenticateToken with expired token (401)
    - Test requireAdmin with admin user
    - Test requireAdmin with non-admin user (403)
    - Test requirePermission with admin (always passes)
    - Test requirePermission with employee having permission
    - Test requirePermission with employee lacking permission (403)
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 9.1, 9.2, 9.3_

- [ ] 3. Create authentication API routes
  - [ ] 3.1 Implement POST /api/auth/login endpoint
    - Accept identifier (username or phone) and password
    - Find user by username OR phoneNumber (case-insensitive)
    - Verify password using comparePassword()
    - Check if user isActive
    - Generate JWT token
    - Return token and user profile (exclude passwordHash)
    - Handle errors: 401 for invalid credentials, 403 for inactive user
    - _Requirements: 3.1, 3.2, 3.5, 10.4_
  
  - [ ] 3.2 Implement GET /api/auth/me endpoint
    - Require authentication (use authenticateToken middleware)
    - Return current user profile from req.user
    - Exclude passwordHash from response
    - _Requirements: 10.4_
  
  - [ ] 3.3 Implement POST /api/auth/logout endpoint
    - No server-side action needed (JWT is stateless)
    - Return success message
    - _Requirements: 4.4, 7.2_
  
  - [ ]* 3.4 Write property tests for authentication routes
    - **Property 13: Valid credentials authentication** - For any user with valid credentials, verify login with username or phone succeeds
    - **Property 14: Invalid credentials rejection** - For any invalid credentials, verify login fails without revealing which part was wrong
    - **Property 17: Login response structure** - For any successful login, verify response includes token and user profile without passwordHash
    - **Property 19: Password hash exclusion from responses** - For any API response with user data, verify passwordHash is never included
    - **Validates: Requirements 3.1, 3.2, 3.5, 10.4**
  
  - [ ]* 3.5 Write unit tests for authentication routes
    - Test login with valid username and password
    - Test login with valid phone and password
    - Test login with invalid password
    - Test login with non-existent user
    - Test login with inactive account
    - Test /api/auth/me with valid token
    - Test /api/auth/me without token (401)
    - Test logout endpoint
    - _Requirements: 3.1, 3.2, 3.5, 4.4, 7.2, 10.4_

- [ ] 4. Checkpoint - Ensure authentication tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create employee management API routes
  - [ ] 5.1 Implement POST /api/employees endpoint
    - Require admin role (use authenticateToken + requireAdmin)
    - Accept firstName, lastName, phoneNumber, permissions in request body
    - Validate input data
    - Generate unique username using generateUsername()
    - Generate temporary password using generatePassword()
    - Hash password using hashPassword()
    - Create user record with role='employee'
    - Return employee data and credentials (username, plaintext password)
    - Handle errors: 400 for validation, 409 for duplicate phone
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.5_
  
  - [ ] 5.2 Implement GET /api/employees endpoint
    - Require admin role
    - Fetch all users from database
    - Exclude passwordHash from response
    - Return array of employee objects
    - _Requirements: 6.1, 10.4_
  
  - [ ] 5.3 Implement GET /api/employees/:id endpoint
    - Require admin role
    - Fetch user by ID
    - Exclude passwordHash from response
    - Return employee object
    - Handle 404 if not found
    - _Requirements: 6.2, 10.4_
  
  - [ ] 5.4 Implement PUT /api/employees/:id endpoint
    - Require admin role
    - Accept firstName, lastName, phoneNumber, permissions, isActive in request body
    - Validate input data
    - Update user record
    - Exclude passwordHash from response
    - Return updated employee object
    - Handle errors: 404 if not found, 400 for validation
    - _Requirements: 2.2, 6.3_
  
  - [ ] 5.5 Implement DELETE /api/employees/:id endpoint (soft delete)
    - Require admin role
    - Set isActive = false instead of deleting
    - Prevent deleting admin users
    - Return success message
    - Handle errors: 404 if not found, 400 if trying to delete admin
    - _Requirements: 6.3_
  
  - [ ]* 5.6 Write property tests for employee management
    - **Property 1: Employee creation with complete data** - For any valid employee data, verify account is created with all required fields
    - **Property 6: Credentials returned on creation** - For any employee creation, verify response includes username and plaintext password
    - **Property 7: Duplicate phone number rejection** - For any existing phone number, verify duplicate creation fails
    - **Property 8: Permission assignment and persistence** - For any permission set, verify it's stored and retrievable
    - **Property 9: Permission updates apply immediately** - For any permission update, verify new permissions are stored and returned
    - **Property 10: Default empty permissions** - For any new employee without specified permissions, verify permissions array is empty
    - **Property 11: Role validation** - For any user record, verify role is only "admin" or "employee"
    - **Property 29: Employee list retrieval** - For any admin request, verify all employees are returned with correct fields
    - **Property 30: Employee detail retrieval** - For any employee ID, verify complete record including permissions is returned
    - **Property 31: Employee update persistence** - For any update request, verify changes are saved and reflected in queries
    - **Validates: Requirements 1.1, 1.5, 1.6, 2.1, 2.2, 2.5, 6.1, 6.2, 6.3, 11.4**
  
  - [ ]* 5.7 Write unit tests for employee management
    - Test creating employee with valid data
    - Test creating employee with duplicate phone (409)
    - Test creating employee with missing fields (400)
    - Test listing all employees (admin)
    - Test getting employee details (admin)
    - Test updating employee information
    - Test updating employee permissions
    - Test deactivating employee
    - Test non-admin accessing employee endpoints (403)
    - Test deleting admin user (400)
    - _Requirements: 1.1, 1.5, 1.6, 2.1, 2.2, 2.5, 6.1, 6.2, 6.3_

- [ ] 6. Register routes in server
  - [ ] 6.1 Create auth routes file and register in server/index.ts
    - Import auth routes
    - Register /api/auth/* routes
    - Ensure login endpoint is public (no auth middleware)
    - _Requirements: 9.5_
  
  - [ ] 6.2 Create employees routes file and register in server/index.ts
    - Import employees routes
    - Register /api/employees/* routes
    - All routes require authentication and admin role
    - _Requirements: 6.4_
  
  - [ ]* 6.3 Write integration tests for route registration
    - Test /api/auth/login is accessible without token
    - Test /api/auth/me requires token
    - Test /api/employees/* requires admin role
    - **Property 28: Public login endpoint** - Verify /api/auth/login doesn't require authentication
    - **Property 27: Protected endpoint authentication** - For any protected endpoint, verify requests without token are rejected with 401
    - **Validates: Requirements 9.1, 9.3, 9.5**

- [ ] 7. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Create shared types
  - [ ] 8.1 Add authentication types to shared/api.ts
    - Define User interface
    - Define UserProfile interface
    - Define LoginRequest interface
    - Define LoginResponse interface
    - Define CreateEmployeeRequest interface
    - Define CreateEmployeeResponse interface
    - Define UpdateEmployeeRequest interface
    - Define PERMISSIONS constant object
    - Define Permission type
    - _Requirements: All requirements (shared types)_

- [ ] 9. Implement frontend authentication context
  - [ ] 9.1 Create AuthContext with provider
    - Define AuthContextType interface (user, token, login, logout, isAuthenticated, isAdmin, hasPermission, loading)
    - Implement state management for user and token
    - Implement login() method that calls /api/auth/login and stores token/user
    - Implement logout() method that clears token/user and redirects
    - Implement isAuthenticated computed property
    - Implement isAdmin computed property
    - Implement hasPermission() method
    - Store token and user in localStorage
    - Load from localStorage on mount (auto-login)
    - Handle token expiration (decode JWT and check exp)
    - _Requirements: 3.1, 4.1, 4.4, 5.1, 5.2, 7.2, 7.3_
  
  - [ ]* 9.2 Write unit tests for AuthContext
    - Test login stores token and user
    - Test logout clears token and user
    - Test isAuthenticated returns true when token exists
    - Test isAdmin returns true for admin role
    - Test hasPermission returns true for admin
    - Test hasPermission checks permissions array for employee
    - Test auto-login from localStorage
    - Test token expiration handling
    - _Requirements: 3.1, 4.1, 4.4, 5.1, 5.2, 7.2, 7.3_

- [ ] 10. Create API client with authentication
  - [ ] 10.1 Create centralized API client (client/lib/api.ts)
    - Configure base URL and default headers
    - Implement request interceptor to add Authorization header with JWT token
    - Implement response interceptor to handle 401 errors (auto-logout and redirect)
    - Implement response interceptor to handle 403 errors (show access denied)
    - Export api.get(), api.post(), api.put(), api.delete() methods
    - _Requirements: 4.2, 4.3_
  
  - [ ]* 10.2 Write property tests for API client
    - **Property 21: Token inclusion in authenticated requests** - For any API request, verify JWT token is in Authorization header
    - **Property 20: Token storage on authentication** - For any successful login, verify token is stored in localStorage
    - **Property 22: Token removal on logout** - For any logout, verify token is removed from localStorage
    - **Validates: Requirements 4.1, 4.2, 4.4, 7.3**

- [ ] 11. Create login page
  - [ ] 11.1 Implement Login page component
    - Create form with username/phone input and password input
    - Implement form validation (required fields)
    - Call AuthContext.login() on submit
    - Display error messages from API
    - Show loading state during authentication
    - Redirect to dashboard on success
    - Prevent access if already authenticated
    - Style with TailwindCSS (centered card layout)
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 11.2 Write unit tests for Login page
    - Test form renders correctly
    - Test form validation
    - Test successful login redirects to dashboard
    - Test failed login shows error message
    - Test loading state during login
    - Test redirect if already authenticated
    - _Requirements: 3.1, 3.2_

- [ ] 12. Create protected route component
  - [ ] 12.1 Implement ProtectedRoute wrapper component
    - Accept children, requireAdmin, requirePermission props
    - Check AuthContext.isAuthenticated
    - Redirect to /login if not authenticated
    - Check admin requirement if requireAdmin=true
    - Check permission if requirePermission specified
    - Render children if authorized
    - Show "Access Denied" if insufficient permissions
    - _Requirements: 5.1, 5.2, 5.3, 8.1, 8.2, 8.3_
  
  - [ ]* 12.2 Write property tests for ProtectedRoute
    - **Property 33: Unauthenticated route redirection** - For any protected route without token, verify redirect to /login
    - **Property 34: Token validation on route access** - For any protected route, verify token validity is checked before rendering
    - **Property 23: Admin unrestricted access** - For any admin user, verify all routes are accessible
    - **Property 24: Employee permission enforcement** - For any employee, verify permission is checked before access
    - **Property 25: Access denial for missing permissions** - For any employee without permission, verify 403 error and access denial
    - **Validates: Requirements 5.1, 5.2, 5.3, 8.1, 8.2, 8.3**

- [ ] 13. Update App.tsx with authentication
  - [ ] 13.1 Wrap app with AuthProvider
    - Import and wrap entire app with AuthProvider
    - Add /login route (public)
    - Wrap existing routes with ProtectedRoute
    - Add appropriate permission requirements to routes
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 13.2 Write integration tests for route protection
    - Test unauthenticated user redirected to login
    - Test authenticated user can access protected routes
    - Test admin can access all routes
    - Test employee can only access permitted routes
    - **Property 33: Unauthenticated route redirection** - Verify all protected routes redirect when not authenticated
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ] 14. Checkpoint - Ensure frontend authentication works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Create dynamic navbar component
  - [ ] 15.1 Implement Navbar with permission-based rendering
    - Define navbarItems array with path, label, permission for each section
    - Filter items based on AuthContext.hasPermission()
    - Admin sees all items
    - Employee sees only permitted items
    - Add Employees link (visible only to admin)
    - Add user profile section with name and role
    - Add logout button in dropdown menu
    - Style with TailwindCSS
    - _Requirements: 5.4, 6.5, 7.1_
  
  - [ ]* 15.2 Write property tests for navbar rendering
    - **Property 26: Dynamic navbar rendering** - For any authenticated user, verify navbar only shows items they have permission for
    - **Property 32: User profile display** - For any authenticated user, verify profile shows firstName, lastName, phoneNumber, and role
    - **Validates: Requirements 5.4, 6.5, 7.1, 7.4**
  
  - [ ]* 15.3 Write unit tests for navbar
    - Test admin sees all navbar items
    - Test employee sees only permitted items
    - Test employees link only visible to admin
    - Test user profile displays correct information
    - Test logout button works
    - _Requirements: 5.4, 6.5, 7.1, 7.4_

- [ ] 16. Create employee management UI
  - [ ] 16.1 Create EmployeeModal component
    - Create form with firstName, lastName, phoneNumber inputs
    - Add permission checkboxes for all navbar sections
    - Implement form validation
    - Submit to POST /api/employees (create) or PUT /api/employees/:id (update)
    - Display generated credentials after creation (with copy functionality)
    - Show warning about saving credentials
    - Handle errors and display messages
    - Style with TailwindCSS
    - _Requirements: 1.1, 1.5, 2.1, 2.2, 6.3_
  
  - [ ] 16.2 Create Employees page component
    - Require admin role (wrap with ProtectedRoute requireAdmin)
    - Display table of employees (name, phone, role, status)
    - Add "Add Employee" button (opens EmployeeModal)
    - Add Edit and Deactivate action buttons per row
    - Implement search/filter functionality
    - Use React Query for data fetching
    - Handle loading and error states
    - Refetch after mutations
    - Style with TailwindCSS
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 16.3 Write unit tests for employee management UI
    - Test EmployeeModal renders form correctly
    - Test EmployeeModal validates inputs
    - Test EmployeeModal submits data correctly
    - Test credentials display after creation
    - Test Employees page renders table
    - Test Add Employee button opens modal
    - Test Edit button opens modal with data
    - Test Deactivate button works
    - Test non-admin cannot access page
    - _Requirements: 1.1, 1.5, 2.1, 2.2, 6.1, 6.2, 6.3, 6.4_

- [ ] 17. Add employees route to App.tsx
  - [ ] 17.1 Register /employees route
    - Import Employees page
    - Add route with ProtectedRoute requireAdmin
    - Add to navbar (admin only)
    - _Requirements: 6.4, 6.5_

- [ ] 18. Create database seed script for admin user
  - [ ] 18.1 Implement createAdminUser utility
    - Check if admin user already exists
    - If not, create admin user with default credentials
    - Use ADMIN_PASSWORD from environment or default
    - Hash password before storing
    - Log credentials to console
    - _Requirements: 1.1, 1.4_
  
  - [ ] 18.2 Call createAdminUser in database connection
    - Import and call after successful MongoDB connection
    - Handle errors gracefully
    - _Requirements: 1.1_

- [ ] 19. Final integration and testing
  - [ ] 19.1 End-to-end authentication flow test
    - Test admin creates employee
    - Test employee logs in with generated credentials
    - Test employee accesses permitted resources
    - Test employee denied access to unpermitted resources
    - Test employee logs out
    - Test employee cannot access protected resources after logout
    - _Requirements: All authentication and authorization requirements_
  
  - [ ] 19.2 End-to-end permission management flow test
    - Test admin creates employee with specific permissions
    - Test employee can access permitted sections
    - Test admin updates employee permissions
    - Test new permissions take effect immediately
    - Test old permissions no longer work
    - _Requirements: All permission management requirements_
  
  - [ ]* 19.3 Write security integration tests
    - Test expired tokens are rejected
    - Test invalid tokens are rejected
    - Test missing tokens are rejected
    - Test password hashes never exposed in API responses
    - Test admin-only endpoints reject non-admin users
    - Test permission checks work correctly on all endpoints
    - **Property 27: Protected endpoint authentication** - For all protected endpoints, verify authentication is required
    - **Property 23: Admin unrestricted access** - For admin user, verify access to all endpoints
    - **Property 24: Employee permission enforcement** - For employee user, verify permission checks on all endpoints
    - **Property 25: Access denial for missing permissions** - For employee without permission, verify access is denied
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 9.1, 9.3, 10.4**

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end flows and security
- All tests use Vitest and fast-check for property-based testing
- Backend tests in `server/**/__tests__/*.spec.ts`
- Frontend tests in `client/**/__tests__/*.spec.tsx`
- Each property test must reference its design document property number in a comment
