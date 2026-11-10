# BREK Coffee

Site une page pour **BREK Coffee**, 47 rue des Eaux-Vives, 1207 Genève. Démo Naskon.

**En ligne:** https://naskon.com/demo/cafe/brek/ (`noindex` tant que c'est une démo)

## Ce qu'il y a

- Hero: le verre change de boisson (Vanilla Matcha, Cinnamon Latte, Strawberry Matcha) et la couleur du point du logo suit
- Logo et mascotte redessinés en vectoriel (SVG), à la demande du café
- Carte filtrable (Tout, Coffee, Signature, Matcha, Non coffee, Miam), prix de l'affiche en boutique
- Commande à l'avance: options (glacé/chaud, lait d'avoine, cold foam), précisions (sans sucre…), heure de retrait dans les horaires, envoi sur WhatsApp, paiement au comptoir
- Ouvert / fermé en direct (heure de Genève), FAQ avec données structurées

## Réglages

- Numéro WhatsApp de la boutique: attribut `data-whatsapp` sur `<body>` dans `index.html` (format 41791234567). Vide: WhatsApp s'ouvre et on choisit le contact.
- Horaires: `HOURS` dans `site.js` et `order.js`

## Publication

Hostinger (GIT, déploiement automatique): branche `main` → `public_html/demo/cafe/brek`. Chaque push sur `main` met le site à jour.

HTML, CSS et JavaScript, sans framework. Conçu et développé par [Ahmad Alhallak](https://ahmadalhallak.com) avec l'aide de Claude.
