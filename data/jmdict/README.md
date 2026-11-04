# JMdict English data

`JMdict_e.gz` is the English edition of the JMdict Japanese-English dictionary.
It is the unmodified compressed data file downloaded from EDRDG:

- Data source: <https://www.edrdg.org/pub/Nihongo/JMdict_e.gz>
- Project information: <https://www.edrdg.org/jmdict/j_jmdict.html>
- License: Creative Commons Attribution-ShareAlike 4.0 International
  (<https://creativecommons.org/licenses/by-sa/4.0/>)
- Copyright and attribution terms: <https://www.edrdg.org/edrdg/licence.html>
- CC BY-SA 4.0 license text: [`CC-BY-SA-4.0.html`](./CC-BY-SA-4.0.html)

EDRDG and the JMdict project must be credited in software documentation and in
any screen that displays dictionary data. If the data is transformed or
redistributed, the applicable ShareAlike terms must also be followed.

Before development and production builds, the JMdict source is converted to a
compact, gzip-compressed search index (`index.json.gz.data`) under `public/data/jmdict/`. The generated
index is ignored by Git and is rebuilt from `JMdict_e.gz`.

The Dictionary and Explorer screens display source attribution and link to this
project page and the license.
