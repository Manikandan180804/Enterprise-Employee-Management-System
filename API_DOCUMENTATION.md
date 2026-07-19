# Enterprise EMS API Documentation

Welcome to the API documentation for the Enterprise Employee Management System (EMS). All endpoints are prefixed with `/api`.

---

## 🔒 Authentication & Security

The system uses standard JSON Web Token (JWT) authentication:
1. **Access Tokens**: Short-lived (15 minutes), passed inside HTTP headers (`Authorization: Bearer <token>`) or stored in secured browser cookies.
2. **Refresh Tokens**: Long-lived (7 days), stored in secure `HttpOnly` and `SameSite` cookies to mitigate XSS and CSRF attacks.

### Access Levels:
- **Public**: No authentication required.
- **Authenticated**: Any valid logged-in user (`SUPER_ADMIN`, `HR_MANAGER`, `EMPLOYEE`).
- **HR/Admin**: Gated to `SUPER_ADMIN` and `HR_MANAGER` roles.
- **Admin Only**: Restricted strictly to `SUPER_ADMIN`.
- **Owner or HR/Admin**: Allows the owner of the resource (matching token `userId` to target `id`) OR users with administrative roles to access the resource.

---

## 📂 Auth Endpoints

### 1. User Login
Authenticates a user and sets cookies for subsequent requests.

- **Method / Route**: `POST /api/auth/login`
- **Access**: Public
- **Request Body** (`application/json`):
  ```json
  {
    "email": "sarah.johnson@ems.com",
    "password": "Hr@123456"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "data": {
      "user": {
        "id": "6a5c92452f8da033241fb9ec",
        "email": "sarah.johnson@ems.com",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "role": "HR_MANAGER",
        "profileImageUrl": null,
        "department": "Human Resources",
        "designation": "HR Manager"
      }
    }
  }
  ```
- **Error Response** (`401 Unauthorized`):
  ```json
  {
    "success": false,
    "message": "Invalid email or password"
  }
  ```

---

### 2. User Logout
Invalidates the current session and clears authorization cookies.

- **Method / Route**: `POST /api/auth/logout`
- **Access**: Authenticated
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### 3. Token Rotation (Refresh)
Refreshes the access token using the HttpOnly refresh token cookie.

- **Method / Route**: `POST /api/auth/refresh`
- **Access**: Public (requires cookie payload)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

---

### 4. Current User Session
Returns details of the currently logged-in user.

- **Method / Route**: `GET /api/auth/me`
- **Access**: Authenticated
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "6a5c92452f8da033241fb9ec",
        "email": "sarah.johnson@ems.com",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "role": "HR_MANAGER"
      }
    }
  }
  ```

---

## 👥 Employee Endpoints

### 1. List Employees
Retrieve a list of active (non-deleted) employees. Supports filtering, searching, sorting, and pagination.

- **Method / Route**: `GET /api/employees`
- **Access**: HR/Admin
- **Query Parameters** (all optional):
  - `page`: Page number (default: `1`)
  - `limit`: Records per page (default: `10`)
  - `search`: Search query matching name, email, employeeId, or designation
  - `department`: Filter by department ID
  - `role`: Filter by role (`SUPER_ADMIN`, `HR_MANAGER`, `EMPLOYEE`)
  - `status`: Filter by status (`ACTIVE`, `INACTIVE`, `ON_LEAVE`)
  - `sortBy`: Field to sort by (default: `createdAt`)
  - `order`: Sort order (`asc` or `desc`, default: `desc`)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6a5c92452f8da033241fb9ec",
        "employeeId": "EMP002",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "email": "sarah.johnson@ems.com",
        "phone": "+1-555-0192",
        "designation": "HR Manager",
        "salary": 75000,
        "joiningDate": "2023-03-15T00:00:00.000Z",
        "status": "ACTIVE",
        "role": "HR_MANAGER",
        "profileImageUrl": null,
        "department": {
          "id": "6a5c92442f8da033241fb9e7",
          "name": "Human Resources"
        },
        "manager": {
          "id": "6a5c92452f8da033241fb9eb",
          "firstName": "System",
          "lastName": "Administrator",
          "employeeId": "EMP001"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
  ```

---

### 2. Create Employee
Registers a new employee and creates their system user account login.

- **Method / Route**: `POST /api/employees`
- **Access**: HR/Admin
- **Request Body** (`application/json`):
  ```json
  {
    "employeeId": "EMP009",
    "firstName": "Emma",
    "lastName": "Watson",
    "email": "emma.watson@ems.com",
    "password": "Welcome@123",
    "phone": "+1-555-0987",
    "designation": "Frontend Engineer",
    "salary": 68000,
    "joiningDate": "2026-07-19T00:00:00.000Z",
    "status": "ACTIVE",
    "role": "EMPLOYEE",
    "departmentId": "6a5c92442f8da033241fb9e6",
    "managerId": "6a5c92452f8da033241fb9ed"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "id": "6a5c92582f8da033241fc8fd",
      "employeeId": "EMP009",
      "email": "emma.watson@ems.com"
    },
    "message": "Employee created successfully"
  }
  ```

---

### 3. Get Employee Details
Fetches detailed info for a single employee record.

- **Method / Route**: `GET /api/employees/:id`
- **Access**: Owner or HR/Admin
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "6a5c92582f8da033241fc8fd",
      "employeeId": "EMP009",
      "firstName": "Emma",
      "lastName": "Watson",
      "email": "emma.watson@ems.com",
      "phone": "+1-555-0987",
      "designation": "Frontend Engineer",
      "salary": 68000,
      "joiningDate": "2026-07-19T00:00:00.000Z",
      "status": "ACTIVE",
      "role": "EMPLOYEE",
      "profileImageUrl": null,
      "department": { "id": "6a5c92442f8da033241fb9e6", "name": "Engineering" },
      "manager": { "id": "6a5c92452f8da033241fb9ed", "firstName": "John", "lastName": "Doe" }
    }
  }
  ```

---

### 4. Update Employee
Modifies details of an existing employee record. Gated field permissions apply depending on the user's role.

- **Method / Route**: `PUT /api/employees/:id`
- **Access**: Owner or HR/Admin
- **Request Body** (partial updates allowed):
  ```json
  {
    "phone": "+1-555-9999",
    "designation": "Senior Frontend Engineer"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "6a5c92582f8da033241fc8fd",
      "phone": "+1-555-9999",
      "designation": "Senior Frontend Engineer"
    }
  }
  ```

---

### 5. Delete Employee (Soft-Delete)
Sets the `isDeleted` flag to `true` and deactivates the employee login profile.

- **Method / Route**: `DELETE /api/employees/:id`
- **Access**: Admin Only
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Employee deleted successfully"
  }
  ```

---

### 6. Get Direct Reports
Fetches a list of all employees reporting directly to the specified manager.

- **Method / Route**: `GET /api/employees/:id/reportees` (Alias: `GET /api/employees/:id/reports`)
- **Access**: HR/Admin
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6a5c92452f8da033241fb9ed",
        "employeeId": "EMP003",
        "firstName": "John",
        "lastName": "Doe",
        "designation": "Engineering Manager"
      }
    ]
  }
  ```

---

### 7. Update Reporting Manager
Assigns a new manager to the employee. Includes cycle validation to check for reporting loops.

- **Method / Route**: `PATCH /api/employees/:id/manager`
- **Access**: HR/Admin
- **Request Body**:
  ```json
  {
    "managerId": "6a5c92452f8da033241fb9ec"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Reporting manager updated successfully"
  }
  ```
- **Error Response** (`400 Bad Request`):
  ```json
  {
    "success": false,
    "message": "This would create a circular reporting relationship"
  }
  ```

---

### 8. Upload Profile Image
Uploads and attaches a profile avatar file to the employee.

- **Method / Route**: `POST /api/employees/:id/upload-image`
- **Access**: Owner or HR/Admin
- **Request Body** (`multipart/form-data`):
  - Form key: `image` (valid extensions: `.jpg`, `.jpeg`, `.png`)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "profileImageUrl": "/uploads/profile-178445212356.png"
    }
  }
  ```

---

### 9. Bulk Import Employees
Imports multiple employees via a uploaded CSV file. Auto-creates login usernames with default credentials and flags duplicate email/IDs.

- **Method / Route**: `POST /api/employees/import`
- **Access**: HR/Admin
- **Request Body** (`multipart/form-data`):
  - Form key: `file` (valid extension: `.csv`)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Successfully imported 3 employees.",
    "importedCount": 3,
    "errorsCount": 1,
    "errors": [
      "Row 3: Employee ID or Email already exists"
    ]
  }
  ```

---

### 10. Export Employees
Downloads a CSV spreadsheet containing all active employees.

- **Method / Route**: `GET /api/employees/export`
- **Access**: HR/Admin
- **Response** (`200 OK`, file download stream):
  - **Headers**:
    - `Content-Type: text/csv`
    - `Content-Disposition: attachment; filename=employees_export_<timestamp>.csv`

---

## 📈 Dashboard Endpoints

### 1. Get Dashboard Summary Statistics
Fetches numbers of active/inactive staff, counts of departments, role/department breakdowns, and monthly hiring counts.

- **Method / Route**: `GET /api/dashboard/stats`
- **Access**: HR/Admin
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "overview": {
        "total": 8,
        "active": 8,
        "inactive": 0,
        "onLeave": 0,
        "departmentsCount": 6
      },
      "roles": [
        { "role": "EMPLOYEE", "count": 6 },
        { "role": "HR_MANAGER", "count": 1 },
        { "role": "SUPER_ADMIN", "count": 1 }
      ],
      "departments": [
        { "department": "Engineering", "count": 4 },
        { "department": "Sales", "count": 2 }
      ],
      "recentHires": [
        {
          "id": "6a5c92452f8da033241fb9ee",
          "firstName": "Michael",
          "lastName": "Chen",
          "designation": "Software Developer",
          "profileImageUrl": null,
          "createdAt": "2026-07-19T09:05:41.272Z",
          "department": { "name": "Engineering" }
        }
      ],
      "monthlyHires": [
        { "month": "Feb 2026", "count": 0 },
        { "month": "Mar 2026", "count": 2 },
        { "month": "Apr 2026", "count": 1 },
        { "month": "May 2026", "count": 3 },
        { "month": "Jun 2026", "count": 1 },
        { "month": "Jul 2026", "count": 1 }
      ]
    }
  }
  ```

---

## 🌳 Organization Endpoints

### 1. Get Complete Organization Chart Tree
Traverses the reporting manager linkages recursively to construct a complete node chart.

- **Method / Route**: `GET /api/organization/tree` (Alias: `GET /api/org/tree`)
- **Access**: Authenticated
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "6a5c92452f8da033241fb9eb",
      "employeeId": "EMP001",
      "firstName": "System",
      "lastName": "Administrator",
      "designation": "Super Admin",
      "profileImageUrl": null,
      "department": null,
      "children": [
        {
          "id": "6a5c92452f8da033241fb9ec",
          "employeeId": "EMP002",
          "firstName": "Sarah",
          "lastName": "Johnson",
          "designation": "HR Manager",
          "profileImageUrl": null,
          "department": { "id": "6a5c92442f8da033241fb9e7", "name": "Human Resources" },
          "children": []
        }
      ]
    }
  }
  ```

---

### 2. Get Sub-Tree from specific Employee
Generates the organization reporting subtree rooted at a specific employee node.

- **Method / Route**: `GET /api/organization/tree/:id` (Alias: `GET /api/org/tree/:id`)
- **Access**: Authenticated
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "6a5c92452f8da033241fb9ec",
      "employeeId": "EMP002",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "designation": "HR Manager",
      "children": []
    }
  }
  ```

---

## 🏢 Department Endpoints

### 1. List Departments
List all created departments, including counts of active staff members assigned.

- **Method / Route**: `GET /api/departments`
- **Access**: Authenticated
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6a5c92442f8da033241fb9e6",
        "name": "Engineering",
        "description": "Product engineering department",
        "_count": { "employees": 4 }
      }
    ]
  }
  ```

---

### 2. Create Department
Registers a new department.

- **Method / Route**: `POST /api/departments`
- **Access**: Admin Only
- **Request Body**:
  ```json
  {
    "name": "Quality Assurance",
    "description": "Software QA and testing"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "id": "6a5c92882f8da033241fc9ff",
      "name": "Quality Assurance",
      "description": "Software QA and testing"
    }
  }
  ```

---

### 3. Update Department
Modifies metadata of an existing department.

- **Method / Route**: `PUT /api/departments/:id`
- **Access**: Admin Only
- **Request Body**:
  ```json
  {
    "description": "QA, automation, and performance testing"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "id": "6a5c92882f8da033241fc9ff",
      "name": "Quality Assurance",
      "description": "QA, automation, and performance testing"
    }
  }
  ```

---

### 4. Delete Department
Removes a department. Employee records assigned to this department are automatically unassigned.

- **Method / Route**: `DELETE /api/departments/:id`
- **Access**: Admin Only
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Department deleted successfully"
  }
  ```
