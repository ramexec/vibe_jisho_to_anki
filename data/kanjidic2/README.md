# KANJIDIC2 kanji data

`kanjidic2.xml.gz` is the compressed KANJIDIC2 XML data file downloaded from
EDRDG:

- Data source: <https://www.edrdg.org/kanjidic/kanjidic2.xml.gz>
- Project information: <https://www.edrdg.org/wiki/index.php/KANJIDIC_Project>
- License: Creative Commons Attribution-ShareAlike 4.0 International
  (<https://creativecommons.org/licenses/by-sa/4.0/>)
- Copyright and attribution terms: <https://www.edrdg.org/edrdg/licence.html>
- CC BY-SA 4.0 license text: [`../jmdict/CC-BY-SA-4.0.html`](../jmdict/CC-BY-SA-4.0.html)

KANJIDIC2 provides kanji readings and meanings. Before development and
production builds, it is converted to a compact, gzip-compressed index under
`public/data/kanjidic2/`. The generated index is ignored by Git and rebuilt
from this source file.

The Dictionary and Explorer screens acknowledge KANJIDIC2 and link to its
project page and license.
