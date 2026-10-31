# Chat voor Jellyfin

Een eenvoudige chatplug-in voor **Jellyfin Server 10.10.7** en Jellyfin Web. Gebruikers kunnen in groepen chatten; beheerders kunnen de chat voor iedereen of alleen geselecteerde gebruikers inschakelen, groepen met geselecteerde leden maken en aankondigingsgroepen instellen waarin alleen beheerders berichten mogen plaatsen. Beheerders hebben altijd toegang tot alle groepen. Berichten worden elke vier seconden opgehaald.

## Installeren via een eigen repository

**Jellyfin Server 10.10.7** is de doelversie. Na de eerste succesvolle release van deze repository:

1. Open in Jellyfin **Dashboard → Plug-ins → Repository's → Nieuwe repository**.
2. Kies bijvoorbeeld `Chat` als naam en gebruik deze URL:

   ```text
   https://github.com/yuliankanters2011-tech/chat-jellyfin/releases/latest/download/manifest.json
   ```

3. Sla op, open de plugincatalogus, installeer **Chat** en herstart de server.
4. **Belangrijk:** installatie via de catalogus voegt het chat-icoon niet automatisch toe. Voeg op de server in de `index.html` van de gebruikte Jellyfin Web-installatie vóór `</body>` deze regel toe:

   ```html
   <script defer src="../ChatPlugin/chat.js"></script>
   ```

   Dit relatieve pad gaat uit van de standaard web-URL `/web/`. Bij een afwijkende web-URL of afzonderlijke webhosting moet de URL naar de Jellyfin-server en eventuele reverse-proxyconfiguratie worden aangepast. Maak vooraf een back-up; een Jellyfin Web-update kan deze wijziging overschrijven. Herlaad de browser en meld je aan. Het icoon werkt alleen in de aangepaste webclient, niet automatisch in native apps.
5. Kies **Chat → Beheer** als Jellyfin-beheerder om toegang en groepen in te stellen. Standaard is chat voor iedereen aan en bestaat de groep Algemeen. Geen leden selecteren betekent dat iedereen met chattoegang de groep kan zien; beheerders zien alle groepen. Verwijderen van een groep verwijdert ook de berichten definitief.

### Releases voor beheerders van deze repository

GitHub Actions bouwt bij een push naar `main` met .NET 8 de plugin en publiceert een release met de zip en een `manifest.json` met de MD5-checksum. De bovenstaande URL verwijst naar het manifest van de nieuwste release. De URL werkt pas nadat deze workflow op `main` succesvol is uitgevoerd; GitHub Actions moet releases mogen aanmaken. Pull requests worden alleen gebouwd en publiceren niets. De plugin is nog niet getest in een draaiende Jellyfin-server.

Voor handmatige installatie: bouw met `dotnet publish -c Release -o ./publish`, plaats `publish/Jellyfin.Plugin.Chat.dll` in een map `Chat` in de Jellyfin-pluginmap en herstart. Pas ook dan Jellyfin Web aan zoals hierboven beschreven. Voor andere Jellyfin-versies is compatibiliteit niet gegarandeerd.

De server controleert toegang en schrijfrechten bij ieder verzoek. Chatgegevens staan in `jellyfin-chat.json` in de Jellyfin-datafolder; neem dit bestand mee in back-ups. Berichten worden onversleuteld op de server bewaard; gebruik HTTPS. Dit is geen end-to-end-versleutelde chat. De interface toont maximaal de laatste 200 berichten per groep. Privégesprekken kunnen worden gemaakt als groep met twee geselecteerde leden (beheerders behouden toegang).
