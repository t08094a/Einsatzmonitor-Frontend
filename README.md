<p align="center">
  <img src="http://134.255.237.237/einsatzmonitor-logo-256w.png" alt="Logo"/>
</p>

<h1 align="center">
  Einsatzmonitor - Frontend
</h1>

<p align="center">
  <a href="https://github.com/Finn0811/Einsatzmonitor-Frontend/releases/latest"><img src="https://img.shields.io/github/release/Finn0811/Einsatzmonitor-Frontend" alt="Current Release"></a>
  <a href="https://github.com/Finn0811/Einsatzmonitor-Frontend/releases/latest"><img src="https://img.shields.io/github/commits-since/Finn0811/Einsatzmonitor-Frontend/latest.svg" alt="Commits since last release"></a>
  <a href="https://github.com/Finn0811/Einsatzmonitor-Frontend/issues"><img src="http://isitmaintained.com/badge/open/Finn0811/Einsatzmonitor-Frontend.svg" alt="Open issues"></a>
</p>

## :camera: Bilder
| Standbyansicht | Einsatzansicht |
|:-------------:|:-------------:|
|![Standbyansicht](http://134.255.237.237/einsatzmonitor/1.2.0/info.png "Standbyansicht")|![Alarmansicht](http://134.255.237.237/einsatzmonitor/1.2.0/einsatz.png "Alarmansicht")|


## :sparkles: Features

- Lauffähig unter Windows und Linux
- Für RaspberryPi optimiert
- Darstellung von News, Terminen und ggf. einer Einsatz-Historie von einer REST-API in der Standbyansicht
- Sollte der RaspberryPi während eines Einsatzes unerwartet neustarten, wechselt der Einsatzmonitor nach dem Hochfahren automatisch wieder in die Einsatzansicht
- "Client/Server" Setup
    - Geringer Resourcenbedarf auf dem RaspberryPi, da die Alarmauswertung von einem separaten Server ausgeführt werden kann
    - Unbegrenzt viele Bildschirme sind einfach zu installieren
- Einfache Anpassung des Layouts durch Widgets
- Geringe Hardwarekosten auch für mehre Bildschirme
- Darstellung der Route und Berechnung der Strecke mithilfe der Google Maps API
- Ein/Ausschalten des Bildschirms mittels Bewegungsmelder am RaspberryPi möglich
- Rückmeldungen von [Alamos aPager Pro](https://www.alamos-gmbh.com/service/apager-pro/) anzeigen


## :wrench: Technik

- Verwendete Frameworks und API's
    - [electron](https://github.com/electron/electron)
    - [Bootstrap](https://getbootstrap.com/)
    - [Knockout](https://github.com/knockout/knockout)
    - [toastr](https://github.com/CodeSeven/toastr)
    - [jQuery](https://jquery.com/)
    - [Google Maps API](https://developers.google.com/maps/documentation/?hl=de)
    - [Gridster](https://github.com/dsmorse/gridster.js)


- Benötigte Software
    - git
    - node

## :cloud: Installation auf einem RaspberryPi 3 B+

1. Git installieren
    - ``$ apt install git``
2. Ins verzeichnis `/opt/` wechseln
    - ``$ cd /opt/``
3. Einsatzmonitor - Frontend herunterladen
    - ``$ mkdir einsatzmonitor && cd einsatzmonitor``
    - ``$ git clone https://github.com/Finn0811/Einsatzmonitor.git .``
4. NodeJS installieren
    - ``$ apt update``
    - ``$ curl -sL https://deb.nodesource.com/setup_12.x | bash -``
    - ``$ apt install nodejs``
5. Einsatzmonitor - Frontend Abhängigkeiten installieren
    - ``$ npm install``
6. Konfigurationsdatei aktivieren
    - ``$ cp config.js.dist config.js``
    - Durch das Umbenennen wird sichergestellt, dass die Konfigurationsdatei bei einem Update des Einsatzmonitors nicht überschrieben wird. Erklärungen zu den Optionen folgen in einem der nächsten Punkte.
7. Installation testen
    - ``$ npm start``
    
Es sollte sich nun ein Fenster des Einsatzmonitors öffnen. Dieses kann direkt mit ``STRG + c`` geschlossen werden.

Bei der Installation wurde bereits der Autostart für diese Anwendung eingerichtet. (``/home/pi/.config/autostart/einsatzmonitor.desktop``)

## :rocket: Funktionsweise
#### Abrufen von Einsätzen
Der Einsatzmonitor erwartet für die Abfrage, ob aktuell ein Einsatz angezeigt werden soll, eine REST-API. Die Entsprechende URL kann in der Konfigurationsdatei eingestellt werden.
Folgende Struktur der API-Antwort wird mindestens benötigt:
```
[
    {
        "id": 1,
        "stichwort": "F1",
        "description": "Feuer im Testobjekt",
        "adresse": "Teststraße 1, 00112 Testort",
        "objekt": "Testobjekt",
        "alarmzeit_seconds": 1558441484
    }
]
```
Außerdem sollte die REST-API nur aktive Einsätze ausgeben, die innerhalb der eingestellten "einsatzDisplayTime" liegen. Diese Zeit kann direkt als Query-Parameter mitgesendet werden.

Alternativ kann ein Einsatz auch über ein Websocket-Event empfangen werden. Die Überlieferte Nachricht muss das Objekt "einsatz" mit der obengenannten Strutur aufweisen.

## :gear: Konfigurationsdatei - Optionen
- ``debug: <true|false>``
    - true: Starten im Fenstermodus
    - false: Starten im Vollbildmodus
- ``einsatz:``
    - ``fetch: <"websocket"|"http">``
        - "websocket": Einsätze werden über ein Websocket-Event empfangen ("Echtzeit").
        - "http": Einsätze werden von einer HTTP-API abgerufen. Benötigt zyklische Abfragen an eine Schnittstelle.
    - ``url: <String>``
        - URL zum Abfragen von Einsätzen (Websocket oder HTTP).
    - ``httpFetchInterval: <Integer>``
        - Gibt an, wie oft die HTTP-Schnittstelle abgefragt werden soll (in Sekunden, z.B. 1 für jede Sekunde).
    - ``einsatzDisplayTime: <Integer>``
        - Zeit in Minuten, wie lange die Alarmansicht dargestellt werden soll.
    - ``showEinheitenLimit: <Integer>``
        - Wieviele Einheiten in der Liste maximal angezeigt werden sollen. (Empfehlung für 1920x1080px Auflösung: 14).
    - ``einheitenAlwaysTop: <List>``
        - Einheiten, die einen in der Liste vorhandenen String enthalten, werden immer am Anfang der Liste dargestellt.
- ``info:``
    - ``httpFetchInterval: <Integer>``
        - Gibt an, wie oft die HTTP-Schnittstelle abgefragt werden soll (in Sekunden, z.B. 30 für alle 30 Sekunden).
    - ``news:``
        - ``show: <true|false>``
            - Anzeigen von News-Beiträgen einer Website in der Standbyansicht?
        - ``url: <String>``
            - URL zum Abfragen von News-Beiträgen (REST-API).
            - (TODO: Benötigte API-Response-Struktur)
    - ``einsaetze:``
        - ``show: <true|false>``
            - Anzeigen von letzten Einsätzen in der Standbyansicht?
        - ``url: <String>``
            - URL zum Abfragen von letzten Einsätzen (REST-API).
            - (TODO: Benötigte API-Response-Struktur)
    - ``dienste:``
        - ``show: <true|false>``
            - Anzeigen der als nächstes Bevorstehenden Dienste in der Standbyansicht?
        - ``url: <String>``
            - URL zum Abfragen von Diensten (REST-API).
            - (TODO: Benötigte API-Response-Struktur)
- ``googleMapsKey: <String>``
    - zum Anzeigen der Route sowie des Einsatzortes wird ein Google Maps API-Key benötigt.
    - Das Einrichten eines solchen Schlüssels wird hier beschrieben: https://developers.google.com/maps/documentation/javascript/get-api-key
- ``feuerwehrLat: <String>``
    - Breitengrad Feuerwehrgerätehaus (Start-Position Google Maps Route).
- ``feuerwehrLng: <String>``
    - Längengrad Feuerwehrgerätehaus (Start-Position Google Maps Route).
- ``enableMotionDetector: <true|false>``
    - Aktivierung des Bewegungsmelders, welcher den Einsatzmonitor bei Bewegung für 10 Minuten einschalten kann, wenn sich dieser in der Standbyansicht befindet.
        - Wenn der Monitor bei einem Einsatz in die Alarmansicht wechselt, wird unabhängig von dieser Einstellung der Bildschirm immer eingeschaltet, auch ohne Bewegung.
- ``motionDetectorPath: <"/pfad/zum/Einsatzmonitor/motion/motion">``
    - Gibt den Dateipfad zu der zu überwachenden Datei an, welche bei Bewegung überschrieben wird.
    - Wenn der Einsatzmonitor nach dieser Anleitung in /opt/einsatzmonitor installiert wurde, sollte hier "/opt/einsatzmonitor/motion/motion" eingetragen werden.
- ``displayAlwaysOn: <true|false>``
    - Ist dieser Wert auf "true", wird der Monitor zu keiner Zeit ausgeschaltet.

## :computer: Bildschirmschoner deaktivieren 

1. Benötigte Pakete installieren
    - ``$ apt install x11-xserver-utils``   
2. Datei bearbeiten
    - ``$ nano /etc/X11/xinit/xinitrc``
    - Folgenden Inhalt einfügen:
        ```
        @xset s off
        @xset -dpms
        @xset s noblank
        ```
3. RaspberryPi neustarten
4. Sollten diese Einstellungen noch keine Wirkung zeigen, gibt es hier weitere Informationen: https://raspberrypi.stackexchange.com/questions/752/how-do-i-prevent-the-screen-from-going-blank/753#753

## :eyes: Bewegungsmelder an RaspberryPi anschließen und Bildschirm ein/ausschalten

Es ist möglich über die GPIO-Pins des RaspberryPi einen Bewegungsmelder anzuschließen und mit einem simplen Python-Script abzufragen.
Das Script überschreibt bei Bewegung eine Datei 'motion' im Ordner ./einsatzmonitor/motion.
Der Einsatzmonitor erkennt die Dateiänderung und schaltet den Bildschirm für 10 Minuten ein. Wird keine Bewegung mehr erkannt, wird der Bildschirm nach Ablauf der 10 Minuten wieder ausgeschaltet.

Sobald ein Einsatz angezeigt wird, wird der Bildschirm immer eingeschaltet und erst nach Ende der 'einsatzDisplayTime' wieder ausgeschaltet.

Für das Script zur Bewegungserkennung kann ein Systemd-Service angelegt werden. Dadurch wird das Script direkt beim Systemstart gestartet.

1. Systemd-Script nach ``/etc/systemd/system/pir.service`` kopieren.
    - ``$ cd /opt/einsatzmonitor/motion``
    - ``$ cp pir.service /etc/systemd/system/``
2. Systemd daemon reloaden
    - ``§ systemctl daemon-reload``
3. Service aktivieren und starten
    - ``$ systemctl enable pir``
    - ``$ systemctl start pir``
4. Der Service sollte nun gestartet sein
    - ``$ systemctl status pir``
![Standbyansicht](http://134.255.237.237/einsatzmonitor-pir.png "Bewegungsmelder service")

Das Ein- und Ausschalten des Bildschirms geschieht intern über die Befehle ``$ vcgencmd display_power 1`` sowie ``$ vcgencmd display_power 0``, wodurch der HDMI-Port Ein- und Ausgeschaltet wird.


## :interrobang: Support
Für Fragen und Anregungen stehe ich gerne zur Verfügung!