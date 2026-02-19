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
