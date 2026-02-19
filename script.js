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

