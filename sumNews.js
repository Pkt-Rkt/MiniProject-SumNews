const apiKey = 'c781cb469ec34e73895660a06747739c';
const categorySelect = document.getElementById('category-select');
const searchInput = document.getElementById('search-input');
const newsContainer = document.getElementById('news-container');
const countrySelect = document.getElementById('country-select');
const toggleThemeButton = document.getElementById('toggle-theme-button');
const themeStyle = document.getElementById('theme-style');
let page = 1;

const cacheExpirationTime = 3600 * 1000;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    themeStyle.href = savedTheme;
}

function toggleTheme() {
    if (themeStyle.href.includes('sumNewslight.css')) {
        themeStyle.href = 'sumNewsdark.css';
    } else {
        themeStyle.href = 'sumNewslight.css';
    }
    localStorage.setItem('theme', themeStyle.href);
}

toggleThemeButton.addEventListener('click', toggleTheme);

function isAtBottom() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || window.pageYOffset || document.body.scrollTop || 0;

    return scrollTop + windowHeight >= documentHeight - 200;
}

function onScroll() {
    if (isAtBottom()) {
        loadMoreArticles();
    }
}

function buildNewsApiUrl({ category = 'general', searchQuery = '', selectedCountry = 'us' }) {
    const baseApiUrl = 'https://newsapi.org/v2/top-headlines';
    const queryParams = {
        country: selectedCountry,
        apiKey: apiKey,
        page,
    };

    if (category !== 'general') {
        queryParams.category = category;
    }

    if (searchQuery) {
        queryParams.q = searchQuery;
    }

    const queryString = Object.keys(queryParams)
        .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
        .join('&');

    return `${baseApiUrl}?${queryString}`;
}

async function fetchNewsAndDisplay({ category, searchQuery, selectedCountry }) {
    try {
        const cacheKey = `${category}-${searchQuery}-${selectedCountry}`;
        const cachedData = localStorage.getItem(cacheKey);
        const currentTime = new Date().getTime();

        if (cachedData) {
            const data = JSON.parse(cachedData);
            if (currentTime - data.timestamp < cacheExpirationTime) {
                displayNews(data.articles);
                return;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }

        const apiUrl = buildNewsApiUrl({ category, searchQuery, selectedCountry });
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'ok') {
            data.timestamp = currentTime;
            localStorage.setItem(cacheKey, JSON.stringify(data));
            displayNews(data.articles);
        } else {
            console.error('Failed to fetch news:', data.message);
            displayErrorMessage("Sorry, we can't find any articles at the moment.");
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        displayErrorMessage("Sorry, we can't find any articles at the moment.");
    }
}

function displayNews(newsArticles) {
    newsContainer.innerHTML = '';

    if (newsArticles.length === 0) {
        displayErrorMessage('No articles found.');
        return;
    }

    const filteredArticles = newsArticles.filter(article => article.title !== "[Removed]");

    filteredArticles.forEach((article) => {
        const articleElement = document.createElement('div');
        articleElement.classList.add('news-article');

        const titleElement = document.createElement('a');
        titleElement.classList.add('news-title');
        titleElement.textContent = article.title;
        titleElement.href = article.url;
        titleElement.target = '_blank';

        const descriptionElement = document.createElement('p');
        descriptionElement.classList.add('news-description');
        descriptionElement.textContent = article.description;

        const sourceElement = document.createElement('p');
        sourceElement.classList.add('news-source');
        sourceElement.textContent = `Source: ${article.source.name}`;

        const publishedAtElement = document.createElement('p');
        publishedAtElement.classList.add('published-at');
        publishedAtElement.textContent = `Published at: ${formatDate(article.publishedAt)}`;

        articleElement.appendChild(titleElement);
        articleElement.appendChild(descriptionElement);
        articleElement.appendChild(sourceElement);
        articleElement.appendChild(publishedAtElement);

        newsContainer.appendChild(articleElement);
    });
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function loadMoreArticles() {
    page++;
    const selectedCategory = categorySelect.value;
    const searchQuery = searchInput.value.trim();
    const selectedCountry = countrySelect.value;

    fetchNewsAndDisplay({ category: selectedCategory, searchQuery, selectedCountry });
}

function displayErrorMessage(message) {
    const errorMessage = document.createElement('p');
    errorMessage.textContent = message;
    errorMessage.classList.add('error-message');
    newsContainer.innerHTML = '';
    newsContainer.appendChild(errorMessage);
}

categorySelect.addEventListener('change', () => {
    page = 1;
    fetchNewsAndDisplay({
        category: categorySelect.value,
        searchQuery: searchInput.value.trim(),
        selectedCountry: countrySelect.value,
    });
});

searchInput.addEventListener('input', () => {
    page = 1;
    const selectedCategory = categorySelect.value;
    const searchQuery = searchInput.value.trim();

    if (searchQuery === '') {
        fetchNewsAndDisplay({
            category: 'general',
            searchQuery: '',
            selectedCountry: countrySelect.value,
        });
    } else {
        fetchNewsAndDisplay({
            category: selectedCategory,
            searchQuery,
            selectedCountry: countrySelect.value,
        });
    }
});

countrySelect.addEventListener('change', () => {
    page = 1;
    fetchNewsAndDisplay({
        category: categorySelect.value,
        searchQuery: searchInput.value.trim(),
        selectedCountry: countrySelect.value,
    });
});

window.addEventListener('scroll', onScroll);

window.addEventListener('load', () => {
    fetchNewsAndDisplay({ category: 'general', searchQuery: '', selectedCountry: 'us' });
});
