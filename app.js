document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('recipeModal');
    let allRecipes = [];
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let currentTab = 'all';

    // Load recipes from API
    async function loadRecipes() {
        const grid = document.getElementById('recipesGrid');
        grid.innerHTML = "<p style='text-align:center; padding:80px;'>Loading recipes... 🍳</p>";

        try {
            const res = await fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=");
            const data = await res.json();
            allRecipes = data.meals || [];
            populateFilters();
            renderRecipes(allRecipes);
        } catch (e) {
            grid.innerHTML = "<p style='color:red; text-align:center;'>Failed to load recipes.<br>Check your internet connection.</p>";
        }
    }

    function populateFilters() {
        const categories = [...new Set(allRecipes.map(r => r.strCategory))].sort();
        const areas = [...new Set(allRecipes.map(r => r.strArea))].sort();

        const catSelect = document.getElementById('categoryFilter');
        const areaSelect = document.getElementById('areaFilter');

        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            catSelect.appendChild(opt);
        });

        areas.forEach(area => {
            const opt = document.createElement('option');
            opt.value = area;
            opt.textContent = area;
            areaSelect.appendChild(opt);
        });
    }

    function isFavorite(recipe) {
        return favorites.some(f => f.idMeal === recipe.idMeal);
    }

    function toggleFavorite(recipe) {
        if (isFavorite(recipe)) {
            favorites = favorites.filter(f => f.idMeal !== recipe.idMeal);
        } else {
            favorites.push(recipe);
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderRecipes(getCurrentRecipes());
    }

    function getCurrentRecipes() {
        let recipes = currentTab === 'favorites' ? favorites : allRecipes;

        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const category = document.getElementById('categoryFilter').value;
        const area = document.getElementById('areaFilter').value;

        if (searchTerm) {
            recipes = recipes.filter(r => 
                r.strMeal.toLowerCase().includes(searchTerm) ||
                (r.strInstructions && r.strInstructions.toLowerCase().includes(searchTerm))
            );
        }

        if (category) recipes = recipes.filter(r => r.strCategory === category);
        if (area) recipes = recipes.filter(r => r.strArea === area);

        return recipes;
    }

    function renderRecipes(recipes) {
        const grid = document.getElementById('recipesGrid');
        grid.innerHTML = "";

        if (recipes.length === 0) {
            grid.innerHTML = `<p style='text-align:center; padding:80px;'>No recipes found.</p>`;
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
                <button class="favorite-btn">${isFavorite(recipe) ? '❤️' : '♡'}</button>
                <div class="recipe-info">
                    <h3>${recipe.strMeal}</h3>
                    <p>${recipe.strCategory} • ${recipe.strArea}</p>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('favorite-btn')) {
                    toggleFavorite(recipe);
                } else {
                    showRecipeModal(recipe);
                }
            });

            grid.appendChild(card);
        });

        document.getElementById('resultsCount').textContent = 
            `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} found`;
    }

    function showRecipeModal(recipe) {
        const modalBody = document.getElementById('modalBody');
        let ingredientsHTML = '';

        for (let i = 1; i <= 20; i++) {
            if (recipe[`strIngredient${i}`]) {
                ingredientsHTML += `<li>${recipe[`strMeasure${i}`] || ''} ${recipe[`strIngredient${i}`]}</li>`;
            }
        }

        modalBody.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
            <div style="padding:20px;">
                <h2>${recipe.strMeal}</h2>
                <p><strong>${recipe.strCategory}</strong> • ${recipe.strArea}</p>
                
                <h3>Ingredients</h3>
                <ul>${ingredientsHTML}</ul>
                
                <h3>Instructions</h3>
                <p style="white-space: pre-line; line-height: 1.7;">${recipe.strInstructions}</p>
                
                ${recipe.strYoutube ? `<a href="${recipe.strYoutube}" target="_blank">▶ Watch Cooking Video</a>` : ''}
            </div>
        `;

        modal.style.display = "flex";
    }

    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', () => renderRecipes(getCurrentRecipes()));
    document.getElementById('categoryFilter').addEventListener('change', () => renderRecipes(getCurrentRecipes()));
    document.getElementById('areaFilter').addEventListener('change', () => renderRecipes(getCurrentRecipes()));

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            renderRecipes(getCurrentRecipes());
        });
    });

    // Close modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        modal.style.display = "none";
    });

    // Start the app
    loadRecipes();
});