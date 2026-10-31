# Chat voor Jellyfin

Een eenvoudige chatplug-in voor **Jellyfin Server 10.10.7** en Jellyfin Web. Gebruikers kunnen in groepen chatten; beheerders kunnen de chat voor iedereen of alleen geselecteerde gebruikers inschakelen, groepen met geselecteerde leden maken en aankondigingsgroepen instellen waarin alleen beheerders berichten mogen plaatsen. Beheerders hebben altijd toegang tot alle groepen. Berichten worden elke vier seconden opgehaald.

## Installatie

1. Bouw met de .NET 8 SDK: `dotnet publish -c Release -o ./publish`.
2. Maak in de Jellyfin-pluginmap een map `Chat` en kopieer **alleen** `publish/Jellyfin.Plugin.Chat.dll` daarheen. Herstart Jellyfin. Gebruik voor andere Jellyfin-versies een bijpassende versie van de package references en test deze eerst; compatibiliteit is niet gegarandeerd.
3. Een serverplug-in kan niet zelfstandig JavaScript toevoegen aan de standaard Jellyfin Web-interface. Voeg daarom handmatig, vóór `</body>` in de `index.html` van de **gebruikte Jellyfin Web-installatie**, deze regel toe:

   ```html
   <script defer src="../ChatPlugin/chat.js"></script>
   ```

   Dit relatieve pad gaat uit van de standaard web-URL `/web/`. Bij een afwijkende web-URL of afzonderlijke webhosting moet de URL naar de Jellyfin-server en eventuele reverse-proxyconfiguratie worden aangepast. Maak vooraf een back-up; een update van Jellyfin Web kan deze wijziging overschrijven. Herlaad de browser en meld je aan. De knop verschijnt rechtsboven. De wijziging beïnvloedt alleen deze webclient, niet native apps of andere webinstallaties.
4. Kies **Chat → Beheer** als Jellyfin-beheerder om de toegang en groepen in te stellen. Standaard is chat voor iedereen aan en bestaat de groep Algemeen. Geen leden selecteren betekent dat iedereen met chattoegang de groep kan zien; beheerders zien alle groepen. Verwijderen van een groep verwijdert ook de berichten definitief.

De server controleert toegang en schrijfrechten bij ieder verzoek. Chatgegevens staan in `jellyfin-chat.json` in de Jellyfin-datafolder; neem dit bestand mee in back-ups. Berichten worden onversleuteld op de server bewaard; gebruik HTTPS. Dit is geen end-to-end-versleutelde chat. De interface toont maximaal de laatste 200 berichten per groep. Privégesprekken kunnen worden gemaakt als groep met twee geselecteerde leden (beheerders behouden toegang).
