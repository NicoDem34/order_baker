// Variables globales
let currentLang = 'fr';
let orderItems = [];

// Traductions
const translations = {
    fr: {
        title: "Commande pour la boulangerie de Goult",
        "delivery-info": "Livraison chaque matin vers 8h (boulangerie fermée le lundi, sauf exception)",
        "order-info": "Commande à passer avant 15h la veille par WhatsApp",
        "name-label": "Nom / Name :",
        "date-label": "Date de livraison / Delivery date :",
        "show-summary": "Voir Récapitulatif / View Summary",
        "summary-title": "Récapitulatif de commande / Order Summary",
        "whatsapp-btn": "Copier dans WhatsApp / Copy to WhatsApp",
        product: "Produit",
        description: "Description",
        price: "Prix (€)",
        quantity: "Quantité",
        weekdays: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
    },
    en: {
        title: "Order form for Goult bakery",
        "delivery-info": "Delivery every morning around 8 a.m. (bakery closed on Monday, except exception)",
        "order-info": "Order to be placed before 3 p.m. the day before via WhatsApp",
        "name-label": "Name / Nom :",
        "date-label": "Delivery date / Date de livraison :",
        "show-summary": "View Summary / Voir Récapitulatif",
        "summary-title": "Order Summary / Récapitulatif de commande",
        "whatsapp-btn": "Copy to WhatsApp / Copier dans WhatsApp",
        product: "Product",
        description: "Description",
        price: "Price (€)",
        quantity: "Quantity",
        weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Date par défaut (demain)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('deliveryDate').value = tomorrow.toISOString().split('T')[0];
    
    // Génération des accordéons
    generateAccordions();
    
    // Gestion des événements
    setupEventListeners();
    
    // Langue par défaut
    updateLanguage();
});

// Configuration des événements
function setupEventListeners() {
    // Boutons de langue
    document.getElementById('lang-fr').addEventListener('click', () => switchLanguage('fr'));
    document.getElementById('lang-en').addEventListener('click', () => switchLanguage('en'));
    
    // Bouton récapitulatif
    document.getElementById('showSummary').addEventListener('click', showSummary);
    
    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('whatsappBtn').addEventListener('click', openWhatsApp);
    
    // Fermer modal en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('summaryModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Changement de date
    document.getElementById('deliveryDate').addEventListener('change', updateAvailability);
    
    // Gestion des accordéons
    setupAccordionListeners();
}

// Gestion des accordéons avec correction mobile
function setupAccordionListeners() {
    const accordionButtons = document.querySelectorAll('.accordion-button');
    
    accordionButtons.forEach(button => {
        // Supprimer anciens listeners
        button.removeEventListener('click', toggleAccordion);
        button.removeEventListener('touchstart', toggleAccordion);
        
        // Ajouter nouveaux listeners
        button.addEventListener('click', toggleAccordion, { passive: true });
        button.addEventListener('touchstart', toggleAccordion, { passive: true });
    });
}

function toggleAccordion(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const target = button.getAttribute('data-bs-target');
    const collapse = document.querySelector(target);
    
    if (!collapse) return;
    
    // Toggle avec animation
    if (collapse.classList.contains('show')) {
        collapse.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');
        button.classList.add('collapsed');
    } else {
        // Fermer autres accordéons (optionnel)
        document.querySelectorAll('.accordion-collapse.show').forEach(other => {
            if (other !== collapse) {
                other.classList.remove('show');
                const otherButton = document.querySelector(`[data-bs-target="#${other.id}"]`);
                if (otherButton) {
                    otherButton.setAttribute('aria-expanded', 'false');
                    otherButton.classList.add('collapsed');
                }
            }
        });
        
        // Ouvrir cet accordéon
        collapse.classList.add('show');
        button.setAttribute('aria-expanded', 'true');
        button.classList.remove('collapsed');
    }
}

// Génération des accordéons
function generateAccordions() {
    const container = document.getElementById('orderAccordion');
    container.innerHTML = '';
    
    DATA.categories.forEach(category => {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        
        const headerId = `${category.name_fr.toLowerCase().replace(/\s+/g, '')}Header`;
        const collapseId = `${category.name_fr.toLowerCase().replace(/\s+/g, '')}Collapse`;
        
        accordionItem.innerHTML = `
            <h2 class="accordion-header" id="${headerId}">
                <button class="accordion-button collapsed" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#${collapseId}" 
                        aria-expanded="false" 
                        aria-controls="${collapseId}">
                    ${category.emoji} <span class="category-name">${category.name_fr} / ${category.name_en}</span>
                </button>
            </h2>
            <div id="${collapseId}" 
                 class="accordion-collapse collapse" 
                 aria-labelledby="${headerId}" 
                 data-bs-parent="#orderAccordion">
                <div class="accordion-body">
                    ${generateProductTable(category.products)}
                </div>
            </div>
        `;
        
        container.appendChild(accordionItem);
    });
    
    // Réattacher les listeners après génération
    setTimeout(setupAccordionListeners, 100);
}

// Génération du tableau de produits
function generateProductTable(products) {
    const tableHTML = `
        <table class="products-table">
            <thead>
                <tr>
                    <th class="product-header">${translations[currentLang].product}</th>
                    <th class="description-header">${translations[currentLang].description}</th>
                    <th class="price-header">${translations[currentLang].price}</th>
                    <th class="quantity-header">${translations[currentLang].quantity}</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => `
                    <tr>
                        <td data-label="${translations[currentLang].product}">
                            <div class="product-name">${currentLang === 'fr' ? product.name_fr : product.name_en}</div>
                            ${getAvailabilityInfo(product)}
                        </td>
                        <td data-label="${translations[currentLang].description}">
                            <div class="product-description">${currentLang === 'fr' ? product.description_fr : product.description_en}</div>
                        </td>
                        <td data-label="${translations[currentLang].price}">
                            <div class="product-price">${product.price.toFixed(2)}€</div>
                        </td>
                        <td data-label="${translations[currentLang].quantity}">
                            <input type="number" 
                                   class="quantity-input" 
                                   id="qty-${product.id}" 
                                   min="0" 
                                   value="0" 
                                   data-product-id="${product.id}"
                                   onchange="updateTotal()">
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    return tableHTML;
}

// Information de disponibilité
function getAvailabilityInfo(product) {
    if (product.availability.includes('tous les jours') || product.availability_en.includes('daily')) {
        return '';
    }
    
    const availabilityText = currentLang === 'fr' ? 
        product.availability.join(', ') : 
        product.availability_en.join(', ');
    
    return `<div class="availability-info">(${availabilityText})</div>`;
}

// Changement de langue
function switchLanguage(lang) {
    currentLang = lang;
    
    // Mise à jour des boutons
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');
    
    // Mise à jour du contenu
    updateLanguage();
    
    // Régénération des accordéons
    generateAccordions();
    
    // Mise à jour de la disponibilité
    updateAvailability();
    
    // Événement personnalisé pour indiquer le changement de langue
    document.dispatchEvent(new CustomEvent('languageChanged'));
}

// Mise à jour des textes
function updateLanguage() {
    document.documentElement.lang = currentLang;
    
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
}

// Mise à jour de la disponibilité selon la date
function updateAvailability() {
    const selectedDate = document.getElementById('deliveryDate').value;
    if (!selectedDate) return;
    
    const selectedDay = new Date(selectedDate).getDay();
    const dayName = translations[currentLang].weekdays[selectedDay];
    
    DATA.categories.forEach(category => {
        category.products.forEach(product => {
            const input = document.getElementById(`qty-${product.id}`);
            if (!input) return;
            
            const availability = currentLang === 'fr' ? product.availability : product.availability_en;
            const isAvailable = availability.includes('tous les jours') || 
                              availability.includes('daily') || 
                              availability.includes(dayName) ||
                              availability.includes(dayName.toLowerCase());
            
            input.disabled = !isAvailable;
            if (!isAvailable) {
                input.value = 0;
            }
        });
    });
    
    updateTotal();
}

// Mise à jour du total
function updateTotal() {
    let total = 0;
    orderItems = [];
    
    DATA.categories.forEach(category => {
        category.products.forEach(product => {
            const input = document.getElementById(`qty-${product.id}`);
            if (input && input.value > 0) {
                const quantity = parseInt(input.value);
                const subtotal = quantity * product.price;
                total += subtotal;
                
                orderItems.push({
                    id: product.id,
                    name_fr: product.name_fr,
                    name_en: product.name_en,
                    price: product.price,
                    quantity: quantity,
                    subtotal: subtotal
                });
            }
        });
    });
    
    const totalDisplay = document.getElementById('total-display');
    if (total > 0) {
        totalDisplay.textContent = `Total: ${total.toFixed(2)}€`;
    } else {
        totalDisplay.textContent = '';
    }
}

// Affichage du récapitulatif
function showSummary() {
    const customerName = document.getElementById('customerName').value;
    const deliveryDate = document.getElementById('deliveryDate').value;
    
    if (!customerName || !deliveryDate) {
        alert(currentLang === 'fr' ? 
            'Veuillez remplir votre nom et la date de livraison.' : 
            'Please fill in your name and delivery date.');
        return;
    }
    
    if (orderItems.length === 0) {
        alert(currentLang === 'fr' ? 
            'Veuillez sélectionner au moins un produit.' : 
            'Please select at least one product.');
        return;
    }
    
    const summaryContent = document.getElementById('summaryContent');
    const summaryTotal = document.getElementById('summaryTotal');
    
    // Contenu du récapitulatif
    let content = `
        <p><strong>${currentLang === 'fr' ? 'Nom' : 'Name'}:</strong> ${customerName}</p>
        <p><strong>${currentLang === 'fr' ? 'Date' : 'Date'}:</strong> ${formatDate(deliveryDate)}</p>
        <hr>
        <h3>${currentLang === 'fr' ? 'Produits commandés' : 'Ordered products'}:</h3>
        <ul>
    `;
    
    let total = 0;
    orderItems.forEach(item => {
        content += `
            <li>
                ${item.quantity}x ${currentLang === 'fr' ? item.name_fr : item.name_en} - 
                ${item.subtotal.toFixed(2)}€
            </li>
        `;
        total += item.subtotal;
    });
    
    content += '</ul>';
    summaryContent.innerHTML = content;
    summaryTotal.innerHTML = `<h3><strong>Total: ${total.toFixed(2)}€</strong></h3>`;
    
    // Afficher le modal
    document.getElementById('summaryModal').style.display = 'block';
}

// Fermeture du modal
function closeModal() {
    document.getElementById('summaryModal').style.display = 'none';
}

// Ouverture WhatsApp
function openWhatsApp() {
    const customerName = document.getElementById('customerName').value;
    const deliveryDate = document.getElementById('deliveryDate').value;
    
    let message = `Bonjour, je souhaite commander / Hello, I would like to order:%0A%0A`;
    message += `Nom/Name: ${customerName}%0A`;
    message += `Date: ${formatDate(deliveryDate)}%0A%0A`;
    
    let total = 0;
    orderItems.forEach(item => {
        message += `- ${item.quantity}x ${item.name_fr} / ${item.name_en} - ${item.subtotal.toFixed(2)}€%0A`;
        total += item.subtotal;
    });
    
    message += `%0ATotal: ${total.toFixed(2)}€`;
    
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

// Formatage de la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US');
}
