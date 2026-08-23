# Handritssnið

Lestrarútgáfan sækir `manuscript.txt` sem venjulegan UTF-8 texta. Skráin er
lítil, þjappast vel á vefþjóni og krefst aðeins einnar vefbeiðni.

## Hljóðblokk

```text
@@track Ker 3.m4a
@@title Sýnilegt kaflaheiti
Texti sem tilheyrir upptökunni byrjar hér.
```

`@@track` verður að passa nákvæmlega við skráarheitið. Röð blokkanna skiptir
ekki máli.

## Síður og samstilling

Án síðumerkja skiptir vefurinn textanum sjálfkrafa í um 210 orða síður:

```text
@@track Ker 4.m4a
@@title Kaflaheiti
Langur samfelldur texti...
```

Föst síðuskil án nákvæmra tíma dreifast jafnt yfir hljóðskrána:

```text
Fyrsta síða...
@@page
Önnur síða...
```

Nákvæm tímamerki gefa bestu sjálfvirku flettinguna:

```text
@@page 00:00
Fyrsta síða...
@@page 01:24.5
Önnur síða sem birtist eftir 1:24,5...
```

## Word

Í Word skal hver hljóðblokk byrja á eigin málsgrein:

```text
Ker 3.m4a | Kaflaheiti
```

Notaðu venjuleg Word-síðuskil innan blokkarinnar. Flyttu svo skjalið inn með:

```sh
python3 tools/import_docx.py handrit.docx content/manuscript-new.txt
```

Verkfærið skrifar ekki yfir skrá sem er þegar til nema `--force` sé gefið.
Farðu yfir niðurstöðuna áður en hún kemur í stað `content/manuscript.txt`.
