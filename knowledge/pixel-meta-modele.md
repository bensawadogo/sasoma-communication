# Pixel Meta : code de référence et événements (relevé du 13/11/2026)

Source : pages officielles de Meta (« Meta Pixel : mise en route » et « Meta Pixel : référence »), lues le 13/11/2026. Tout ce qui n'est pas dans ces pages est marqué **à vérifier** : le traceur le contrôle sur la page officielle avant de le livrer. Le code officiel à copier se prend dans le Gestionnaire d'événements du client (le modèle ci-dessous peut changer).

## Code de base (page officielle, à placer entre `<head>` et `</head>` de chaque page)
Remplacer `{ID-DU-PIXEL}` (deux endroits) par l'identifiant du pixel **du client**.
```html
<!-- Meta Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '{ID-DU-PIXEL}');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id={ID-DU-PIXEL}&ev=PageView&noscript=1"/>
</noscript>
<!-- End Meta Pixel -->
```
Note : la page officielle contient une faute de frappe dans son exemple (`function()*{`) : on copie `function(){`, et on compare toujours avec le code affiché dans le Gestionnaire d'événements.

## Événements standard (noms sensibles à la casse, 17 selon la référence officielle)
AddPaymentInfo, AddToCart, AddToWishlist, CompleteRegistration, Contact, CustomizeProduct, Donate, FindLocation, InitiateCheckout, Lead, Purchase, Schedule, Search, StartTrial, SubmitApplication, Subscribe, ViewContent.
(`PageView` est dans le code de base ; la page de référence lue ne le liste pas.)

Appel : `fbq('track', 'Lead', { content_name: '...' });`
Propriétés documentées : `content_ids`, `contents` (`id` et `quantity` obligatoires), `content_type` (`product` ou `product_group`), `content_name`, `content_category`, `currency`, `value`, `num_items`, `search_string`, `predicted_ltv`, `status`. **`Purchase` exige `currency` et `value`.**

## Doublons avec l'API de conversions
Quand le pixel et l'API de conversions envoient le même événement, passer `eventID` en **quatrième argument** : `fbq('track', 'Lead', {}, { eventID: 'identifiant-unique' })` (forme à confirmer sur la page « Dédupliquer les événements » avant livraison).

## À vérifier avant de livrer (pas dans les pages lues)
- Événement personnalisé : `fbq('trackCustom', 'NomDeLEvenement', { ... })` : syntaxe, limites de nom et nombre d'événements.
- Consentement : `fbq('consent', 'revoke')` avant `init`, puis `fbq('consent', 'grant')` après accord du visiteur.
- Données personnelles (téléphone, e-mail) : jamais envoyées en clair ; correspondance avancée seulement avec accord et hachage, selon la page officielle.

## Vérification d'une installation (étapes officielles)
1. Charger une page : un événement `PageView` doit arriver.
2. Gestionnaire d'événements > détails du pixel : l'événement apparaît (attendre quelques minutes).
3. Sinon, utiliser « Meta Ads Data Advisor » (extension Chrome recommandée par Meta).
