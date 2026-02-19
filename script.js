// This stores the current logged-in user (null = not logged in)
let currentUser = null;
// Flag to track if user just completed verification
let justVerified = false;
// This is the key we use to save data in localStorage
const STORAGE_KEY = "ipt_demo_v4";
// This is our "database" - stored in browser's localStorage
window.db = {};
//LOAD DATA FROM STORAGE
// It loads saved data or creates default data
function loadFromStorage() {
  // Try to get saved data from localStorage
  const rawData = localStorage.getItem(STORAGE_KEY);
  if (rawData) {
    // If data exists, parse it from JSON string to object
    try {
      window.db = JSON.parse(rawData);
    } catch (e) {
      // If data is corrupt, create default data
      seedDefaultData();
    }
  } else {
    // If no data exists, create default data
    seedDefaultData();
  }
}
// Create default data for new/corrupt storage
function seedDefaultData() {
  window.db = {
    // Default admin account
    accounts: [
      {
        firstName: "Admin",
        lastName: "Admin",
        email: "admin@example.com",
        password: "Password123!",
        role: "admin",
        verified: true
      }
    ],
    // Default departments
    departments: [
      { id: 1, name: "Engineering", description: "Software development team" },
      { id: 2, name: "HR", description: "Human resources team" }
    ],
    // Empty lists for employees and requests
    employees: [],
    requests: []
  };
  // Save the default data
  saveToStorage();
}

// SAVE DATA TO STORAGE
// This saves our database to localStorage
function saveToStorage() {
  // Convert object to JSON string and save
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// NAVIGATION (ROUTING)
// Change the URL hash to navigate to a page
function navigateTo(hash) {
  window.location.hash = hash;
}
// This function runs when URL hash changes
// It shows/hides pages based on the URL
function handleRouting() {
  // Get the current hash (default to "#/" if none)
  let hash = window.location.hash || "#/";
  // Hide all pages first
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });
  // Convert hash to page ID
  // Example: "#/login" becomes "login-page"
  const pageName = hash.replace("#/", "");
  const pageId = pageName + "-page";
  // Find the page element
  let page = document.getElementById(pageId);
  // If page not found, show home page
  if (!page) {
    page = document.getElementById("home-page");
  }
  // Handle verified message visibility
  // Only show "Email verified" message right after verification
  const verifiedMessage = document.getElementById("verified-message");
  if (verifiedMessage) {
    if (pageName === "login" && justVerified) {
      // Just verified - show the message
      verifiedMessage.style.display = "block";
      justVerified = false; // Reset flag
    } else {
      // Any other time - hide the message
      verifiedMessage.style.display = "none";
    }
  }
  // SECURITY: Check if user needs to be logged in
  const protectedPages = ["profile", "accounts", "employees", "department", "requests"];
  
  if (!currentUser && protectedPages.includes(pageName)) {
    // Not logged in - redirect to login
    navigateTo("#/login");
    return;
  }
  // SECURITY: Check if user needs admin role
  const adminOnlyPages = ["accounts", "employees", "department"];
  
  if (currentUser && currentUser.role !== "admin" && adminOnlyPages.includes(pageName)) {
    // Not admin - redirect to home
    navigateTo("#/");
    return;
  }
  // Show the page
  page.classList.add("active");
  
  // Call renderProfile() when navigating to #/profile
  if (pageName === "profile") {
    renderProfile();
  }
  // Call renderAccountsList() when navigating to #/accounts
  if (pageName === "accounts") {
    renderAccountsList();
  }
  // Call renderDepartmentsList() when navigating to #/department
  if (pageName === "department") {
    renderDepartmentsList();
  }
  // Call renderEmployeesTable() when navigating to #/employees
  if (pageName === "employees") {
    renderEmployeesTable();
  }
  // Call renderRequestsList() when navigating to #/requests
  if (pageName === "requests") {
    renderRequestsList();
  }
  // Show email on verify-email page
  if (pageName === "verify-email") {
    const verifyEmailDisplay = document.getElementById("verify-email-display");
    const unverifiedEmail = localStorage.getItem("unverified_email");
    if (verifyEmailDisplay && unverifiedEmail) {
      verifyEmailDisplay.innerText = unverifiedEmail;
    }
  }
}
// Listen for URL hash changes
window.addEventListener("hashchange", handleRouting);


// AUTHENTICATION STATE

// This updates the UI based on login state
function setAuthState(isLoggedIn, user = null) {
  // Store the current user
  currentUser = user;
  // Update body classes for CSS styling
  document.body.classList.toggle("authenticated", isLoggedIn);
  document.body.classList.toggle("not-authenticated", !isLoggedIn);

  // Add admin class if user is admin
  if (user && user.role === "admin") {
    document.body.classList.add("is-admin");
  } else {
    document.body.classList.remove("is-admin");
  }
  // Update navigation to show username
  const navUsername = document.getElementById("nav-username");
  if (navUsername && user) {
    navUsername.innerText = user.firstName;
  }
}

// LOGIN FUNCTION
function handleLogin() {
  // Get input values
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  // Validate inputs
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }
  // Find user by email only first (to check if account exists)
  const userByEmail = window.db.accounts.find(account => 
    account.email === email
  );
  if (!userByEmail) {
    alert("No account found with this email");
    return;
  }
  // Check if password matches
  if (userByEmail.password !== password) {
    alert("Incorrect password");
    return;
  }
  // Check if verified
  if (userByEmail.verified !== true) {
    alert("Account not verified. Please verify your email first.");
    return;
  }
  // Save a fake "auth token" (just the email)
  localStorage.setItem("auth_token", userByEmail.email);
  // Update the UI state
  setAuthState(true, userByEmail);
  // Navigate to profile page
  navigateTo("#/profile");
  alert("Login successful! Welcome, " + userByEmail.firstName);
}
// REGISTER FUNCTION
function handleRegister() {
  // Get input values
  const firstName = document.getElementById("reg-firstname").value;
  const lastName = document.getElementById("reg-lastname").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  // Validate inputs - check all fields are filled
  if (!firstName || !lastName || !email || !password) {
    alert("Please fill in all fields");
    return;
  }
  // Validate password minimum length (6 chars)
  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }
  // Check if email already exists
  const existingUser = window.db.accounts.find(account => 
    account.email === email
  );
  if (existingUser) {
    alert("Email already registered");
    return;
  }
  // Create new user with verified: false
  const newUser = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    role: "user", // Default role is "user"
    verified: false // Needs verification
  };
  // Add to database
  window.db.accounts.push(newUser);
  saveToStorage();
  // Store email in localStorage.unverified_email
  localStorage.setItem("unverified_email", email);
  // Navigate to verify-email page
  alert("Registration successful! Please verify your email.");
  navigateTo("#/verify-email");
}



// EMAIL VERIFICATION FUNCTION
function handleVerify() {
  // Get the unverified email from localStorage
  const unverifiedEmail = localStorage.getItem("unverified_email");
  
  if (!unverifiedEmail) {
    alert("No pending verification found. Please register first.");
    navigateTo("#/register");
    return;
  }
  // Find account by unverified_email
  const user = window.db.accounts.find(account => 
    account.email === unverifiedEmail
  );
  if (user) {
    // Set verified to true
    user.verified = true;
    saveToStorage();
    // Clear the unverified_email from localStorage
    localStorage.removeItem("unverified_email");
    // Set flag to show verified message on login page
    justVerified = true;
    alert("Email verified! You can now login with email: " + user.email);
    navigateTo("#/login");
  } else {
    alert("Account not found for email: " + unverifiedEmail + ". Please register again.");
    localStorage.removeItem("unverified_email");
    navigateTo("#/register");
  }
}
// LOGOUT FUNCTION
function handleLogout() {
  // Clear the auth token
  localStorage.removeItem("auth_token");
  // Reset the UI state
  setAuthState(false, null);
  // Navigate to home
  navigateTo("#/");
  alert("You have been logged out");
}
// PAGE INITIALIZATION
// This runs when the page finishes loading
document.addEventListener("DOMContentLoaded", function() {
  // Load data from storage
  loadFromStorage();
  // Check if user is already logged in (has auth token)
  const savedToken = localStorage.getItem("auth_token");
  if (savedToken) {
    // Find the user by email
    const user = window.db.accounts.find(account => 
      account.email === savedToken
    );
    if (user) {
      setAuthState(true, user);
    }
  }
  // Setup routing
  handleRouting();
  // Add click handlers to buttons
  setupButtonHandlers();
});




// BUTTON HANDLERS
function setupButtonHandlers() {
  // Get Started button - goes to register page
  const getStartedBtn = document.querySelector(".getstarted-btn");
  if (getStartedBtn) {
    getStartedBtn.onclick = function() {
      navigateTo("#/register");
    };
  }
  // Login button
  const loginBtn = document.querySelector("#login-page .btn-primary");
  if (loginBtn) {
    loginBtn.onclick = handleLogin;
  }
  // Register button
  const registerBtn = document.querySelector("#register-page .btn-success");
  if (registerBtn) {
    registerBtn.onclick = handleRegister;
  }
  // Verify button (updated to new page ID)
  const verifyBtn = document.querySelector("#verify-email-page .btn-success");
  if (verifyBtn) {
    verifyBtn.onclick = handleVerify;
  }
  // Navigation links
  setupNavigationLinks();
}
// NAVIGATION LINKS
function setupNavigationLinks() {
  // Login link in nav
  const loginLink = document.querySelector('.links a[href="#login"]');
  if (loginLink) {
    loginLink.onclick = function(e) {
      e.preventDefault();
      navigateTo("#/login");
    };
  }
  // Register link in nav
  const registerLink = document.querySelector('.links a[href="#register"]');
  if (registerLink) {
    registerLink.onclick = function(e) {
      e.preventDefault();
      navigateTo("#/register");
    };
  }
  // Handle logout link
  const logoutLink = document.querySelector(".dropdown-item[href='#logout']");
  if (logoutLink) {
    logoutLink.onclick = function(e) {
      e.preventDefault();
      handleLogout();
    };
  }
  // Setup dropdown menu navigation links using event delegation
  const dropdownMenu = document.querySelector('.nav-admin .dropdown-menu');
  if (dropdownMenu) {
    dropdownMenu.addEventListener('click', function(e) {
      const link = e.target.closest('.dropdown-item');
      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#') && href !== '#logout') {
          e.preventDefault();
          e.stopPropagation();
          const page = href.replace('#', '');
          navigateTo('#/' + page);
        }
      }
    });
  }
}
// HELPER FUNCTIONS (can be called from HTML onclick)
function goToRegister() {
  navigateTo("#/register");
}
function goToLogin() {
  navigateTo("#/login");
}
// RENDER PROFILE PAGE WITH USER DATA
function renderProfile() {
    // Only update if user is logged in
    if (!currentUser) return;
    // Get the profile content container
    const profileContent = document.getElementById("profile-content");
    if (profileContent) {
        // Build the HTML with dynamic user data
        // Displays user's name, email, role
        profileContent.innerHTML = `
            <h3>${currentUser.firstName} ${currentUser.lastName}</h3>
            <p><strong>Email: </strong><span>${currentUser.email}</span></p>
            <p><strong>Role: </strong><span>${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</span></p>
            <button class="btn btn-primary" onclick="showEditProfile()">Edit Profile</button>
        `;
    }
    // Hide edit form when showing profile
    const editForm = document.getElementById("profile-edit");
    if (editForm) {
        editForm.style.display = "none";
    }
}




// EDIT PROFILE FUNCTIONS
// Show the edit profile form
function showEditProfile() {
    if (!currentUser) return;
    // Populate the edit form with current user data
    document.getElementById("edit-firstname").value = currentUser.firstName;
    document.getElementById("edit-lastname").value = currentUser.lastName;
    document.getElementById("edit-email").value = currentUser.email;
    document.getElementById("edit-password").value = "";
    // Hide profile content, show edit form
    document.getElementById("profile-content").style.display = "none";
    document.getElementById("profile-edit").style.display = "block";
}
// Cancel editing and return to profile view
function cancelEditProfile() {
    document.getElementById("profile-content").style.display = "block";
    document.getElementById("profile-edit").style.display = "none";
}
// Save profile changes
function handleSaveProfile() {
    if (!currentUser) return;
    const firstName = document.getElementById("edit-firstname").value;
    const lastName = document.getElementById("edit-lastname").value;
    const newPassword = document.getElementById("edit-password").value;
    // Validate inputs
    if (!firstName || !lastName) {
        alert("First name and last name are required");
        return;
    }
    
    // Find the user in the database and update
    const userIndex = window.db.accounts.findIndex(account => 
        account.email === currentUser.email
    );
    
    if (userIndex !== -1) {
        // Update user data
        window.db.accounts[userIndex].firstName = firstName;
        window.db.accounts[userIndex].lastName = lastName;
        
        // Update password only if a new one was entered
        if (newPassword) {
            window.db.accounts[userIndex].password = newPassword;
        }
        
        // Save to localStorage
        saveToStorage();
        
        // Update currentUser
        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        if (newPassword) {
            currentUser.password = newPassword;
        }
        
        // Update nav username
        const navUsername = document.getElementById("nav-username");
        if (navUsername) {
            navUsername.innerText = firstName;
        }
        
        // Show profile content again
        document.getElementById("profile-content").style.display = "block";
        document.getElementById("profile-edit").style.display = "none";
        
        // Update the profile display
        renderProfile();
        
        alert("Profile updated successfully!");
    }
}





// EDIT PROFILE FUNCTIONS
// Show the edit profile form
function showEditProfile() {
    if (!currentUser) return;
    // Populate the edit form with current user data
    document.getElementById("edit-firstname").value = currentUser.firstName;
    document.getElementById("edit-lastname").value = currentUser.lastName;
    document.getElementById("edit-email").value = currentUser.email;
    document.getElementById("edit-password").value = "";
    // Hide profile content, show edit form
    document.getElementById("profile-content").style.display = "none";
    document.getElementById("profile-edit").style.display = "block";
}
// Cancel editing and return to profile view
function cancelEditProfile() {
    document.getElementById("profile-content").style.display = "block";
    document.getElementById("profile-edit").style.display = "none";
}
// Save profile changes
function handleSaveProfile() {
    if (!currentUser) return;
    const firstName = document.getElementById("edit-firstname").value;
    const lastName = document.getElementById("edit-lastname").value;
    const newPassword = document.getElementById("edit-password").value;
    // Validate inputs
    if (!firstName || !lastName) {
        alert("First name and last name are required");
        return;
    }
    
    // Find the user in the database and update
    const userIndex = window.db.accounts.findIndex(account => 
        account.email === currentUser.email
    );
    
    if (userIndex !== -1) {
        // Update user data
        window.db.accounts[userIndex].firstName = firstName;
        window.db.accounts[userIndex].lastName = lastName;
        
        // Update password only if a new one was entered
        if (newPassword) {
            window.db.accounts[userIndex].password = newPassword;
        }
        
        // Save to localStorage
        saveToStorage();
        
        // Update currentUser
        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        if (newPassword) {
            currentUser.password = newPassword;
        }
        
        // Update nav username
        const navUsername = document.getElementById("nav-username");
        if (navUsername) {
            navUsername.innerText = firstName;
        }
        
        // Show profile content again
        document.getElementById("profile-content").style.display = "block";
        document.getElementById("profile-edit").style.display = "none";
        
        // Update the profile display
        renderProfile();
        
        alert("Profile updated successfully!");
    }
}

// ACCOUNTS CRUD FUNCTIONS
// Render the accounts list table
function renderAccountsList() {
    const tableBody = document.getElementById("accounts-table-body");
    if (!tableBody) return;
    
    let html = "";
    
    for (let i = 0; i < window.db.accounts.length; i++) {
        const account = window.db.accounts[i];
        const fullName = account.firstName + " " + account.lastName;
        const verifiedText = account.verified ? "✓" : "—";
        const roleDisplay = account.role.charAt(0).toUpperCase() + account.role.slice(1);
        
        html += `
            <tr>
                <td>${fullName}</td>
                <td>${account.email}</td>
                <td>${roleDisplay}</td>
                <td>${verifiedText}</td>
                <td class="tb-btn-holder">
                    <button type="button" class="btn btn-outline-primary" onclick="editAccount('${account.email}')">Edit</button>
                    <button type="button" class="btn btn-outline-warning" onclick="resetAccountPassword('${account.email}')">Reset PW</button>
                    <button type="button" class="btn btn-outline-danger" onclick="deleteAccount('${account.email}')">Delete</button>
                </td>
            </tr>
        `;
    }
    
    tableBody.innerHTML = html;
}

// Show the Add Account form
function showAddAccountForm() {
    document.getElementById("account-form-title").innerText = "Add Account";
    document.getElementById("account-edit-email").value = "";
    document.getElementById("account-firstname").value = "";
    document.getElementById("account-lastname").value = "";
    document.getElementById("account-email").value = "";
    document.getElementById("account-email").readOnly = false;
    document.getElementById("account-password").value = "";
    document.getElementById("account-role").value = "user";
    document.getElementById("account-verified").checked = false;
    document.getElementById("account-form-container").style.display = "block";
}

// Edit an existing account
function editAccount(email) {
    const account = window.db.accounts.find(acc => acc.email === email);
    if (!account) return;
    
    document.getElementById("account-form-title").innerText = "Edit Account";
    document.getElementById("account-edit-email").value = email;
    document.getElementById("account-firstname").value = account.firstName;
    document.getElementById("account-lastname").value = account.lastName;
    document.getElementById("account-email").value = account.email;
    document.getElementById("account-email").readOnly = true;
    document.getElementById("account-password").value = "";
    document.getElementById("account-password").placeholder = "Leave blank to keep current";
    document.getElementById("account-role").value = account.role;
    document.getElementById("account-verified").checked = account.verified;
    document.getElementById("account-form-container").style.display = "block";
}

// Reset account password
function resetAccountPassword(email) {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }
    
    const account = window.db.accounts.find(acc => acc.email === email);
    if (account) {
        account.password = newPassword;
        saveToStorage();
        alert("Password reset successfully for " + email);
    }
}

// Delete an account
function deleteAccount(email) {
    // Prevent self-deletion
    if (currentUser && currentUser.email === email) {
        alert("You cannot delete your own account!");
        return;
    }
    
    if (!confirm("Are you sure you want to delete this account?")) return;
    
    const index = window.db.accounts.findIndex(acc => acc.email === email);
    if (index !== -1) {
        window.db.accounts.splice(index, 1);
        saveToStorage();
        renderAccountsList();
        alert("Account deleted successfully");
    }
}

// Save account (add or edit)
function handleSaveAccount() {
    const editEmail = document.getElementById("account-edit-email").value;
    const firstName = document.getElementById("account-firstname").value;
    const lastName = document.getElementById("account-lastname").value;
    const email = document.getElementById("account-email").value;
    const password = document.getElementById("account-password").value;
    const role = document.getElementById("account-role").value;
    const verified = document.getElementById("account-verified").checked;
    
    // Validate
    if (!firstName || !lastName || !email) {
        alert("First name, last name, and email are required");
        return;
    }
    
    if (editEmail === "") {
        // Adding new account
        if (!password || password.length < 6) {
            alert("Password is required and must be at least 6 characters");
            return;
        }
        
        // Check if email exists
        const exists = window.db.accounts.find(acc => acc.email === email);
        if (exists) {
            alert("Email already exists");
            return;
        }
        
        // Add new account
        window.db.accounts.push({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            role: role,
            verified: verified
        });
    } else {
        // Editing existing account
        const account = window.db.accounts.find(acc => acc.email === editEmail);
        if (account) {
            account.firstName = firstName;
            account.lastName = lastName;
            account.role = role;
            account.verified = verified;
            
            // Only update password if provided
            if (password && password.length >= 6) {
                account.password = password;
            }
        }
    }
    
    saveToStorage();
    hideAccountForm();
    renderAccountsList();
    alert("Account saved successfully");
}

// Hide the account form
function hideAccountForm() {
    document.getElementById("account-form-container").style.display = "none";
}


// DEPARTMENTS CRUD FUNCTIONS
// Render the departments list table
function renderDepartmentsList() {
    const tableBody = document.getElementById("departments-table-body");
    if (!tableBody) return;
    
    let html = "";
    
    for (let i = 0; i < window.db.departments.length; i++) {
        const dept = window.db.departments[i];
        
        html += `
            <tr>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td class="tb-btn-holder">
                    <button type="button" class="btn btn-outline-primary" onclick="editDepartment(${dept.id})">Edit</button>
                    <button type="button" class="btn btn-outline-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
                </td>
            </tr>
        `;
    }
    
    tableBody.innerHTML = html;
}

// Show Add Department form (placeholder)
function showAddDepartmentForm() {
    alert("Not implemented");
}

// Edit Department (placeholder)
function editDepartment(id) {
    alert("Not implemented");
}

// Delete Department
function deleteDepartment(id) {
    if (!confirm("Are you sure you want to delete this department?")) return;
    
    const index = window.db.departments.findIndex(dept => dept.id === id);
    if (index !== -1) {
        window.db.departments.splice(index, 1);
        saveToStorage();
        renderDepartmentsList();
        alert("Department deleted successfully");
    }
}

// EMPLOYEES CRUD FUNCTIONS
// Render the employees list table
function renderEmployeesTable() {
    const tableBody = document.getElementById("employees-table-body");
    if (!tableBody) return;
    
    let html = "";
    
    for (let i = 0; i < window.db.employees.length; i++) {
        const emp = window.db.employees[i];
        
        // Find the account email
        const account = window.db.accounts.find(acc => acc.email === emp.userEmail);
        const displayName = account ? (account.firstName + " " + account.lastName) : emp.userEmail;
        
        // Find the department name - compare as strings to handle both number and string IDs
        const dept = window.db.departments.find(d => String(d.id) === String(emp.departmentId));
        const deptName = dept ? dept.name : "—";
        
        html += `
            <tr>
                <th scope="row">${emp.id}</th>
                <td>${emp.userEmail}</td>
                <td>${emp.position}</td>
                <td>${deptName}</td>
                <td class="tb-btn-holder">
                    <button type="button" class="btn btn-outline-primary" onclick="editEmployee('${emp.id}')">Edit</button>
                    <button type="button" class="btn btn-outline-danger" onclick="deleteEmployee('${emp.id}')">Delete</button>
                </td>
            </tr>
        `;
    }
    
    tableBody.innerHTML = html;
}
// Populate department dropdown
function populateDepartmentDropdown() {
    const select = document.getElementById("emp-department");
    if (!select) return;
    
    let html = '<option value="">Select Department</option>';
    
    for (let i = 0; i < window.db.departments.length; i++) {
        const dept = window.db.departments[i];
        html += `<option value="${dept.id}">${dept.name}</option>`;
    }
    
    select.innerHTML = html;
}

// Show Add Employee form
function showAddEmployeeForm() {
    document.getElementById("employee-form-title").innerText = "Add Employee";
    document.getElementById("employee-edit-id").value = "";
    document.getElementById("emp-id").value = "";
    document.getElementById("emp-id").readOnly = false;
    document.getElementById("emp-email").value = "";
    document.getElementById("emp-position").value = "";
    document.getElementById("emp-date").value = "";
    populateDepartmentDropdown();
    document.getElementById("employee-form-container").style.display = "block";
}
// Edit an existing employee
function editEmployee(id) {
    const emp = window.db.employees.find(e => e.id === id);
    if (!emp) return;
    
    document.getElementById("employee-form-title").innerText = "Edit Employee";
    document.getElementById("employee-edit-id").value = id;
    document.getElementById("emp-id").value = emp.id;
    document.getElementById("emp-id").readOnly = true;
    document.getElementById("emp-email").value = emp.userEmail;
    document.getElementById("emp-position").value = emp.position;
    document.getElementById("emp-date").value = emp.hireDate || "";
    populateDepartmentDropdown();
    document.getElementById("emp-department").value = emp.departmentId || "";
    document.getElementById("employee-form-container").style.display = "block";
}
// Delete an employee
function deleteEmployee(id) {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    
    const index = window.db.employees.findIndex(e => e.id === id);
    if (index !== -1) {
        window.db.employees.splice(index, 1);
        saveToStorage();
        renderEmployeesTable();
        alert("Employee deleted successfully");
    }
}
// Save employee (add or edit)
function handleSaveEmployee() {
    const editId = document.getElementById("employee-edit-id").value;
    const empId = document.getElementById("emp-id").value;
    const userEmail = document.getElementById("emp-email").value;
    const position = document.getElementById("emp-position").value;
    const departmentId = document.getElementById("emp-department").value;
    const hireDate = document.getElementById("emp-date").value;
    
    // Validate
    if (!empId || !userEmail || !position) {
        alert("Employee ID, User Email, and Position are required");
        return;
    }
    // Check if user email matches existing account
    const account = window.db.accounts.find(acc => acc.email === userEmail);
    if (!account) {
        alert("User email must match an existing account");
        return;
    }
    if (editId === "") {
        // Adding new employee
        // Check if employee ID already exists
        const exists = window.db.employees.find(e => e.id === empId);
        if (exists) {
            alert("Employee ID already exists");
            return;
        }
        // Add new employee
        window.db.employees.push({
            id: empId,
            userEmail: userEmail,
            position: position,
            departmentId: departmentId,
            hireDate: hireDate
        });
    } else {
        // Editing existing employee
        const emp = window.db.employees.find(e => e.id === editId);
        if (emp) {
            emp.userEmail = userEmail;
            emp.position = position;
            emp.departmentId = departmentId;
            emp.hireDate = hireDate;
        }
    }
    saveToStorage();
    hideEmployeeForm();
    renderEmployeesTable();
    alert("Employee saved successfully");
}
// Hide the employee form
function hideEmployeeForm() {
    document.getElementById("employee-form-container").style.display = "none";
}
