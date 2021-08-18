# TODO

## Globalt

Fundera på hur vi kan göra state persistent. 

## json-filer
Refactor "levels" in json-files. Vi tror att vi helt skall städa bort dessa från våra json-filer och överallt där de används.används.

name -> description

Ta bort det som kallas för? Vi använder oss av audio_id vilket är stations identifikationen egentligen.

Lägg till stationstyp  i alla json-filer. Ska vara "station" eller "help".

Skriv ett jsonschema och validera alla jsonfiler. t.ex https://json-schema.org/implementations.html#validator-python
Validera att en sträng måste ha specifika värden, t.ex. stationstypen station eller help (se ovan).

## main.js 

Varför kollar vi om använadaren har helpAvailable och spelar ett helptrack specifikt för första stationen. 
Detta kanske skall bort.

Kan vara logik för att spela B-track, bör ligga på station istället för user.helAvailable.

Använd Set istället för object() för state.user.tags och state.user.stationsVisited

## station.js

Hantera conditions som inte är uppfyllda. Just nu blir det endast en console.warn.

## qrscanner.js

Städa upp och gör export av funktioner istället.
