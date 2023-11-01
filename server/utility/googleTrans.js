const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate({
  projectId: process.env.GOOGLE_PROJECT_ID,
  key: process.env.GOOGLE_TRANS_KEY,
});

exports.translateText = async function translateText(text, target) {
  try {
    let [translations] = await translate.translate(text, target);
    translations = Array.isArray(translations) ? translations : [translations];
    const result = translations.join(' ');
    console.log('Translations: ', result);
    return result;
  } catch (error) {
    console.log(`Translation error: ${error} message: ${text} target: ${target}`);
  }

  return '';
};

/**
 * 아프리칸스어	af
알바니아어	sq
암하라어	am
아랍어	ar
아르메니아어	hy
아삼어	as
아이마라어	ay
아제르바이잔어	az
밤바라어	bm
바스크어	eu
벨라루스어	be
벵골어	bn
보지푸리어	bho
보스니아어	bs
불가리아어	bg
카탈루냐어	ca
세부아노어	ceb
중국어(간체)	zh-CN 또는 zh(BCP-47)
중국어(번체)	zh-TW(BCP-47)
코르시카어	co
크로아티아어	hr
체코어	cs
덴마크어	da
디베히어	dv
도그리어	doi
네덜란드어	nl
영어	en
에스페란토	eo
에스토니아어	et
에웨어	ee
필리핀어(타갈로그어)	fil
핀란드어	fi
프랑스어	fr
프리지아어	fy
갈리시아어	gl
조지아어	ka
독일어	de
그리스어	el
과라니어	gn
구자라트어	gu
아이티 크리올어	ht
하우사어	ha
하와이어	haw
히브리어	he 또는 iw
힌디어	hi
몽어	hmn
헝가리어	hu
아이슬란드어	is
이보어	ig
일로카노어	ilo
인도네시아어	id
아일랜드	ga
이탈리아어	it
일본어	ja
자바어	jv 또는 jw
칸나다어	kn
카자흐어	kk
크메르어	km
키냐르완다어	rw
콘칸어	gom
한국어	ko
크리오어	kri
쿠르드어	ku
쿠르드어(소라니어)	ckb
키르기스어	ky
라오어	lo
라틴어	la
라트비아어	lv
링갈라어	ln
리투아니아어	lt
루간다어	lg
룩셈부르크어	lb
마케도니아어	mk
마이틸리어	mai
말라가시어	mg
말레이어	ms
말라얄람어	ml
몰타어	mt
마오리어	mi
마라티어	mr
메이테이어(마니푸르어)	mni-Mtei
미조어	lus
몽골어	mn
미얀마어(버마어)	my
네팔어	ne
노르웨이어	no
니안자어(치츄어)	ny
오리야어	or
오로모어	om
파슈토어	ps
페르시아어	fa
폴란드어	pl
포르투갈어(포르투갈, 브라질)	pt
펀자브어	pa
케추아어	qu
루마니아어	ro
러시아어	ru
사모아어	sm
산스크리트어	sa
스코틀랜드 게일어	gd
북소토어	nso
세르비아어	sr
세소토어	st
쇼나어	sn
신디어	sd
스리랑카어(싱할라어)	si
슬로바키아어	sk
슬로베니아어	sl
소말리어	so
스페인어	es
순다어	su
스와힐리어	sw
스웨덴어	sv
타갈로그어(필리핀어)	tl
타지크어	tg
타밀어	ta
타타르어	tt
텔루구어	te
태국어	th
티그리냐어	ti
총가어	ts
튀르키예어	tr
투르크멘어	tk
트위어(아칸어)	ak
우크라이나어	uk
우르두어	ur
위구르어	ug
우즈베크	uz
베트남어	vi
웨일즈어	cy
코사어	xh
이디시어	yi
요루바어	yo
줄루어	zu
 */
