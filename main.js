const favoriteBtn = document.getElementById('favorite-btn');
const BASE_URL = 'https://media2.edu.metropolia.fi/restaurant/api/v1';

let currentRestaurantId = null;
let currentRestaurantName = '';
let currentView = 'daily';

const restaurantList = document.getElementById('restaurant-list');
const menuDisplay = document.getElementById('menu-display');
const menuControls = document.getElementById('menu-controls');
const restaurantNameTitle = document.getElementById('restaurant-name-title');
const btnDaily = document.getElementById('btn-daily');
const btnWeekly = document.getElementById('btn-weekly');
const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const authSection = document.getElementById('auth-section');
const userInfo = document.getElementById('user-info');
const welcomeText = document.getElementById('welcome-text');
const logoutBtn = document.getElementById('logout-btn');

function checkAuth() {
  const token = localStorage.getItem('userToken');
  const userDataString = localStorage.getItem('userData');

  if (token && userDataString) {
    const userData = JSON.parse(userDataString);
    authSection.classList.add('hidden');
    userInfo.classList.remove('hidden');
    welcomeText.textContent = `Welcome, ${userData.username}`;
  } else {
    authSection.classList.remove('hidden');
    userInfo.classList.add('hidden');
    welcomeText.textContent = '';
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('userToken', data.token);
    localStorage.setItem('userData', JSON.stringify(data.data));

    authMessage.textContent = '';
    loginForm.reset();
    checkAuth();
  } catch (error) {
    authMessage.style.color = '#ffb3b3';
    authMessage.textContent = error.message;
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  checkAuth();
});

const registerBtn = document.getElementById('register-btn');

registerBtn.addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const email = document.getElementById('email').value;

  if (!username || !password || !email) {
    authMessage.style.color = '#ffb3b3';
    authMessage.textContent = 'Enter a username, password, and email to register.';
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Registration failed');

    authMessage.style.color = 'lightgreen';
    authMessage.textContent = 'Registration successful! You can now click Login.';
  } catch (error) {
    authMessage.style.color = '#ffb3b3';
    authMessage.textContent = error.message;
  }
});

async function loadRestaurants() {
  try {
    const response = await fetch(`${BASE_URL}/restaurants`);
    const data = await response.json();

    data.forEach(restaurant => {
      const li = document.createElement('li');
      li.textContent = `${restaurant.name} (${restaurant.city})`;
      li.dataset.id = restaurant._id;

      li.addEventListener('click', () => {
        document.querySelectorAll('#restaurant-list li').forEach(el => el.classList.remove('selected'));
        li.classList.add('selected');

        currentRestaurantId = restaurant._id;
        currentRestaurantName = restaurant.name;
        restaurantNameTitle.textContent = currentRestaurantName;
        favoriteBtn.style.display = 'block';
        menuControls.classList.remove('hidden');

        loadMenu();
      });

      restaurantList.appendChild(li);
    });
  } catch (error) {
    restaurantList.innerHTML = '<li>Error loading restaurants.</li>';
  }
}

async function loadMenu() {
  if (!currentRestaurantId) return;
  menuDisplay.innerHTML = '<p>Loading menu...</p>';

  try {
    if (currentView === 'daily') {
      const response = await fetch(`${BASE_URL}/restaurants/daily/${currentRestaurantId}/en`);
      const data = await response.json();
      renderDailyMenu(data);
    } else {
      const response = await fetch(`${BASE_URL}/restaurants/weekly/${currentRestaurantId}/en`);
      const data = await response.json();
      renderWeeklyMenu(data);
    }
  } catch (error) {
    menuDisplay.innerHTML = '<p>Error loading menu data.</p>';
  }
}

function renderDailyMenu(data) {
  if (!data.courses || data.courses.length === 0) {
    menuDisplay.innerHTML = '<p>No daily menu available for this location today.</p>';
    return;
  }

  let html = '<h3>Today\'s Menu</h3>';
  data.courses.forEach(course => {
    html += `
      <div class="course-card">
        <h4>${course.name || 'Unknown Course'}</h4>
        <p class="price">${course.price || 'Price not listed'}</p>
        <p><em>Diets: ${course.diets || 'None specified'}</em></p>
      </div>
    `;
  });
  menuDisplay.innerHTML = html;
}

function renderWeeklyMenu(data) {
  if (!data.days || data.days.length === 0) {
    menuDisplay.innerHTML = '<p>No weekly menu available for this location.</p>';
    return;
  }

  let html = '<h3>Weekly Menu</h3>';
  data.days.forEach(day => {
    html += `<div class="day-card"><h4>${day.date}</h4>`;
    if (day.courses && day.courses.length > 0) {
      day.courses.forEach(course => {
        html += `
          <div style="margin-bottom: 10px;">
            <strong>${course.name}</strong> - <span class="price">${course.price}</span>
            <br><small>${course.diets}</small>
          </div>
        `;
      });
    } else {
      html += '<p>No courses available on this day.</p>';
    }
    html += `</div>`;
  });
  menuDisplay.innerHTML = html;
}

btnDaily.addEventListener('click', () => {
  currentView = 'daily';
  btnDaily.classList.add('active');
  btnWeekly.classList.remove('active');
  loadMenu();
});

btnWeekly.addEventListener('click', () => {
  currentView = 'weekly';
  btnWeekly.classList.add('active');
  btnDaily.classList.remove('active');
  loadMenu();
});

favoriteBtn.addEventListener('click', async () => {
  const token = localStorage.getItem('userToken');

  if (!token) {
    alert('You must be logged in to favorite a restaurant!');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ favouriteRestaurant: currentRestaurantId })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Failed to update favorite');
    const userData = JSON.parse(localStorage.getItem('userData'));
    userData.favouriteRestaurant = currentRestaurantId;
    localStorage.setItem('userData', JSON.stringify(userData));

    alert(`Successfully set ${currentRestaurantName} as your favorite restaurant!`);
  } catch (error) {
    alert(error.message);
  }
});

checkAuth();
loadRestaurants();