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
4. Open Jellyfin Web op dezelfde server en herlaad de browser. De plugin voegt het chat-script automatisch toe aan de uitgestuurde webpagina; hij wijzigt geen HTML-bestanden. Kies **Chat → Beheer** als Jellyfin-beheerder om toegang en groepen in te stellen. Standaard is chat voor iedereen aan en bestaat de groep Algemeen. Geen leden selecteren betekent dat iedereen met chattoegang de groep kan zien; beheerders zien alle groepen. Verwijderen van een groep verwijdert ook de berichten definitief.

Het icoon werkt in Jellyfin Web dat door dezelfde Jellyfin-server wordt gehost. Een afzonderlijk gehoste webclient, native app, reverse proxy die zelf een webpagina serveert, of een proxy die scripts blokkeert wordt niet automatisch aangepast. Als je eerder handmatig de scriptregel hebt toegevoegd, hoeft dat niet opnieuw; verwijder die oude regel bij voorkeur zodat de webclient schoon blijft. Na installatie of een update is een serverherstart en browserherlaadbeurt nodig.

### Releases voor beheerders van deze repository

GitHub Actions bouwt bij een push naar `main` met .NET 10 de plugin en publiceert een release met de zip en een `manifest.json` met de MD5-checksum. De bovenstaande URL verwijst naar het manifest van de nieuwste release. De URL werkt pas nadat deze workflow op `main` succesvol is uitgevoerd; GitHub Actions moet releases mogen aanmaken. Pull requests worden alleen gebouwd en publiceren niets. Deze versie voor 12.4 is nog niet getest in een draaiende Jellyfin-server. Installeer de oude versie voor 10.10.7 niet op 12.4; verwijder die eerst en herstart de server.

Voor handmatige installatie: bouw met `dotnet publish -c Release -o ./publish`, plaats `publish/Jellyfin.Plugin.Chat.dll` in een map `Chat` in de Jellyfin-pluginmap en herstart. Ook bij handmatige installatie wordt de webpagina automatisch aangepast tijdens het serveren. Voor andere Jellyfin-versies is compatibiliteit niet gegarandeerd.

De server controleert toegang en schrijfrechten bij ieder verzoek. Chatgegevens staan in `jellyfin-chat.json` in de Jellyfin-datafolder; neem dit bestand mee in back-ups. Berichten worden onversleuteld op de server bewaard; gebruik HTTPS. Dit is geen end-to-end-versleutelde chat. De interface toont maximaal de laatste 200 berichten per groep. Privégesprekken kunnen worden gemaakt als groep met twee geselecteerde leden (beheerders behouden toegang).
