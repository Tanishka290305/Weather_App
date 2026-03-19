// =====================================
// WEATHER STATION - MAIN JAVASCRIPT
// =====================================

// API Configuration
// Get your free API key from: https://openweathermap.org/api
const API_KEY = '4a2cdeeb323cba4f283f4926c8cf5c79'; // Replace with your actual API key
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Global state
let currentWeatherData = null;
let isCelsius = true;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const weatherDisplay = document.getElementById('weatherDisplay');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const welcomeState = document.getElementById('welcomeState');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');

// Weather icon mapping
const weatherIcons = {
    // Clear
    '01d': '☀️',
    '01n': '🌙',
    // Clouds
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    // Rain
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    // Thunderstorm
    '11d': '⛈️',
    '11n': '⛈️',
    // Snow
    '13d': '❄️',
    '13n': '❄️',
    // Mist/Fog
    '50d': '🌫️',
    '50n': '🌫️'
};

// =====================================
// EVENT LISTENERS
// =====================================

// Search button click
searchBtn.addEventListener('click', handleSearch);

// Enter key in input
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Location button
locationBtn.addEventListener('click', handleLocationRequest);

// Temperature unit toggles
celsiusBtn.addEventListener('click', () => switchTempUnit(true));
fahrenheitBtn.addEventListener('click', () => switchTempUnit(false));

// Retry button
retryBtn.addEventListener('click', handleRetry);

// =====================================
// MAIN FUNCTIONS
// =====================================

/**
 * Handle city search
 */
function handleSearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    fetchWeatherByCity(city);
}

/**
 * Handle geolocation request
 */
function handleLocationRequest() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoordinates(latitude, longitude);
        },
        (error) => {
            let message = 'Unable to retrieve your location';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Location access denied. Please enable location services.';
            }
            showError(message);
        }
    );
}

/**
 * Fetch weather data by city name
 */
async function fetchWeatherByCity(city) {
    showLoading();
    
    try {
        const url = `${API_BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else if (response.status === 401) {
                throw new Error('Invalid API key. Please check your configuration.');
            } else {
                throw new Error('Unable to fetch weather data. Please try again later.');
            }
        }
        
        const data = await response.json();
        currentWeatherData = data;
        displayWeather(data);
        
    } catch (error) {
        showError(error.message);
        console.error('Weather fetch error:', error);
    }
}

/**
 * Fetch weather data by coordinates
 */
async function fetchWeatherByCoordinates(lat, lon) {
    try {
        const url = `${API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Unable to fetch weather data for your location.');
        }
        
        const data = await response.json();
        currentWeatherData = data;
        displayWeather(data);
        
    } catch (error) {
        showError(error.message);
        console.error('Weather fetch error:', error);
    }
}

/**
 * Apply weather-based background animation
 */
function applyWeatherBackground(weatherMain) {
    // Remove all weather classes
    document.body.classList.remove('weather-clear', 'weather-cloudy', 'weather-rainy', 'weather-thunder', 'weather-snow', 'weather-fog');
    
    // Map weather conditions to animation classes
    const weatherMap = {
        'Clear': 'weather-clear',
        'Sunny': 'weather-clear',
        'Clouds': 'weather-cloudy',
        'Overcast': 'weather-cloudy',
        'Rain': 'weather-rainy',
        'Drizzle': 'weather-rainy',
        'Thunderstorm': 'weather-thunder',
        'Snow': 'weather-snow',
        'Mist': 'weather-fog',
        'Smoke': 'weather-fog',
        'Haze': 'weather-fog',
        'Dust': 'weather-fog',
        'Fog': 'weather-fog',
        'Sand': 'weather-fog',
        'Ash': 'weather-fog',
        'Squall': 'weather-rainy',
        'Tornado': 'weather-thunder'
    };
    
    const weatherClass = weatherMap[weatherMain] || 'weather-clear';
    document.body.classList.add(weatherClass);
}

/**
 * Display weather data in the UI
 */
function displayWeather(data) {
    // Apply weather-based background animation
    applyWeatherBackground(data.weather[0].main);
    
    // Update city name and local time
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('localTime').textContent = formatLocalTime(data.timezone);
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    document.getElementById('weatherIcon').textContent = weatherIcons[iconCode] || '🌤️';
    
    // Update temperature
    const temp = isCelsius ? data.main.temp : celsiusToFahrenheit(data.main.temp);
    document.getElementById('temperature').textContent = Math.round(temp);
    
    // Update weather description
    document.getElementById('weatherDesc').textContent = data.weather[0].description;
    
    // Update feels like
    const feelsLike = isCelsius ? data.main.feels_like : celsiusToFahrenheit(data.main.feels_like);
    document.getElementById('feelsLike').textContent = `Feels like ${Math.round(feelsLike)}°`;
    
    // Update detail cards
    document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    
    // Update sunrise and sunset
    document.getElementById('sunrise').textContent = formatTime(data.sys.sunrise, data.timezone);
    document.getElementById('sunset').textContent = formatTime(data.sys.sunset, data.timezone);
    
    // Update min/max temps
    const tempMin = isCelsius ? data.main.temp_min : celsiusToFahrenheit(data.main.temp_min);
    const tempMax = isCelsius ? data.main.temp_max : celsiusToFahrenheit(data.main.temp_max);
    document.getElementById('tempMin').textContent = `${Math.round(tempMin)}°`;
    document.getElementById('tempMax').textContent = `${Math.round(tempMax)}°`;
    
    // Update clouds
    document.getElementById('clouds').textContent = `${data.clouds.all}%`;
    
    // Update last updated time
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
    
    // Show weather display
    hideAllStates();
    weatherDisplay.classList.remove('hidden');
}

/**
 * Switch temperature unit
 */
function switchTempUnit(celsius) {
    if (isCelsius === celsius) return;
    
    isCelsius = celsius;
    
    // Update button states
    celsiusBtn.classList.toggle('active', celsius);
    fahrenheitBtn.classList.toggle('active', !celsius);
    
    // Update unit display
    document.querySelector('.temp-unit').textContent = celsius ? '°C' : '°F';
    
    // Refresh display if we have data
    if (currentWeatherData) {
        displayWeather(currentWeatherData);
    }
}

/**
 * Temperature conversion
 */
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

// =====================================
// UI STATE MANAGEMENT
// =====================================

/**
 * Show loading state
 */
function showLoading() {
    hideAllStates();
    loadingState.classList.remove('hidden');
}

/**
 * Show error state
 */
function showError(message) {
    hideAllStates();
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

/**
 * Hide all states
 */
function hideAllStates() {
    weatherDisplay.classList.add('hidden');
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    welcomeState.classList.add('hidden');
}

/**
 * Handle retry button
 */
function handleRetry() {
    hideAllStates();
    welcomeState.classList.remove('hidden');
    cityInput.value = '';
    cityInput.focus();
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Format Unix timestamp to local time
 */
function formatTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Format current local time
 */
function formatLocalTime(timezoneOffset) {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localTime = new Date(utc + (timezoneOffset * 1000));
    
    const hours = localTime.getHours();
    const minutes = localTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Auto-update time every minute
 */
function startTimeUpdater() {
    setInterval(() => {
        if (currentWeatherData) {
            document.getElementById('localTime').textContent = 
                formatLocalTime(currentWeatherData.timezone);
        }
    }, 60000); // Update every minute
}

// =====================================
// INITIALIZATION
// =====================================

/**
 * Initialize the app
 */
function init() {
    // Check if API key is configured
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please configure your OpenWeatherMap API key in script.js');
        return;
    }
    
    // Show welcome state
    welcomeState.classList.remove('hidden');
    
    // Focus on input
    cityInput.focus();
    
    // Start time updater
    startTimeUpdater();
    
    // Add some Easter eggs
    addEasterEggs();
}

/**
 * Add fun Easter eggs
 */
function addEasterEggs() {
    // Secret city codes
    const secretCities = {
        'narnia': 'London',
        'gotham': 'New York',
        'hogwarts': 'Edinburgh',
        'wakanda': 'Nairobi',
        'asgard': 'Oslo'
    };
    
    cityInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        if (secretCities[value]) {
            console.log(`🎉 Secret discovered! Redirecting to ${secretCities[value]}...`);
        }
    });
    
    // Replace secret city with real city on search
    searchBtn.addEventListener('click', () => {
        const value = cityInput.value.toLowerCase();
        if (secretCities[value]) {
            cityInput.value = secretCities[value];
        }
    });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// =====================================
// ADDITIONAL FEATURES
// =====================================

/**
 * Add keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        cityInput.focus();
        cityInput.select();
    }
    
    // Escape to clear and focus
    if (e.key === 'Escape') {
        cityInput.value = '';
        cityInput.focus();
    }
});

/**
 * Add smooth scroll reveal for detail cards
 */
function addScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.detail-card').forEach(card => {
        observer.observe(card);
    });
}

// Initialize scroll animations when weather is displayed
const originalDisplayWeather = displayWeather;
displayWeather = function(data) {
    originalDisplayWeather(data);
    setTimeout(addScrollAnimations, 100);
};
