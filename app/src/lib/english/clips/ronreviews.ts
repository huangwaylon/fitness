// “Ron's Reviews | Parks and Recreation” (the official Parks and Recreation channel, Season 6): inspired by Yelp, Ron
// mails strongly worded letters to places he dislikes; Donna fires a “troll” who isn't hers to fire; a vegan restaurant
// owner comes to ask about a letter nailed to the door, and Ron explains why he always signs his real name.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–1.9 s (“Speaking of bad reviews”: the
// speaker isn't clear), 59–68 s (the Canada letter: whether “you.” is the whole letter is a delivery call), 114 s on
// (music). Named in the audio: Donna (38.6 s); Ron is named only by the title; the other speakers are “her visitor”,
// “Ron's visitor”/“the owner” and “a coworker”.
//   open: 42–44 s captions “what you tried to adopt the cat”, whisper “What? You tried to adopt a cat” (no key depends
//   on it); 99.4 s captions “gonna”, whisper “going to” (i3's line trims it)
// REVIEW 2026-11-16: pass 5, fix 16, drop 2, new 0; ear checks 0
// EAR CHECK: none (every key's words agree in whisper and the captions; nt3, the stress item, was dropped)
import type { Clip } from '../types.ts';

export const ronsReviews: Clip = {
  id: 'ronreviews', video: 'GujKyNduy0c', title: 'Ron’s Reviews', dur: 135, wpm: 138, band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): only the key had “finds online”. All three now name a target found or judged online.
    // why: post reviews ← “that Yelp thing” and “the internet” heard as him posting online; to Yelp ← keyword trap,
    //   the site he names becomes the addressee
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['letters'], seg: [1.9, 19.0],
      stem: 'In his opening comment, what has Yelp given Ron the idea to do?',
      choices: ['Mail sharp letters to places he looks up online', 'Post sharp reviews of places he looks up online',
                'Mail sharp letters to Yelp about places he dislikes'], a: 0,
      cue: 'internet を何に使うか、文の後半。',
      line: 'I am using the internet *to get addresses* where I can send them.',
      said: 'Yelpを見て思いついた。きつい手紙を書き、ネットで調べた住所に送っている。',
      mean: 'ネットは住所を調べる道具だけ。批判は紙の手紙で届ける。',
      trap: 'Yelp や internet で投稿の話に思える。to get addresses の目的を聞く。',
      use: 'I looked up the address online.（住所はネットで調べた）' },

    // R fix: V2 (blind 75 %): “gave him an idea” echoed g1's stem and only the key had it. The exception is now shared.
    // why: useful ← -less and -ful endings blur, and “great idea” follows; confusing ← the older-man-meets-computers
    //   script (he finds them confusing)
    { id: 't1', skill: 'attitude', level: 'B1', point: 'computers', seg: [1.9, 9.2],
      stem: 'How does Ron feel about computers, from his opening words?',
      choices: ['Mostly useless, with one exception', 'Mostly useful, with one exception',
                'Mostly confusing, with one exception'], a: 0,
      cue: '文の最初の評価と、but のあと。',
      line: 'Computers are *mostly pointless*, but that Yelp thing gave me *a great idea*',
      said: 'コンピューターはほぼ無意味。でもYelpはいい案をくれた。',
      mean: 'pointless ＝ 意味がない。全体は否定し、一つだけ使い道を認めている。',
      trap: '-less と -ful は聞き分けにくい。but のあとの great idea と逆向きの評価。',
      use: 'Mostly pointless, but this one helps.（ほぼ無意味、でもこれは役立つ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'computers', seg: [1.9, 7.0],
      stem: 'Type what Ron says: “Computers are ___.” (2 words)', answer: 'mostly pointless',
      cue: '文の最初、Computers are のあと。',
      line: 'Computers are *mostly pointless*,',
      said: 'コンピューターはほとんど意味がない、と言っている。',
      mean: 'pointless の t はほぼ消え、「ポインレス」に近い。mostly の t も弱い。',
      trap: 't が消えると別の語を探したくなる。-less で終われば「〜がない」という形容詞。',
      use: 'That meeting was pointless.（あの会議は無意味だった）' },

    // R fix: V2 (blind 80 %): after g1 the letters are plainly critical, so “praise” fell away. All three now complain.
    // why: heavy type ← “strongly” read as how the letters look (literal); polite ← the Japanese frame of a formal
    //   抗議文, where a complaint is worded carefully
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'letters', seg: [9.9, 18.9],
      stem: 'What kind of letters is Ron composing?',
      choices: ['Letters that complain in harsh words', 'Letters that complain in big, heavy type',
                'Letters that complain in polite words'], a: 0,
      cue: '「about things I…」まで続けて聞く。',
      line: 'I am composing *strongly worded letters* about things I *disapprove of*',
      said: '気に入らない物に、強い言葉の手紙を書いている。',
      mean: 'strongly worded ＝ 言葉がきつい、抗議の調子。disapprove of とセット。',
      trap: 'strongly を見た目の太字と取りやすい。worded は言葉の選び方の話。',
      use: 'I sent them a strongly worded email.（きつめのメールを送った）' },

    // why: ice cream ← “Be ice cream” is said in the letter itself; farm ← first on his list, and celery is a vegetable
    { id: 'd1', skill: 'detail', level: 'B1', point: 'yogurt', reveals: ['celery'], seg: [22.3, 36.0],
      stem: 'Who is the letter Ron reads out addressed to?',
      choices: ['A frozen yogurt bar', 'An ice cream parlor', 'A vegetable farm'], a: 0,
      cue: '読み上げる手紙の、最初の呼びかけ。',
      line: '*Dear frozen yogurt*, you are the celery of desserts.',
      said: '「親愛なるフローズンヨーグルトへ」で始まり、デザート界のセロリだと言う。',
      mean: '手紙はリスト最後の、低脂肪フローズンヨーグルト店あて。',
      trap: 'ice cream も celery も手紙に出るので混ざりやすい。宛先は Dear のすぐあと。',
      use: 'Dear Sir or Madam,（ご担当者様）' },

    // R drop: i1 (V1 + V2, blind 70 %): “celery = diet food” is world knowledge, and no audio refutes “tastes like
    //   greens”. nt2 tests the same line from the “Be ice cream or be nothing” side. Deleted (never shipped).

    // R fix: V2 (blind 60 %): the advice distractor was too soft to tempt. It's now a mild ranking (“fine, but…”).
    //   The stem no longer names the yogurt bar, which gave d1 away.
    // why: only ice cream ← scope shift: the demand on “you” heard as a ranking of all desserts; more flavor ← the
    //   Japanese frame: criticism softened into a polite ranking (まあまあ)
    // anchor: 29.1–36.0 s “you are the celery of desserts” (a diet stand-in), “Be ice cream or be nothing” (no middle
    //   way, said to “you”), “Zero stars” (no credit for trying): no advice, and the target is the yogurt itself
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'celery', reveals: ['yogurt'], seg: [28.6, 36.6],
      stem: 'Which plain-English version keeps what Ron’s letter says?',
      choices: ['“A treat should go all the way, or not exist.”', '“Ice cream is the only dessert worth eating.”',
                '“You’re fine, but ice cream does it better.”'], a: 0,
      cue: '比喩、命令、星の数の3つを合わせて。',
      line: 'you are the celery of desserts. *Be ice cream or be nothing.* Zero stars.',
      said: '「デザート界のセロリ。アイスか無になれ。星ゼロ」と書く。',
      mean: '「or be nothing」は中間を認めない形。健康ぶった半端なデザートに、ある意味はないという主張。',
      trap: '批判を「まあまあ」程度の評価と取りがち。星ゼロで、認める所は残していない。命令の相手は you で、順位の話でもない。',
      use: 'Go big or go home.（やるなら全力、でなければやめとけ）' },

    // why: sixteen ← “six” plus the c of “cats” heard as a -teen ending; sixty ← the same, as -ty; two ← “to” just
    //   before (“for you to have”)
    { id: 'n1', skill: 'number', level: 'B1', point: 'cats', seg: [41.6, 50.85],
      stem: 'Donna thought it was too sad for her visitor to have how many cats?',
      choices: ['Two', 'Six', 'Sixteen', 'Sixty'], a: 1, keep: true,
      cue: '「too sad for you to have」のあと。',
      line: 'too sad for you to have *six cats*.',
      said: '先週、猫の里親を断った。猫6匹は悲しすぎるから、と言う。',
      mean: 'six のすぐあとに cats。-teen や -ty の長い語尾はない。',
      trap: 'x と c がつながり、語尾が長く聞こえることがある。-teen なら強く伸びる。',
      use: 'I have two cats and a dog.（猫2匹と犬1匹を飼ってる）' },

    // why: turned it ← “you” shrinks to a weak “ya”, close to “it”; told you ← the vowel of “turned” is lost at speed;
    //   turn you ← the -ed melts into the y of “you”
    { id: 's2', skill: 'sound', level: 'C1', point: 'turndown', seg: [42.3, 48.2],
      stem: 'Fill the gap: “…and I ___ down.”',
      choices: ['turned you', 'turned it', 'told you', 'turn you'], a: 0,
      cue: 'adopt のあと、down の直前の2語。',
      line: 'You tried to adopt a cat last week, and I *turned you* down',
      said: '先週、猫を引き取りたいと言われ、断ったと言っている。',
      mean: 'turned you は d と y がつながり「ターンジュ」に近い。turn ～ down ＝ 断る。',
      trap: 'd と y が溶け、-ed も消えやすい。last week なので過去形。',
      use: 'They turned me down for the job.（その仕事、断られた）' },

    // R fix: V2 (blind 70 %): “as payback”/“as thanks” framed the key. All three are now “Make her … / Find …”
    //   without a motive word.
    // why: famous ← “blow up” also means “suddenly get popular”; another cat ← the refused adoption just before,
    //   so going online sounds like looking elsewhere
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'spot', seg: [42.3, 50.85],
      stem: 'What does Donna say her visitor tried to do online?',
      choices: ['Make her look bad online', 'Make her famous online', 'Find another cat online'], a: 0,
      cue: '「troll」という呼び方と、then の流れ。',
      line: 'Then you tried to *blow up my spot* online. You’re fired.',
      said: '猫を断られた仕返しに、ネットでたたいた、と責めている。',
      mean: 'blow up someone’s spot ＝ 人の評判を落とす。troll（荒らし）もそのため。',
      trap: 'blow up には「人気が出る」の意味もあるが、断った話の続きなので仕返し。',
      use: 'Someone trashed our café online.（誰かがうちのカフェをネットでけなした）' },

    // R fix: V2 (blind 60 %): “quit last week” was weak. Now a volunteer reading (the cat shelter script).
    // why: volunteer ← the adoption story suggests a shelter helper, not staff; court ← “attorney” heard as a lawsuit
    { id: 'd2', skill: 'detail', level: 'B2', point: 'boss', seg: [50.5, 55.4],
      stem: 'What reason is given that Donna can’t fire her visitor?',
      choices: ['The visitor works for another office', 'The visitor is only there as a volunteer',
                'The visitor is taking her to court'], a: 0,
      cue: '「You’re not my boss」の理由の文。',
      line: 'You’re *not my boss*. I work for the *city attorney’s office*.',
      said: '「あなたは上司じゃない。市の弁護士事務所で働いている」と返す。',
      mean: 'Donna の部下ではないので、クビにする権限がない。',
      trap: 'attorney から裁判を連想しやすいが、話は勤め先。I work for のあとは職場。',
      use: 'I work for the city, not for you.（私は市の職員で、あなたの部下じゃない）' },

    // R fix: V2 (blind 70 %): only the key mentioned “being told she can’t”. All three now start “She says it again”.
    // why: joke ← a repeated line can sound like a joke (Just kidding); talking back ← a second firing usually
    //   comes with a second offence, and “You're not my boss” sounds like one
    { id: 'h1', skill: 'humor', level: 'C1', point: 'fired', reveals: ['boss'], seg: [50.5, 58.3],
      stem: 'Why does the audience laugh at Donna’s last words to her visitor?',
      choices: ['She says it again, as if she had the power', 'She says it again, now for talking back to her',
                'She says it again, but as an obvious joke'], a: 0,
      cue: '「city attorney’s office」のあとの一言。',
      line: 'I work for the city attorney’s office. — *You’re fired.*',
      said: '別の役所で働いていると言われても、もう一度「クビ」と言う。',
      mean: 'あなたに権限はないと言われた直後に、同じ言葉をくり返す強引さが笑い。',
      trap: '冗談なら Just kidding などが付く。言葉は前と同じで、新しい理由もない。',
      use: 'I don’t care. Still no.（関係ない。それでもダメ）' },

    // why: farm ← on Ron's list, and vegan/vegetable start alike; yogurt bar ← the letter Ron read out
    { id: 'd3', skill: 'detail', level: 'B1', point: 'vegan', seg: [69.9, 77.6],
      stem: 'What business does Ron’s visitor say they run?',
      choices: ['A vegan restaurant', 'A vegetable farm', 'A frozen yogurt bar'], a: 0,
      cue: '「Yeah, I own」のあと。',
      line: 'I own Lettuce Eat, *the vegan restaurant* on Lowell Drive',
      said: '「ビーガンレストラン、レタス・イートのオーナーです」と名乗る。',
      mean: '店名のあとに、どんな店かを説明している。',
      trap: 'vegan と vegetable は頭の音が同じで、リストの野菜農場と混ざりやすい。own のあとを聞く。',
      use: 'I own a small café downtown.（町なかで小さなカフェをやってます）' },

    // R fix: V2 (blind 75 %): the key was the only choice where Ron holds firm. All three now “stand by them”.
    //   The “fake name” choice hints he signs his real name, so it also reveals `realname`.
    // why: fake name ← the coworker's surprised question seems to change his mind; last one ← the usual sitcom
    //   ending after an upset visitor (he keeps his view but quits)
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['signname', 'soda', 'realname'], seg: [69.9, 113.9],
      stem: 'By the end of the clip, where does Ron stand on his letters?',
      choices: ['He stands by them and has another one going out', 'He stands by them, but will sign a fake name now',
                'He stands by them, but this will be the last one'], a: 0,
      cue: '最後の「Which is why」以降の話。',
      said: 'ビーガンの店主が来ても動じず、本名を書くのは当然と言い、次は炭酸水のメーカーに出すつもり。',
      mean: '抗議を受けても方針は変えない。むしろ次の相手まで決めている。',
      trap: '同僚の驚きで方針を変えると思いやすい。最後の一文が、次の手紙の予告になっている。',
      use: 'I stand by what I said.（言ったことは撤回しない）' },

    // R fix: V2 (blind 80 %): “to my door” in the stem made “nailed” the only fit. The stem now stops at “letter”.
    // why: mailed ← /n/ and /m/ are both nasal at the start, and letters are mailed; sent ← the usual way a letter
    //   arrives
    { id: 's1', skill: 'sound', level: 'B2', point: 'nailed', seg: [73.4, 77.6],
      stem: 'Fill the gap: “I wanted to know why you ___ this letter…”',
      choices: ['nailed', 'mailed', 'sent'], a: 0,
      cue: '「why you」のすぐあと、文の動詞。',
      line: 'why you *nailed* this letter to my door.',
      said: 'この手紙を、なぜ店のドアに打ちつけたのか聞きに来た、と言う。',
      mean: 'nail ＝ 釘で留める。郵送ではなく、ドアに直接打ちつけたことが笑い。',
      trap: 'n と m は鼻にかかる音で似ている。to my door と合わせると、届け方の話だと分かる。',
      use: 'Someone nailed a notice to the door.（誰かがドアに貼り紙を打ちつけた）' },

    // R fix: V2 (blind 65 %): “greet before explaining more” didn't fit the moment. Now a softener reading.
    // why: wish well ← the literal reading, good day = よい一日を; soften ← the Japanese frame of a polite closing
    //   that cushions a blunt answer (では失礼します)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'goodday', seg: [83.9, 87.3],
      stem: 'Right after “Because I believe it”, what do Ron’s next two words do?',
      choices: ['Close the talk and dismiss the owner', 'Wish the owner well despite the letter',
                'Make his blunt answer sound less harsh'], a: 0,
      cue: '理由を言った直後、短い二語の役目。',
      line: 'Because I believe it. *Good day.*',
      said: 'なぜ手紙を、と聞かれ「そう信じているから。では、ごきげんよう」と言う。',
      mean: '改まった Good day は、ここでは「話は終わり、お帰りください」という合図。',
      trap: '直訳すると「よい一日を」で親切に見える。理由を言い切った直後なら、話を打ち切る一言。',
      use: 'That’s all I have to say. Good day.（以上です。では失礼）' },

    // R fix: V2 (blind 55 %): only the key had “meat eater”. “Curious” is now “scared”, which shares it.
    // why: amused ← the scene is funny, and a joke is an easy exit; scared ← Ron's curt “Good day” just before
    //   reads as a threat
    { id: 't2', skill: 'attitude', level: 'B2', point: 'carnivores', seg: [86.2, 90.5],
      stem: 'In the owner’s parting words, what is the owner’s attitude toward Ron?',
      choices: ['Fed up, writing Ron off as one more meat eater', 'Amused, treating Ron’s whole letter as a silly joke',
                'Scared, backing away from an angry meat eater'], a: 0,
      cue: '去りぎわの一語と、「all the same」。',
      line: '*Carnivores. You’re all the same.*',
      said: '去りぎわに「肉を食べる人は、みんな同じだ」と言い捨てる。',
      mean: 'Ron 一人でなく、肉を食べる人全体をひとまとめに見下す、あきれた決めつけ。',
      trap: '直前の Good day が強く、おびえて去ると取りやすい。all the same は見下す言い方。',
      use: 'Typical. You’re all the same.（やっぱりね。みんな同じ）' },

    // R fix: V4 + K5 (blind 65 %): it's stated, so detail, not infer; the key was the only one with Ron as subject.
    //   All three are now “The owner …”.
    // why: internet ← Ron uses the internet to find addresses, so the owner might too; followed ← he nailed it to the
    //   door himself, so he could have been seen there (refuted: “saw my name and address at the bottom”)
    { id: 'i2', skill: 'detail', level: 'B2', point: 'signname', reveals: ['nailed'], seg: [90.8, 99.35],
      stem: 'When a coworker asks how the owner found Ron, what does Ron say?',
      choices: ['The owner read his address on the letter', 'The owner looked him up on the internet',
                'The owner saw him at the door that night'], a: 0,
      cue: '「I assume」のあと、手紙のどこを見たか。',
      line: 'he saw *my name and address* at the bottom of the letter I nailed to his door.',
      said: '「手紙の最後の名前と住所を見たんだろう」と平然と答える。',
      mean: '自分で住所まで書いていた。見つかって当然で、気にしていない。',
      trap: 'Ron がネットで住所を調べた話から、相手も同じと思いやすい。答えは the bottom of the letter。',
      use: 'My name and number are at the bottom.（名前と番号は下に書いてあります）' },

    // R fix: N7: the line shows he signed his real name, i2's key. Reveals `signname`.
    { id: 'x2', skill: 'dict', level: 'B2', point: 'realname', reveals: ['signname'], seg: [96.6, 99.35],
      stem: 'Type the coworker’s question: “You ___ real name?” (2 words)', answer: 'signed your',
      cue: '「door」のあと、驚いた問いの中ほど。',
      line: 'You *signed your* real name? — Of course I did.',
      said: '「本名で署名したの？」と聞かれ、「もちろん」と答える。',
      mean: 'signed の d と your がつながり、「サインジョア」に近い。',
      trap: 'd が y と溶けて消えたように聞こえ、sign your と書きやすい。返事の did で過去と分かる。',
      use: 'Did you sign your name on the form?（用紙に名前を書いた？）' },

    // R drop: nt3 (C2 stress; V2 + V3, blind 80 %): contrastive stress on “real” is the default reading of the
    //   words, so the item tests common sense, not the ear. Deleted (never shipped); its ear check went with it.

    // R fix: N7: the line names vegans (d3's key). Reveals `vegan`. nt1 no longer repeats “too weak”.
    // why: peaceful ← the common image of vegans as gentle people; see through ← glass = 透明 (literal reading)
    { id: 'i3', skill: 'infer', level: 'C1', point: 'glass', reveals: ['vegan'], seg: [98.5, 105.35],
      stem: 'What reason does Ron give for feeling safe from the owner?',
      choices: ['Vegans are too weak to hurt anyone', 'Vegans are too peaceful to hurt anyone',
                'Vegans are too easy to see through'], a: 0,
      cue: '「physically attack」のあとの比べ方。',
      line: 'a vegan is … *physically attack* me? They are basically *made of glass*.',
      said: '「ビーガンが殴りかかる？彼らはほぼガラスでできている」と言う。',
      mean: 'made of glass ＝ もろい。体が弱いから怖くない、という Ron の偏見。',
      trap: 'ガラスは透明なので「見えすいた」と取りやすい。attack の直後なので体の強さの話。',
      use: 'Don’t worry, he’s harmless.（心配ない、あの人は無害だよ）' },

    // R fix: V2 (blind 55 %): “a whole different topic” was weak. Now “a smaller, side reason” (weight reversed).
    //   N7: the line shows he signs his name, so it reveals `signname`.
    // why: taking back ← “but” heard as a correction of the glass remark; side reason ← “but” + a second reason
    //   heard as an afterthought, missing “more importantly”
    { id: 'm1', skill: 'marker', level: 'B2', point: 'importantly', reveals: ['signname'], seg: [102.9, 113.9],
      stem: 'After the glass remark, what does Ron signal with his next words?',
      choices: ['The reason that matters most is coming', 'He is taking back what he just said',
                'A smaller, side reason is coming next'], a: 0,
      cue: '「glass」のあと、but に続く2語。',
      line: '*But more importantly*, if you believe in something, you sign your name to it',
      said: '「でももっと大事なのは、信じることには名前を書くこと」。',
      mean: 'more importantly ＝ こちらが本題という合図。前の理由も生きている。',
      trap: 'but で前の否定と思いやすいが、but more importantly は重みを足すだけ。',
      use: 'It’s cheap. But more importantly, it’s close.（安い。でももっと大事なのは近いこと）' },

    // R fix: V2 (blind 50 %) + N7: “Vegans, whom Ron calls too weak” gave i3's key. That distractor is now the
    //   coworker he is answering (right mechanism, wrong target). Reveals `signname` (the line).
    // why: coworker ← the surprised “You signed your real name?” just before, so the rule seems aimed at that doubt
    //   (right mechanism, wrong target); water makers ← “will soon know exactly where to find me” heard as a threat that lands on them
    // anchor: 105.4–113.4 s “if you believe in something, you sign your name to it. Which is why the makers of
    //   carbonated water will soon know exactly where to find me”: the grand rule is spent on fizzy water, and the
    //   object is “me”: they will find him, he isn't exposing them
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'soda', reveals: ['signname'], seg: [102.9, 113.9],
      stem: 'In Ron’s last lines about signing his name, who is the joke on?',
      choices: ['Ron, whose grand rule ends at fizzy water', 'The coworker, who doubts Ron’s grand rule',
                'The water makers, whom Ron will expose'], a: 0,
      cue: '大きな信念と、最後に出てくる相手の小ささ。',
      line: 'if you *believe in something*, you sign your name to it. Which is why the makers of *carbonated water*…',
      said: '「信じることには名前を書く。だから炭酸水メーカーはすぐ僕を見つける」と言う。',
      mean: '立派な信念の行き先は、炭酸水への抗議の手紙。本人は真剣で、その大げささが笑われている。',
      trap: '直前に驚いた同僚が笑われ役に見えやすい。最後の me を追えば、見つかるのは Ron で、笑いも Ron に向く。',
      use: 'I stand by my words. Even about pizza.（言ったことは曲げない。ピザのことでも）' },
  ]
};
