# ReachImpact Heroku Deployment Handleiding

Deze handleiding legt uit hoe je ReachImpact kan deployen naar Heroku.

## Vereisten

1. Een [Heroku](https://www.heroku.com/) account
2. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) geïnstalleerd
3. [Git](https://git-scm.com/) geïnstalleerd

## Stap 1: Voorbereiden van je lokale project

Controleer of de volgende bestanden aanwezig zijn in je project:
- `Procfile` - Vertelt Heroku hoe je app te starten
- `app.json` - Beschrijft je app voor Heroku
- `heroku.yml` - Configuratie voor container deployment

## Stap 2: Inloggen bij Heroku

```bash
heroku login
```

## Stap 3: Maak een nieuwe Heroku app aan

```bash
# Maak een nieuwe app aan
heroku create reachimpact

# Of koppel aan een bestaande app
heroku git:remote -a reachimpact
```

## Stap 4: Configureer je omgevingsvariabelen

Stel alle benodigde environment variables in:

```bash
heroku config:set SESSION_SECRET=jouw_geheime_session_key
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=jouw_openai_api_key
heroku config:set TWILIO_ACCOUNT_SID=jouw_twilio_sid
heroku config:set TWILIO_AUTH_TOKEN=jouw_twilio_token
heroku config:set TWILIO_PHONE_NUMBER=jouw_twilio_telefoonnummer
```

Voeg eventuele andere benodigde omgevingsvariabelen toe.

## Stap 5: Stel een Heroku PostgreSQL database in (indien nodig)

```bash
heroku addons:create heroku-postgresql:mini
```

## Stap 6: Deploy de applicatie

```bash
# Push naar Heroku
git push heroku main
```

## Stap 7: Open je app

```bash
heroku open
```

## Stap 8: Bekijk logs voor probleemoplossing

```bash
heroku logs --tail
```

## Extra: Automatische deploys instellen

Je kunt automatische deployments inschakelen door je Heroku app te verbinden met GitHub:

1. Ga naar je [Heroku Dashboard](https://dashboard.heroku.com/)
2. Selecteer je app
3. Ga naar het tabblad "Deploy"
4. Kies "GitHub" als deployment method
5. Koppel je GitHub repository
6. Zet "Automatic deploys" aan

Dit zorgt ervoor dat je app automatisch gedeployed wordt wanneer je naar je main branch pusht.

## Veelvoorkomende problemen

### App start niet op
Controleer de logs om te zien wat er misgaat:
```bash
heroku logs --tail
```

### Database migratie problemen
Run migraties handmatig:
```bash
heroku run npm run db:push
```

### Te weinig geheugen
Upgrade naar een hoger tier:
```bash
heroku ps:resize web=standard-1x
```