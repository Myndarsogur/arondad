/**
 * HANDRITIÐ
 *
 * Límdu texta hverrar upptöku í `text`. Skrifaðu línu sem inniheldur aðeins
 * `---` þar sem ákveðin síðuskil eiga að vera. Ef engin síðuskil eru sett
 * skiptir lesarinn textanum sjálfkrafa í um 210 orða A6-síður.
 *
 * `pageStarts` segir hvenær hver síða byrjar sem hlutfall af hljóðskránni
 * (0–1). Dæmi fyrir fjórar jafnlangar síður: [0, 0.25, 0.5, 0.75].
 * Þegar nákvæm tímamerki liggja fyrir má nota `pageStartSeconds` í staðinn.
 */
export const manuscript = {
  "chapter-3": {
    title: "Dæmi um kafla á fjórum síðum",
    pageStarts: [0, 0.25, 0.5, 0.75],
    text: `Morguninn lá mjúkur yfir höfninni. Húsin við bryggjuna voru enn lokuð og sjórinn bar aðeins daufan óm af keðjum, köðlum og fuglum sem kölluðu langt úti. Í glugganum sat ljós sem hafði gleymst frá nóttinni. Það lýsti á borð, gamalt blað og einn lykil sem enginn virtist eiga.

Hann tók lykilinn upp og fann hvað járnið var kalt. Á blaðinu stóð aðeins ein setning, skrifuð með dökku bleki: Farðu þangað sem birtan snertir vatnið. Hann las hana aftur, braut blaðið saman og stakk því í vasann.

---

Við enda bryggjunnar beið lítill bátur. Málningin var sprungin eftir mörg sumur og árar lágu undir bekknum. Þegar hann ýtti frá landi opnaðist mjó rák milli báts og bryggju. Bærinn varð smám saman að lágri rönd fyrir aftan hann.

Sjórinn var ekki kyrr þótt hann virtist þannig úr fjarlægð. Undir bátnum færðist heilt landslag af straumum. Sólin braut yfirborðið í óteljandi smáa fleti og hver þeirra sendi frá sér sína eigin birtu.

---

Þegar hann var kominn nógu langt út sá hann litina. Fyrst rauðan, síðan gylltan og grænan. Þeir virtust hanga í loftinu en héldu áfram niður í vatnið eins og þræðir. Hann lagði árarnar frá sér og leyfði bátnum að reka nær.

Við yfirborðið tvöfölduðust litirnir. Einn hluti þeirra hélt áfram yfir hafið en annar beygði niður í djúpið. Þar niðri urðu þeir hægari og dekkri, en hurfu ekki.

---

Hann hallaði sér fram og sá hvar geislarnir mættust langt undir bátnum. Punkturinn var ekki stærri en stjarna en lýsti samt upp kletta, þang og hreyfingu fiska í kring. Lykillinn í vasa hans varð skyndilega hlýr.

Hann skildi þá að ferðin hafði ekki leitt hann að dyrum á landi. Dyrnar voru þarna niðri, í ljósinu þar sem allir litirnir urðu aftur að einum.`,
  },
};

export const DEFAULT_PAGE_WORDS = 210;
