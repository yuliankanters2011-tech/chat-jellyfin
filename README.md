# Chat voor Jellyfin

Een eenvoudige chatplug-in voor **Jellyfin Server 12.4** en Jellyfin Web. Gebruikers kunnen in groepen chatten; beheerders kunnen de chat voor iedereen of alleen geselecteerde gebruikers inschakelen, groepen met geselecteerde leden maken en aankondigingsgroepen instellen waarin alleen beheerders berichten mogen plaatsen. Beheerders hebben altijd toegang tot alle groepen. Berichten worden elke vier seconden opgehaald.

## Installeren via een eigen repository

**Jellyfin Server 12.4** is de doelversie. Na de eerste succesvolle release van deze repository:

1. Open in Jellyfin **Dashboard → Plug-ins → Repository's → Nieuwe repository**.
2. Kies bijvoorbeeld `Chat` als naam en gebruik deze URL:

   ```text
   https://github.com/yuliankanters2011-tech/chat-jellyfin/releases/latest/download/manifest.json
   ```

3. Sla op, open de plugincatalogus, installeer **Chat** en herstart de server.
4. Open Jellyfin Web op dezelfde server en herlaad de browser. De chatknop staat in de bovenbalk naast de andere knoppen; als de bovenbalk niet beschikbaar is staat hij tijdelijk rechtsonder. De plugin voegt het chat-script automatisch toe aan de uitgestuurde webpagina; hij wijzigt geen HTML-bestanden. Kies **Chat → Beheer** als Jellyfin-beheerder om toegang en groepen in te stellen. Standaard is chat voor iedereen aan en bestaat de groep Algemeen. Geen leden selecteren betekent dat iedereen met chattoegang de groep kan zien; beheerders zien alle groepen. Verwijderen van een groep verwijdert ook de berichten definitief.

Het icoon werkt in Jellyfin Web dat door dezelfde Jellyfin-server wordt gehost. Een afzonderlijk gehoste webclient, native app, reverse proxy die zelf een webpagina serveert, of een proxy die scripts blokkeert wordt niet automatisch aangepast. Als je eerder handmatig de scriptregel hebt toegevoegd, hoeft dat niet opnieuw; verwijder die oude regel bij voorkeur zodat de webclient schoon blijft. Na installatie of een update is een serverherstart en browserherlaadbeurt nodig.

### Raw GitHub-link

Na samenvoegen naar `main` is ook deze raw-link beschikbaar:

```text
https://raw.githubusercontent.com/yuliankanters2011-tech/chat-jellyfin/main/repository/manifest.json
```

**Let op:** dit bestand is een momentopname van de laatst handmatig bijgewerkte release en wordt niet automatisch bijgewerkt. Gebruik bij voorkeur de `releases/latest`-link hierboven voor automatische updates. Om de raw-link bij te werken moet een beheerder na iedere publicatie het bijbehorende `manifest.json` uit de release naar `repository/manifest.json` kopiëren en die wijziging samenvoegen. Anders mist de raw-link nieuwe versies, inclusief eventuele oplossingen voor het chat-icoon.

### Releases voor beheerders van deze repository

GitHub Actions bouwt bij een push naar `main` met .NET 10 de plugin en publiceert een release met de zip en een `manifest.json` met de MD5-checksum. De bovenstaande URL verwijst naar het manifest van de nieuwste release. De URL werkt pas nadat deze workflow op `main` succesvol is uitgevoerd; GitHub Actions moet releases mogen aanmaken. Pull requests worden alleen gebouwd en publiceren niets. De releaseworkflow test de plugin in een Jellyfin 12.4-Dockercontainer en een browser. Installeer de oude versie voor 10.10.7 niet op 12.4; verwijder die eerst en herstart de server.

Voor handmatige installatie: bouw met `dotnet publish -c Release -o ./publish`, plaats `publish/Jellyfin.Plugin.Chat.dll` in een map `Chat` in de Jellyfin-pluginmap en herstart. Ook bij handmatige installatie wordt de webpagina automatisch aangepast tijdens het serveren. Voor andere Jellyfin-versies is compatibiliteit niet gegarandeerd.

De server controleert toegang en schrijfrechten bij ieder verzoek. Chatgegevens staan in `jellyfin-chat.json` in de Jellyfin-datafolder; neem dit bestand mee in back-ups. Berichten worden onversleuteld op de server bewaard; gebruik HTTPS. Dit is geen end-to-end-versleutelde chat. De interface toont maximaal de laatste 200 berichten per groep. Privégesprekken kunnen worden gemaakt als groep met twee geselecteerde leden (beheerders behouden toegang).

### Interface testen

Voer `npm ci` en `npm run test:ui` uit voor de browsertests van de chatinterface. De releaseworkflow test daarnaast de serverplugin in een Jellyfin 12.4-Dockercontainer.

### Privégesprekken en groepen

Iedere gebruiker met chattoegang kan een één-op-één-gesprek of een groep met geselecteerde gebruikers starten via **Nieuwe chat**. Een privégesprek is niet geheim voor beheerders: alle Jellyfin-beheerders hebben automatisch toegang tot alle gesprekken en kunnen ze verwijderen. Alleen beheerders kunnen aankondigingsgroepen en groepen voor iedereen maken.

### Meldingen en nieuwe films

Een groen bolletje bij de chatknop toont hoeveel berichten je nog niet hebt gelezen. Bij een nieuw bericht verschijnt ook kort een aanklikbare melding in Jellyfin Web. De melding toont geen naam of berichtinhoud; klik erop om de betreffende chat te openen. Als het tabblad verborgen is, verschijnt de melding wanneer je terugkomt, zolang er nog ongelezen berichten zijn. Je eigen berichten tellen niet mee. Het bolletje wordt bijgewerkt terwijl Jellyfin Web openstaat; het is geen pushmelding voor gesloten browsers of native apps. Open de betreffende chat in een zichtbaar browsertabblad om de berichten als gelezen te markeren. Leesstatus wordt per Jellyfin-gebruiker en per chat bewaard, ook na herstart. Bestaande berichten waarvoor nog geen leesstatus bestaat kunnen bij de eerste keer als ongelezen verschijnen.

Wanneer Jellyfin een film aan zijn bibliotheek toevoegt, plaatst de bot **Jellyfin** een bericht in de automatisch aangemaakte aankondigingsgroep **Nieuwe films**. Alleen beheerders kunnen zelf in die groep schrijven. Filmaankondigingen worden alleen getoond aan gebruikers die toegang hebben tot de betreffende film volgens Jellyfin; privéchats krijgen geen filmaankondigingen. De bot kondigt filmitems aan bij het toevoegen, niet bij gewone metadata-updates. Bij een eerste bibliotheekscan kunnen bestaande films ook als nieuw worden gemeld. Een eerder aangekondigd film-ID wordt niet opnieuw gemeld; als de aankondigingsgroep verwijderd wordt, maakt de bot die bij een volgende nieuwe film opnieuw aan. Chatberichten en leesstatus staan samen in `jellyfin-chat.json`; bestaande back-ups blijven belangrijk.
