# Vanilla af krana — gagnvirk hljóðbók

Sjálfstæður HTML/CSS/JavaScript spilari fyrir þrjú bindi, settur upp sem fyrstu-persónu útsýni af gömlu sjóræningjaskipi. Kortapappír, timbur, haf, neðansjávarljós og regnbogi eru teiknuð með CSS. Engin byggingartól eða ytri JavaScript-söfn eru nauðsynleg.

## Keyrsla

ES-einingar og hljóð þurfa lítinn vefþjón. Úr rót verkefnisins:

```sh
python3 -m http.server 8080
```

Opnaðu svo `http://localhost:8080` í vafra. Einnig má nota hvaða kyrrstæða vefhýsingu sem er.

- `index.html`: varðveitta sjóræningjaskips-/þrívíddarútgáfan.
- `book.html`: einfalda A6-lestrarútgáfan með samstilltum texta og hljóði.
- `flow.html`: nýi hrátextaspilarinn; titilsíður og textasíður flettast án þess
  að hljóð breytist fyrr en farið er yfir mörk næstu `@@track`-blokkar.

Handrit lestrarútgáfunnar er hrá UTF-8 skrá í `content/manuscript.txt`. Hún
inniheldur 98 blokkir sem eru tengdar við hljóðskrár eftir skráarheiti. `@@page`
varðveitir Word-síðuskil og má bera tímamerki fyrir nákvæma sjálfvirka
flettingu. Sjá `content/README.md` og `tools/import_docx.py`.

## Bækur, kaflar og skrár

Öll lýsigögn eru í `src/books.js`. Þar er hægt að breyta:

- `title`: sýnilegt heiti bókar eða kafla;
- `subtitle`: undirheiti bókar;
- `file`: slóð á raunverulega hljóðskrá;
- `accent`: áherslulitur bindis.

Núverandi 98 skrár (`Ker 3.m4a`–`Ker 100.m4a`) skiptast þannig:

- Bók 1: skrár 3–35;
- Bók 2: skrár 36–68;
- Bók 3: skrár 69–100.

Sýnileg kaflaheiti eru óháð skráarheitunum. Því má endurnefna kafla seinna án þess að snerta hljóðskrárnar.

## Stýringar

- Dragðu til hliðar, notaðu örvatakka eða örvahnappa til að líta um herbergið.
- Ýttu á vegg/hurð eða Enter. Hurðin snýst þá um eigin ás og sýnir kaflamatseðilinn.
- Ýttu á pappírshausinn til að spila allt eða á lítinn spilunarhnapp við einstakan kafla.
- Hver lína sýnir bæði kaflaheiti og nákvæmt skráarheiti (`Ker 3.m4a` o.s.frv.).
- Þegar kafli klárast fær hann litmerki og umhverfið færist í næsta lit átta lita ljósferðar.
- Bilslá spilar og gerir hlé þegar bók er opin.
- Escape lokar bókinni.

Viðmótið styður mús, snertingu, lyklaborð, minni hreyfingu (`prefers-reduced-motion`) og helstu nútímavöfrum.
